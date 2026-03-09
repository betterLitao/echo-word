use std::io::{BufRead, BufReader};
use std::time::Duration;

use serde::{Deserialize, Serialize};
use tauri::Emitter;

use crate::api::http::build_blocking_client;
use crate::api::provider::{SentenceTranslateProvider, SentenceTranslation};
use crate::commands::settings::AppSettings;

pub struct OpenAIProvider;

#[derive(Debug, Serialize)]
struct OpenAIRequest {
    model: &'static str,
    messages: Vec<OpenAIMessage>,
    temperature: f32,
    stream: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAIMessage {
    role: &'static str,
    content: String,
}

#[derive(Debug, Deserialize)]
struct OpenAIStreamResponse {
    choices: Vec<OpenAIStreamChoice>,
}

#[derive(Debug, Deserialize)]
struct OpenAIStreamChoice {
    delta: OpenAIStreamDelta,
}

#[derive(Debug, Default, Deserialize)]
struct OpenAIStreamDelta {
    content: Option<String>,
}

#[derive(Debug, Serialize)]
struct TranslationStreamPayload {
    source_text: String,
    provider: String,
    provider_label: Option<String>,
    delta_text: String,
    stream_text: String,
    done: bool,
}

impl OpenAIProvider {
    fn development_fallback(text: &str) -> SentenceTranslation {
        SentenceTranslation {
            translated_text: format!("[OpenAI 开发占位] {}", text),
            note: Some("未配置 OpenAI API Key，当前返回开发期占位结果".into()),
        }
    }

    fn emit_stream_event(
        app: &tauri::AppHandle,
        text: &str,
        delta_text: impl Into<String>,
        stream_text: impl Into<String>,
        done: bool,
    ) -> Result<(), String> {
        app.emit(
            "translation-stream",
            TranslationStreamPayload {
                source_text: text.to_string(),
                provider: "openai".into(),
                provider_label: Some("OpenAI".into()),
                delta_text: delta_text.into(),
                stream_text: stream_text.into(),
                done,
            },
        )
        .map_err(|error| error.to_string())
    }
}

impl SentenceTranslateProvider for OpenAIProvider {
    fn id(&self) -> &'static str {
        "openai"
    }

    fn translate(
        &self,
        app: &tauri::AppHandle,
        text: &str,
        settings: &AppSettings,
        emit_stream: bool,
    ) -> Result<SentenceTranslation, String> {
        let Some(api_key) = settings.api_key(self.id()).filter(|value| !value.trim().is_empty())
        else {
            if cfg!(debug_assertions) {
                return Ok(Self::development_fallback(text));
            }
            return Err("未配置 OpenAI API Key".into());
        };

        let client = build_blocking_client(settings, Duration::from_secs(60))?;
        let payload = OpenAIRequest {
            model: "gpt-4o-mini",
            messages: vec![
                OpenAIMessage {
                    role: "system",
                    content: "You are a translation engine. Translate the user's English text into concise, natural Simplified Chinese. Return only the translation result without explanations.".into(),
                },
                OpenAIMessage {
                    role: "user",
                    content: text.to_string(),
                },
            ],
            temperature: 0.2,
            stream: true,
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

        if emit_stream {
            Self::emit_stream_event(app, text, "", "", false)?;
        }

        let mut stream_text = String::new();
        let mut reader = BufReader::new(response);
        let mut line = String::new();

        loop {
            line.clear();
            let read = reader.read_line(&mut line).map_err(|error| error.to_string())?;
            if read == 0 {
                break;
            }

            let line = line.trim();
            if line.is_empty() || !line.starts_with("data:") {
                continue;
            }

            let data = line.trim_start_matches("data:").trim();
            if data == "[DONE]" {
                break;
            }

            let payload: OpenAIStreamResponse =
                serde_json::from_str(data).map_err(|error| error.to_string())?;
            let delta_text = payload
                .choices
                .into_iter()
                .filter_map(|choice| choice.delta.content)
                .collect::<String>();

            if delta_text.is_empty() {
                continue;
            }

            stream_text.push_str(&delta_text);
            if emit_stream {
                Self::emit_stream_event(app, text, delta_text, stream_text.clone(), false)?;
            }
        }

        let translated_text = stream_text.trim().to_string();
        if translated_text.is_empty() {
            return Err("OpenAI 未返回翻译内容".into());
        }

        if emit_stream {
            Self::emit_stream_event(app, text, "", translated_text.clone(), true)?;
        }

        Ok(SentenceTranslation {
            translated_text,
            note: Some("AI 流式翻译已完成".into()),
        })
    }
}
