use serde::{Deserialize, Serialize};

use crate::api::ecdict::EcdictProvider;
use crate::api::provider::WordLookupProvider;
use crate::services::phonetic;

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
    pub mode: TranslationMode,
    pub word_detail: Option<WordDetail>,
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

// Cycle 02 只打通单词主链路：
// 输入文本 -> 离线词典查询 -> 音标谐音转换 -> 前端结果结构。
pub fn translate(app: &tauri::AppHandle, text: &str, mode: TranslationMode) -> Result<TranslationResult, String> {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return Err("请输入要翻译的英文单词".into());
    }

    let resolved_mode = match mode {
        TranslationMode::Auto if contains_whitespace(trimmed) => TranslationMode::Sentence,
        TranslationMode::Auto => TranslationMode::Word,
        other => other,
    };

    if resolved_mode == TranslationMode::Sentence {
        return Err("句子翻译将在 Cycle 03 接入在线翻译链路".into());
    }

    let provider = EcdictProvider;
    let entry = provider
        .lookup(app, trimmed)?
        .ok_or_else(|| format!("离线词典未找到单词：{}", trimmed))?;

    let phonetic = entry.phonetic.clone().unwrap_or_default();
    let definitions = split_definitions(&entry.translation);

    Ok(TranslationResult {
        source_text: entry.word.clone(),
        translated_text: entry.translation.clone(),
        provider: provider.id().into(),
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
    })
}
