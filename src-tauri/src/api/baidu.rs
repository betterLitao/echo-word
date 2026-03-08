use crate::api::provider::{SentenceTranslateProvider, SentenceTranslation};

pub struct BaiduProvider;

impl BaiduProvider {
    fn development_fallback(text: &str) -> SentenceTranslation {
        SentenceTranslation {
            translated_text: format!("[百度翻译开发占位] {}", text),
            note: Some("百度翻译签名链路待接入，当前返回开发期占位结果".into()),
        }
    }
}

impl SentenceTranslateProvider for BaiduProvider {
    fn id(&self) -> &'static str {
        "baidu"
    }

    fn translate(&self, text: &str, api_key: Option<&str>) -> Result<SentenceTranslation, String> {
        if cfg!(debug_assertions) {
            return Ok(Self::development_fallback(text));
        }

        if api_key.unwrap_or_default().trim().is_empty() {
            return Err("未配置百度翻译 API Key".into());
        }

        Err("百度翻译正式签名流程待接入".into())
    }
}
