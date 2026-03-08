use serde::{Deserialize, Serialize};

use crate::api::baidu::BaiduProvider;
use crate::api::deepl::DeepLProvider;
use crate::api::ecdict::EcdictProvider;
use crate::api::provider::{SentenceTranslateProvider, SentenceTranslation, WordLookupProvider};
use crate::api::tencent::TencentProvider;
use crate::commands::settings::load_settings_from_db;
use crate::db::connection;
use crate::services::{cache, phonetic};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum TranslationMode {
    Auto,
    Word,
    Sentence,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WordDetail {
    pub phonetic_us: Option<String>,
    pub phonetic_uk: Option<String>,
    pub chinese_phonetic: String,
    pub definitions: Vec<String>,
    pub pos: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranslationResult {
    pub source_text: String,
    pub translated_text: String,
    pub provider: String,
    pub provider_label: Option<String>,
    pub mode: TranslationMode,
    pub word_detail: Option<WordDetail>,
    pub from_cache: bool,
    pub notice: Option<String>,
}

fn contains_whitespace(text: &str) -> bool {
    text.chars().any(char::is_whitespace)
}

fn split_definitions(translation: &str) -> Vec<String> {
    translation
        .split([';', '；'])
        .map(str::trim)
        .filter(|item| !item.is_empty())
        .map(ToOwned::to_owned)
        .collect()
}

fn sentence_providers() -> Vec<Box<dyn SentenceTranslateProvider>> {
    vec![
        Box::new(DeepLProvider),
        Box::new(TencentProvider),
        Box::new(BaiduProvider),
    ]
}

fn provider_label(provider: &str) -> Option<String> {
    Some(match provider {
        "ecdict" => "ECDICT 离线词典",
        "deepl" => "DeepL",
        "tencent" => "腾讯翻译",
        "baidu" => "百度翻译",
        other => other,
    }.to_string())
}

fn store_history(
    app: &tauri::AppHandle,
    source_text: &str,
    result_text: &str,
    mode: TranslationMode,
    provider: &str,
) -> Result<(), String> {
    let conn = connection::open_app_db(app)?;
    let mode = match mode {
        TranslationMode::Word => "word",
        TranslationMode::Sentence => "sentence",
        TranslationMode::Auto => "auto",
    };

    conn.execute(
        "INSERT INTO history (source_text, result_text, mode, provider) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![source_text, result_text, mode, provider],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

fn resolve_sentence_provider_order(settings: &crate::commands::settings::AppSettings) -> Vec<String> {
    let mut chain = Vec::new();

    if settings.translation_provider != "ecdict" {
        chain.push(settings.translation_provider.clone());
    }

    for provider in &settings.fallback_chain {
        if !chain.contains(provider) {
            chain.push(provider.clone());
        }
    }

    if chain.is_empty() {
        chain.extend(["deepl".into(), "tencent".into(), "baidu".into()]);
    }

    chain
}

fn translate_word(app: &tauri::AppHandle, text: &str) -> Result<TranslationResult, String> {
    let provider = EcdictProvider;
    let entry = provider
        .lookup(app, text)?
        .ok_or_else(|| format!("离线词典未找到单词：{}", text))?;

    let phonetic = entry.phonetic.clone().unwrap_or_default();
    let definitions = split_definitions(&entry.translation);

    let result = TranslationResult {
        source_text: entry.word.clone(),
        translated_text: entry.translation.clone(),
        provider: provider.id().into(),
        provider_label: provider_label(provider.id()),
        mode: TranslationMode::Word,
        word_detail: Some(WordDetail {
            phonetic_us: entry.phonetic.clone(),
            phonetic_uk: entry.phonetic,
            chinese_phonetic: if phonetic.is_empty() {
                "暂无音标谐音".into()
            } else {
                phonetic::to_chinese_hint(&phonetic)
            },
            definitions,
            pos: entry.pos.or(entry.exchange),
        }),
        from_cache: false,
        notice: Some("已按单词模式解析".into()),
    };

    store_history(app, &result.source_text, &result.translated_text, result.mode, &result.provider)?;
    Ok(result)
}

fn translate_sentence(app: &tauri::AppHandle, text: &str) -> Result<TranslationResult, String> {
    let settings = load_settings_from_db(app)?;
    let provider_order = resolve_sentence_provider_order(&settings);
    let providers = sentence_providers();
    let mut last_error = String::new();

    for provider_id in provider_order {
        let Some(provider) = providers.iter().find(|item| item.id() == provider_id) else {
            continue;
        };

        if let Some(mut cached) = cache::get(provider.id(), "en", "zh", text) {
            cached.from_cache = true;
            cached.notice = cached
                .notice
                .clone()
                .or_else(|| Some("命中本地缓存，跳过远程请求".into()));
            return Ok(cached);
        }

        let api_key = settings.api_key(provider.id());
        match provider.translate(text, api_key) {
            Ok(SentenceTranslation { translated_text, note }) => {
                let result = TranslationResult {
                    source_text: text.into(),
                    translated_text,
                    provider: provider.id().into(),
                    provider_label: provider_label(provider.id()),
                    mode: TranslationMode::Sentence,
                    word_detail: None,
                    from_cache: false,
                    notice: note.or_else(|| Some("已按句子模式解析".into())),
                };

                cache::put(provider.id(), "en", "zh", text, result.clone());
                store_history(app, &result.source_text, &result.translated_text, result.mode, &result.provider)?;
                return Ok(result);
            }
            Err(error) => {
                last_error = format!("{} 失败：{}", provider.id(), error);
            }
        }
    }

    Err(if last_error.is_empty() {
        "当前没有可用的句子翻译 Provider".into()
    } else {
        last_error
    })
}

// Cycle 03 开始接入句子翻译链路：
// 1. auto 模式自动区分单词 / 句子；
// 2. 单词继续走离线词典；
// 3. 句子走在线 Provider + 缓存 + 降级链。
pub fn translate(app: &tauri::AppHandle, text: &str, mode: TranslationMode) -> Result<TranslationResult, String> {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return Err("请输入要翻译的内容".into());
    }

    let resolved_mode = match mode {
        TranslationMode::Auto if contains_whitespace(trimmed) => TranslationMode::Sentence,
        TranslationMode::Auto => TranslationMode::Word,
        other => other,
    };

    match resolved_mode {
        TranslationMode::Word => translate_word(app, trimmed),
        TranslationMode::Sentence => translate_sentence(app, trimmed),
        TranslationMode::Auto => unreachable!("auto mode must be resolved before dispatch"),
    }
}
