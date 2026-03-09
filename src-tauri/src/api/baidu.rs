use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde::Deserialize;

use crate::api::http::build_blocking_client;
use crate::api::provider::{SentenceTranslateProvider, SentenceTranslation};
use crate::api::signing::md5_hex;
use crate::commands::settings::AppSettings;

pub struct BaiduProvider;

#[derive(Debug, Deserialize)]
struct BaiduTranslationItem {
    dst: String,
}

#[derive(Debug, Deserialize)]
struct BaiduResponse {
    trans_result: Option<Vec<BaiduTranslationItem>>,
    error_code: Option<String>,
    error_msg: Option<String>,
}

impl BaiduProvider {
    fn development_fallback(text: &str) -> SentenceTranslation {
        SentenceTranslation {
            translated_text: format!("[百度翻译开发占位] {}", text),
            note: Some("未配置百度翻译密钥，当前返回开发期占位结果".into()),
        }
    }
}

impl SentenceTranslateProvider for BaiduProvider {
    fn id(&self) -> &'static str {
        "baidu"
    }

    fn translate(
        &self,
        _app: &tauri::AppHandle,
        text: &str,
        settings: &AppSettings,
        _emit_stream: bool,
    ) -> Result<SentenceTranslation, String> {
        let app_id = settings.baidu_app_id.trim();
        let secret_key = settings.baidu_secret_key.trim();

        if app_id.is_empty() || secret_key.is_empty() {
            if cfg!(debug_assertions) {
                return Ok(Self::development_fallback(text));
            }
            return Err("未配置百度翻译 App ID / Secret Key".into());
        }

        let salt = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|error| error.to_string())?
            .as_millis()
            .to_string();
        let sign = md5_hex(format!("{app_id}{text}{salt}{secret_key}"));
        let client = build_blocking_client(settings, Duration::from_secs(15))?;
        let response = client
            .post("https://fanyi-api.baidu.com/api/trans/vip/translate")
            .form(&[
                ("q", text),
                ("from", "en"),
                ("to", "zh"),
                ("appid", app_id),
                ("salt", salt.as_str()),
                ("sign", sign.as_str()),
            ])
            .send()
            .map_err(|error| error.to_string())?;

        if !response.status().is_success() {
            return Err(format!("百度翻译请求失败：{}", response.status()));
        }

        let payload: BaiduResponse = response.json().map_err(|error| error.to_string())?;
        if let Some(error_code) = payload.error_code {
            return Err(format!(
                "{}: {}",
                error_code,
                payload.error_msg.unwrap_or_else(|| "百度翻译请求失败".into())
            ));
        }

        let translated_text = payload
            .trans_result
            .and_then(|items| items.into_iter().next())
            .map(|item| item.dst)
            .filter(|value| !value.trim().is_empty())
            .ok_or_else(|| "百度翻译未返回翻译内容".to_string())?;

        Ok(SentenceTranslation {
            translated_text,
            note: None,
        })
    }
}
