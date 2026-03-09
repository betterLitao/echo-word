use std::time::Duration;

use serde::Deserialize;

use crate::api::http::build_blocking_client;
use crate::api::provider::{SentenceTranslateProvider, SentenceTranslation};
use crate::commands::settings::AppSettings;

pub struct DeepLProvider;

#[derive(Debug, Deserialize)]
struct DeepLTranslationItem {
    text: String,
}

#[derive(Debug, Deserialize)]
struct DeepLResponse {
    translations: Vec<DeepLTranslationItem>,
}

impl DeepLProvider {
    fn development_fallback(text: &str) -> SentenceTranslation {
        SentenceTranslation {
            translated_text: format!("[DeepL 开发占位] {}", text),
            note: Some("未配置 DeepL API Key，当前返回开发期占位结果".into()),
        }
    }
}

impl SentenceTranslateProvider for DeepLProvider {
    fn id(&self) -> &'static str {
        "deepl"
    }

    fn translate(
        &self,
        _app: &tauri::AppHandle,
        text: &str,
        settings: &AppSettings,
        _emit_stream: bool,
    ) -> Result<SentenceTranslation, String> {
        let Some(api_key) = settings.api_key(self.id()).filter(|value| !value.trim().is_empty())
        else {
            if cfg!(debug_assertions) {
                return Ok(Self::development_fallback(text));
            }
            return Err("未配置 DeepL API Key".into());
        };

        let client = build_blocking_client(settings, Duration::from_secs(10))?;
        let response = client
            .post("https://api-free.deepl.com/v2/translate")
            .form(&[
                ("auth_key", api_key),
                ("text", text),
                ("source_lang", "EN"),
                ("target_lang", "ZH"),
            ])
            .send()
            .map_err(|error| error.to_string())?;

        if !response.status().is_success() {
            return Err(format!("DeepL 请求失败：{}", response.status()));
        }

        let payload: DeepLResponse = response.json().map_err(|error| error.to_string())?;
        let translated_text = payload
            .translations
            .first()
            .map(|item| item.text.clone())
            .ok_or_else(|| "DeepL 未返回翻译内容".to_string())?;

        Ok(SentenceTranslation {
            translated_text,
            note: None,
        })
    }
}
