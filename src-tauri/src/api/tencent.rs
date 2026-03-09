use std::time::Duration;

use serde::{Deserialize, Serialize};
use time::{macros::format_description, OffsetDateTime};

use crate::api::http::build_blocking_client;
use crate::api::provider::{SentenceTranslateProvider, SentenceTranslation};
use crate::api::signing::{hmac_sha256, sha256_hex, to_lower_hex};
use crate::commands::settings::AppSettings;

pub struct TencentProvider;

#[derive(Debug, Serialize)]
#[serde(rename_all = "PascalCase")]
struct TencentTranslateRequest<'a> {
    source_text: &'a str,
    source: &'static str,
    target: &'static str,
    project_id: u8,
}

#[derive(Debug, Deserialize)]
struct TencentErrorPayload {
    #[serde(rename = "Code")]
    code: String,
    #[serde(rename = "Message")]
    message: String,
}

#[derive(Debug, Deserialize)]
struct TencentResponsePayload {
    #[serde(rename = "TargetText")]
    target_text: Option<String>,
    #[serde(rename = "Error")]
    error: Option<TencentErrorPayload>,
}

#[derive(Debug, Deserialize)]
struct TencentResponse {
    #[serde(rename = "Response")]
    response: TencentResponsePayload,
}

impl TencentProvider {
    fn development_fallback(text: &str) -> SentenceTranslation {
        SentenceTranslation {
            translated_text: format!("[腾讯翻译开发占位] {}", text),
            note: Some("未配置腾讯云密钥，当前返回开发期占位结果".into()),
        }
    }

    fn build_authorization(
        secret_id: &str,
        secret_key: &str,
        payload: &str,
        timestamp: i64,
    ) -> Result<String, String> {
        const SERVICE: &str = "tmt";
        const HOST: &str = "tmt.tencentcloudapi.com";
        const ACTION: &str = "TextTranslate";
        const CONTENT_TYPE: &str = "application/json; charset=utf-8";
        const SIGNED_HEADERS: &str = "content-type;host;x-tc-action";

        let date = OffsetDateTime::from_unix_timestamp(timestamp)
            .map_err(|error| error.to_string())?
            .format(format_description!("[year]-[month]-[day]"))
            .map_err(|error| error.to_string())?;
        let credential_scope = format!("{date}/{SERVICE}/tc3_request");
        let canonical_headers = format!(
            "content-type:{CONTENT_TYPE}\nhost:{HOST}\nx-tc-action:{}\n",
            ACTION.to_ascii_lowercase()
        );
        let canonical_request = format!(
            "POST\n/\n\n{canonical_headers}\n{SIGNED_HEADERS}\n{}",
            sha256_hex(payload)
        );
        let string_to_sign = format!(
            "TC3-HMAC-SHA256\n{timestamp}\n{credential_scope}\n{}",
            sha256_hex(canonical_request)
        );

        let secret_date = hmac_sha256(format!("TC3{secret_key}").as_bytes(), &date)?;
        let secret_service = hmac_sha256(&secret_date, SERVICE)?;
        let secret_signing = hmac_sha256(&secret_service, "tc3_request")?;
        let signature = to_lower_hex(&hmac_sha256(&secret_signing, string_to_sign)?);

        Ok(format!(
            "TC3-HMAC-SHA256 Credential={secret_id}/{credential_scope}, SignedHeaders={SIGNED_HEADERS}, Signature={signature}"
        ))
    }
}

impl SentenceTranslateProvider for TencentProvider {
    fn id(&self) -> &'static str {
        "tencent"
    }

    fn translate(
        &self,
        _app: &tauri::AppHandle,
        text: &str,
        settings: &AppSettings,
        _emit_stream: bool,
    ) -> Result<SentenceTranslation, String> {
        let secret_id = settings.tencent_secret_id.trim();
        let secret_key = settings.tencent_secret_key.trim();

        if secret_id.is_empty() || secret_key.is_empty() {
            if cfg!(debug_assertions) {
                return Ok(Self::development_fallback(text));
            }
            return Err("未配置腾讯云 SecretId / SecretKey".into());
        }

        let payload = serde_json::to_string(&TencentTranslateRequest {
            source_text: text,
            source: "en",
            target: "zh",
            project_id: 0,
        })
        .map_err(|error| error.to_string())?;

        let timestamp = OffsetDateTime::now_utc().unix_timestamp();
        let authorization = Self::build_authorization(secret_id, secret_key, &payload, timestamp)?;
        let client = build_blocking_client(settings, Duration::from_secs(15))?;
        let response = client
            .post("https://tmt.tencentcloudapi.com/")
            .header("Authorization", authorization)
            .header("Content-Type", "application/json; charset=utf-8")
            .header("Host", "tmt.tencentcloudapi.com")
            .header("X-TC-Action", "TextTranslate")
            .header("X-TC-Timestamp", timestamp.to_string())
            .header("X-TC-Version", "2018-03-21")
            .header("X-TC-Region", "ap-guangzhou")
            .body(payload)
            .send()
            .map_err(|error| error.to_string())?;

        if !response.status().is_success() {
            return Err(format!("腾讯翻译请求失败：{}", response.status()));
        }

        let payload: TencentResponse = response.json().map_err(|error| error.to_string())?;
        if let Some(error) = payload.response.error {
            return Err(format!("{}: {}", error.code, error.message));
        }

        let translated_text = payload
            .response
            .target_text
            .filter(|value| !value.trim().is_empty())
            .ok_or_else(|| "腾讯翻译未返回翻译内容".to_string())?;

        Ok(SentenceTranslation {
            translated_text,
            note: None,
        })
    }
}
