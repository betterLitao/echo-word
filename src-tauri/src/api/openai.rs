use serde::{Deserialize, Serialize};

use crate::api::provider::{SentenceTranslateProvider, SentenceTranslation};

pub struct OpenAIProvider;

#[derive(Debug, Serialize)]
struct OpenAIRequest {
    model: &'static str,
    messages: Vec<OpenAIMessage>,
    temperature: f32,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAIMessage {
    role: &'static str,
    content: String,
}

#[derive(Debug, Deserialize)]
struct OpenAIChoice {
    message: OpenAIResponseMessage,
}

#[derive(Debug, Deserialize)]
struct OpenAIResponseMessage {
    content: String,
}

#[derive(Debug, Deserialize)]
struct OpenAIResponse {
    choices: Vec<OpenAIChoice>,
}

fn build_client(proxy: Option<&str>) -> Result<reqwest::blocking::Client, String> {
    let mut builder = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(20));

    if let Some(proxy) = proxy.filter(|value| !value.trim().is_empty()) {
        builder = builder.proxy(reqwest::Proxy::all(proxy).map_err(|error| error.to_string())?);
    }

    builder.build().map_err(|error| error.to_string())
}

impl OpenAIProvider {
    fn development_fallback(text: &str) -> SentenceTranslation {
        SentenceTranslation {
            translated_text: format!("[OpenAI 开发占位] {}", text),
            note: Some("未配置 OpenAI API Key，当前返回开发期占位结果".into()),
        }
    }
}

impl SentenceTranslateProvider for OpenAIProvider {
    fn id(&self) -> &'static str {
        "openai"
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
            return Err("未配置 OpenAI API Key".into());
        };

        let client = build_client(proxy)?;
        let payload = OpenAIRequest {
            model: "gpt-4o-mini",
            messages: vec![
                OpenAIMessage {
                    role: "system",
                    // 这里明确要求“只返回译文”，
                    // 避免多引擎对照时 OpenAI 混入解释性前后缀，破坏弹窗排版稳定性。
                    content: "You are a translation engine. Translate the user's English text into concise, natural Simplified Chinese. Return only the translation result without explanations.".into(),
                },
                OpenAIMessage {
                    role: "user",
                    content: text.to_string(),
                },
            ],
            temperature: 0.2,
        };

        let response = client
            .post("https://api.openai.com/v1/chat/completions")
            .bearer_auth(api_key)
            .json(&payload)
            .send()
            .map_err(|error| error.to_string())?;

        if !response.status().is_success() {
            return Err(format!("OpenAI 请求失败：{}", response.status()));
        }

        let payload: OpenAIResponse = response.json().map_err(|error| error.to_string())?;
        let translated_text = payload
            .choices
            .first()
            .map(|item| item.message.content.trim().to_string())
            .filter(|content| !content.is_empty())
            .ok_or_else(|| "OpenAI 未返回翻译内容".to_string())?;

        Ok(SentenceTranslation {
            translated_text,
            note: Some("AI 翻译源已返回结果".into()),
        })
    }
}
