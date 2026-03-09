use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde::Deserialize;

use crate::api::http::build_blocking_client;
use crate::api::provider::DictEntry;
use crate::api::signing::sha256_hex;
use crate::commands::settings::AppSettings;

pub struct YoudaoProvider;

#[derive(Debug, Deserialize)]
struct YoudaoBasic {
    phonetic: Option<String>,
    #[serde(rename = "uk-phonetic")]
    uk_phonetic: Option<String>,
    #[serde(rename = "us-phonetic")]
    us_phonetic: Option<String>,
    explains: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
struct YoudaoResponse {
    #[serde(rename = "errorCode")]
    error_code: String,
    query: Option<String>,
    translation: Option<Vec<String>>,
    basic: Option<YoudaoBasic>,
}

impl YoudaoProvider {
    fn truncate_input(text: &str) -> String {
        let char_count = text.chars().count();
        if char_count <= 20 {
            return text.to_string();
        }

        let prefix: String = text.chars().take(10).collect();
        let suffix: String = text
            .chars()
            .rev()
            .take(10)
            .collect::<Vec<_>>()
            .into_iter()
            .rev()
            .collect();
        format!("{prefix}{char_count}{suffix}")
    }

    pub fn lookup(&self, settings: &AppSettings, word: &str) -> Result<Option<DictEntry>, String> {
        let app_key = settings.youdao_app_key.trim();
        let app_secret = settings.youdao_app_secret.trim();
        let normalized = word.trim();

        if normalized.is_empty() {
            return Ok(None);
        }

        if app_key.is_empty() || app_secret.is_empty() {
            return Ok(None);
        }

        let salt = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|error| error.to_string())?
            .as_millis()
            .to_string();
        let curtime = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|error| error.to_string())?
            .as_secs()
            .to_string();
        let sign = sha256_hex(format!(
            "{app_key}{}{}{curtime}{app_secret}",
            Self::truncate_input(normalized),
            salt
        ));

        let client = build_blocking_client(settings, Duration::from_secs(10))?;
        let response = client
            .post("https://openapi.youdao.com/api")
            .form(&[
                ("q", normalized),
                ("from", "en"),
                ("to", "zh-CHS"),
                ("appKey", app_key),
                ("salt", salt.as_str()),
                ("sign", sign.as_str()),
                ("signType", "v3"),
                ("curtime", curtime.as_str()),
            ])
            .send()
            .map_err(|error| error.to_string())?;

        if !response.status().is_success() {
            return Err(format!("有道词典请求失败：{}", response.status()));
        }

        let payload: YoudaoResponse = response.json().map_err(|error| error.to_string())?;
        if payload.error_code != "0" {
            return Err(format!("有道词典错误码：{}", payload.error_code));
        }

        let basic = payload.basic;
        let explains = basic
            .as_ref()
            .and_then(|item| item.explains.clone())
            .unwrap_or_default();
        let translation = if explains.is_empty() {
            payload.translation.unwrap_or_default().join("; ")
        } else {
            explains.join("; ")
        };

        if translation.trim().is_empty() {
            return Ok(None);
        }

        let phonetic = basic
            .as_ref()
            .and_then(|item| item.us_phonetic.clone())
            .or_else(|| basic.as_ref().and_then(|item| item.phonetic.clone()))
            .or_else(|| basic.as_ref().and_then(|item| item.uk_phonetic.clone()));

        Ok(Some(DictEntry {
            word: payload.query.unwrap_or_else(|| normalized.to_string()),
            phonetic,
            translation,
            pos: None,
            exchange: None,
        }))
    }
}
