use serde::Deserialize;

use crate::api::provider::{SentenceTranslateProvider, SentenceTranslation};

pub struct DeepLProvider;

#[derive(Debug, Deserialize)]
struct DeepLTranslationItem {
    text: String,
}

#[derive(Debug, Deserialize)]
struct DeepLResponse {
    translations: Vec<DeepLTranslationItem>,
}

fn build_client(proxy: Option<&str>) -> Result<reqwest::blocking::Client, String> {
    let mut builder = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(10));

    if let Some(proxy) = proxy.filter(|value| !value.trim().is_empty()) {
        builder = builder
            .proxy(reqwest::Proxy::all(proxy).map_err(|error| error.to_string())?);
    }

    builder.build().map_err(|error| error.to_string())
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
        text: &str,
        api_key: Option<&str>,
        proxy: Option<&str>,
    ) -> Result<SentenceTranslation, String> {
        let Some(api_key) = api_key.filter(|value| !value.trim().is_empty()) else {
            if cfg!(debug_assertions) {
                return Ok(Self::development_fallback(text));
            }
            return Err("未配置 DeepL API Key".into());
        };

        let client = build_client(proxy)?;
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
