use serde::{Deserialize, Serialize};

use crate::api::baidu::BaiduProvider;
use crate::api::deepl::DeepLProvider;
use crate::api::ecdict::EcdictProvider;
use crate::api::ollama::OllamaProvider;
use crate::api::openai::OpenAIProvider;
use crate::api::provider::{
    DictEntry, SentenceTranslateProvider, SentenceTranslation, WordLookupProvider,
};
use crate::api::tencent::TencentProvider;
use crate::api::youdao::YoudaoProvider;
use crate::commands::settings::{load_settings_from_db, AppSettings};
use crate::db::connection;
use crate::services::{cache, dev_name, phonetic};

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
    pub pinyin_phonetic: String,
    pub definitions: Vec<String>,
    pub pos: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SentenceAlternative {
    pub provider: String,
    pub provider_label: Option<String>,
    pub translated_text: String,
    pub from_cache: bool,
    pub notice: Option<String>,
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
    pub alternatives: Vec<SentenceAlternative>,
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

fn first_definition(translation: &str) -> String {
    split_definitions(translation)
        .into_iter()
        .next()
        .unwrap_or_else(|| translation.trim().to_string())
}

fn sentence_providers() -> Vec<Box<dyn SentenceTranslateProvider>> {
    vec![
        Box::new(DeepLProvider),
        Box::new(TencentProvider),
        Box::new(BaiduProvider),
        Box::new(OpenAIProvider),
        Box::new(OllamaProvider),
    ]
}

fn provider_label(provider: &str) -> Option<String> {
    Some(
        match provider {
            "ecdict" => "ECDICT 离线词典",
            "ecdict-devsplit" => "开发者命名拆词",
            "youdao" => "有道词典",
            "deepl" => "DeepL",
            "tencent" => "腾讯翻译",
            "baidu" => "百度翻译",
            "openai" => "OpenAI",
            "ollama" => "Ollama 本地模型",
            other => other,
        }
        .to_string(),
    )
}

fn append_notice(current: Option<String>, extra: impl Into<String>) -> Option<String> {
    let extra = extra.into();
    if extra.trim().is_empty() {
        return current;
    }

    Some(match current {
        Some(current) if !current.trim().is_empty() => format!("{}；{}", current, extra),
        _ => extra,
    })
}

fn store_history(
    app: &tauri::AppHandle,
    source_text: &str,
    result_text: &str,
    mode: TranslationMode,
    provider: &str,
) -> Result<(), String> {
    if let Ok(settings) = load_settings_from_db(app) {
        if settings.privacy_mode {
            return Ok(());
        }
    }

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

fn resolve_sentence_provider_order(settings: &AppSettings) -> Vec<String> {
    let mut chain = Vec::new();

    if settings.translation_provider != "ecdict" {
        chain.push(settings.translation_provider.clone());
    }

    for provider in &settings.fallback_chain {
        if provider != "ecdict" && !chain.contains(provider) {
            chain.push(provider.clone());
        }
    }

    if chain.is_empty() {
        chain.extend([
            "deepl".into(),
            "tencent".into(),
            "baidu".into(),
            "openai".into(),
            "ollama".into(),
        ]);
    }

    chain
}

fn resolve_multi_engine_targets(settings: &AppSettings, provider_order: &[String]) -> Vec<String> {
    let source = if settings.multi_engine_enabled && !settings.multi_engine_list.is_empty() {
        settings.multi_engine_list.clone()
    } else {
        provider_order.to_vec()
    };

    let mut targets = Vec::new();
    for provider in source {
        if provider == "ecdict" || targets.contains(&provider) {
            continue;
        }

        targets.push(provider);
        if targets.len() >= 3 {
            break;
        }
    }

    if targets.is_empty() {
        targets.extend([
            "deepl".into(),
            "tencent".into(),
            "baidu".into(),
            "openai".into(),
            "ollama".into(),
        ]);
    }

    targets
}

fn translate_dev_identifier(
    app: &tauri::AppHandle,
    text: &str,
) -> Result<Option<TranslationResult>, String> {
    let segments = dev_name::split_identifier(text);
    if segments.len() <= 1 {
        return Ok(None);
    }

    let provider = EcdictProvider;
    let mut translated_parts = Vec::new();
    let mut missing_parts = Vec::new();

    for segment in &segments {
        match provider.lookup(app, segment)? {
            Some(entry) => translated_parts.push(first_definition(&entry.translation)),
            None => missing_parts.push(segment.clone()),
        }
    }

    if translated_parts.is_empty() {
        return Ok(None);
    }

    let notice = if missing_parts.is_empty() {
        format!("已按开发者命名拆词：{}", segments.join(" / "))
    } else {
        format!(
            "已按开发者命名拆词，但部分片段未命中：{}",
            missing_parts.join(", ")
        )
    };

    let result = TranslationResult {
        source_text: text.into(),
        translated_text: translated_parts.join(" / "),
        provider: "ecdict-devsplit".into(),
        provider_label: provider_label("ecdict-devsplit"),
        mode: TranslationMode::Sentence,
        word_detail: None,
        from_cache: false,
        notice: Some(notice),
        alternatives: Vec::new(),
    };

    store_history(
        app,
        &result.source_text,
        &result.translated_text,
        result.mode,
        &result.provider,
    )?;

    Ok(Some(result))
}

fn build_word_result(
    source_text: String,
    provider: &str,
    translation: String,
    entry: DictEntry,
    notice: Option<String>,
) -> TranslationResult {
    let phonetic_text = entry.phonetic.clone().unwrap_or_default();
    let definitions = split_definitions(&translation);

    let chinese_phonetic = if phonetic_text.is_empty() {
        "暂无音标谐音".into()
    } else {
        phonetic::to_chinese_hint(&phonetic_text)
    };

    let pinyin_phonetic = if phonetic_text.is_empty() {
        String::new()
    } else {
        phonetic::to_pinyin_hint(&phonetic_text)
    };

    TranslationResult {
        source_text,
        translated_text: translation,
        provider: provider.into(),
        provider_label: provider_label(provider),
        mode: TranslationMode::Word,
        word_detail: Some(WordDetail {
            phonetic_us: entry.phonetic.clone(),
            phonetic_uk: entry.phonetic.clone(),
            chinese_phonetic,
            pinyin_phonetic,
            definitions,
            pos: entry.pos.or(entry.exchange),
        }),
        from_cache: false,
        notice,
        alternatives: Vec::new(),
    }
}

fn translate_word(app: &tauri::AppHandle, text: &str) -> Result<TranslationResult, String> {
    let provider = EcdictProvider;
    let result = if let Some(entry) = provider.lookup(app, text)? {
        build_word_result(
            entry.word.clone(),
            provider.id(),
            entry.translation.clone(),
            entry,
            Some("已按单词模式解析".into()),
        )
    } else {
        let settings = load_settings_from_db(app)?;
        let youdao = YoudaoProvider;
        let entry = youdao.lookup(&settings, text)?.ok_or_else(|| {
            format!("离线词典和有道词典都未找到该单词：{text}")
        })?;

        build_word_result(
            entry.word.clone(),
            "youdao",
            entry.translation.clone(),
            entry,
            Some("ECDICT 未命中，已回退到有道词典".into()),
        )
    };

    store_history(
        app,
        &result.source_text,
        &result.translated_text,
        result.mode,
        &result.provider,
    )?;

    Ok(result)
}

fn run_sentence_provider(
    app: &tauri::AppHandle,
    provider: &dyn SentenceTranslateProvider,
    settings: &AppSettings,
    text: &str,
    emit_stream: bool,
) -> Result<SentenceAlternative, String> {
    if let Some(cached) = cache::get(provider.id(), "en", "zh", text) {
        return Ok(SentenceAlternative {
            provider: provider.id().into(),
            provider_label: provider_label(provider.id()),
            translated_text: cached.translated_text,
            from_cache: true,
            notice: cached
                .notice
                .or_else(|| Some("命中本地缓存，跳过远程请求".into())),
        });
    }

    match provider.translate(app, text, settings, emit_stream) {
        Ok(SentenceTranslation { translated_text, note }) => {
            cache::put(
                provider.id(),
                "en",
                "zh",
                text,
                TranslationResult {
                    source_text: text.into(),
                    translated_text: translated_text.clone(),
                    provider: provider.id().into(),
                    provider_label: provider_label(provider.id()),
                    mode: TranslationMode::Sentence,
                    word_detail: None,
                    from_cache: false,
                    notice: note.clone(),
                    alternatives: Vec::new(),
                },
            );

            Ok(SentenceAlternative {
                provider: provider.id().into(),
                provider_label: provider_label(provider.id()),
                translated_text,
                from_cache: false,
                notice: note,
            })
        }
        Err(error) => Err(error),
    }
}

fn build_sentence_result(text: &str, primary: SentenceAlternative) -> TranslationResult {
    TranslationResult {
        source_text: text.into(),
        translated_text: primary.translated_text,
        provider: primary.provider,
        provider_label: primary.provider_label,
        mode: TranslationMode::Sentence,
        word_detail: None,
        from_cache: primary.from_cache,
        notice: primary.notice,
        alternatives: Vec::new(),
    }
}

fn translate_sentence(app: &tauri::AppHandle, text: &str) -> Result<TranslationResult, String> {
    let settings = load_settings_from_db(app)?;
    let provider_order = resolve_sentence_provider_order(&settings);
    let targets = resolve_multi_engine_targets(&settings, &provider_order);
    let preferred_provider = targets.first().cloned();
    let providers = sentence_providers();
    let mut successes = Vec::new();
    let mut failures = Vec::new();

    for provider_id in targets {
        let Some(provider) = providers.iter().find(|item| item.id() == provider_id) else {
            continue;
        };

        match run_sentence_provider(app, provider.as_ref(), &settings, text, successes.is_empty()) {
            Ok(result) => {
                successes.push(result);
                if !settings.multi_engine_enabled {
                    break;
                }
            }
            Err(error) => failures.push(format!("{}: {}", provider.id(), error)),
        }
    }

    let Some(primary) = successes.first().cloned() else {
        return Err(if failures.is_empty() {
            "当前没有可用的句子翻译 Provider".into()
        } else {
            failures.join("；")
        });
    };

    let mut result = build_sentence_result(text, primary);
    if preferred_provider.as_deref() != Some(result.provider.as_str()) {
        result.notice = append_notice(
            result.notice,
            format!(
                "主翻译源不可用，已切换到 {}",
                result.provider_label.clone().unwrap_or(result.provider.clone())
            ),
        );
    } else if result.notice.is_none() {
        result.notice = Some("已按句子模式解析".into());
    }

    if settings.multi_engine_enabled && successes.len() > 1 {
        result.alternatives = successes.into_iter().skip(1).collect();
    }

    if !failures.is_empty() {
        let summary = if settings.multi_engine_enabled {
            format!("部分引擎不可用：{}", failures.join("；"))
        } else {
            format!("已尝试降级链：{}", failures.join("；"))
        };
        result.notice = append_notice(result.notice, summary);
    }

    store_history(
        app,
        &result.source_text,
        &result.translated_text,
        result.mode,
        &result.provider,
    )?;

    Ok(result)
}

pub fn translate(
    app: &tauri::AppHandle,
    text: &str,
    mode: TranslationMode,
) -> Result<TranslationResult, String> {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return Err("请输入要翻译的内容".into());
    }

    if mode != TranslationMode::Sentence && dev_name::looks_like_identifier(trimmed) {
        if let Some(result) = translate_dev_identifier(app, trimmed)? {
            return Ok(result);
        }
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
