use std::io::{BufRead, BufReader};
use std::time::Duration;

use serde::{Deserialize, Serialize};
use tauri::Emitter;

use crate::api::http::build_blocking_client;
use crate::api::provider::{SentenceTranslateProvider, SentenceTranslation};
use crate::commands::settings::AppSettings;

pub struct OllamaProvider;

#[derive(Debug, Serialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
}

#[derive(Debug, Deserialize)]
struct OllamaStreamResponse {
    response: Option<String>,
    done: bool,
    error: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
struct TranslationStreamPayload {
    source_text: String,
    provider: String,
    provider_label: Option<String>,
    delta_text: String,
    stream_text: String,
    done: bool,
}

impl OllamaProvider {
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
                provider: "ollama".into(),
                provider_label: Some("Ollama 本地模型".into()),
                delta_text: delta_text.into(),
                stream_text: stream_text.into(),
                done,
            },
        )
        .map_err(|error| error.to_string())
    }

    fn build_prompt(text: &str) -> String {
        format!(
            "你是一个翻译引擎。请把用户输入的英文翻译成简洁、自然的简体中文。只返回翻译结果，不要解释。\n\n{text}"
        )
    }
}

impl SentenceTranslateProvider for OllamaProvider {
    fn id(&self) -> &'static str {
        "ollama"
    }

    fn translate(
        &self,
        app: &tauri::AppHandle,
        text: &str,
        settings: &AppSettings,
        emit_stream: bool,
    ) -> Result<SentenceTranslation, String> {
        let endpoint = settings.ollama_endpoint.trim();
        if endpoint.is_empty() {
            return Err("未配置 Ollama Endpoint".into());
        }

        let model = settings.ollama_model.trim();
        if model.is_empty() {
            return Err("未配置 Ollama 模型".into());
        }

        let client = build_blocking_client(settings, Duration::from_secs(60))?;
        let response = client
            .post(endpoint)
            .json(&OllamaRequest {
                model: model.to_string(),
                prompt: Self::build_prompt(text),
                stream: true,
            })
            .send()
            .map_err(|error| error.to_string())?;

        if !response.status().is_success() {
            return Err(format!("Ollama 请求失败：{}", response.status()));
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

            let payload: OllamaStreamResponse =
                serde_json::from_str(line.trim()).map_err(|error| error.to_string())?;

            if let Some(error) = payload.error {
                return Err(error);
            }

            let delta_text = payload.response.unwrap_or_default();
            if !delta_text.is_empty() {
                stream_text.push_str(&delta_text);
                if emit_stream {
                    Self::emit_stream_event(app, text, delta_text, stream_text.clone(), false)?;
                }
            }

            if payload.done {
                break;
            }
        }

        let translated_text = stream_text.trim().to_string();
        if translated_text.is_empty() {
            return Err("Ollama 未返回翻译内容".into());
        }

        if emit_stream {
            Self::emit_stream_event(app, text, "", translated_text.clone(), true)?;
        }

        Ok(SentenceTranslation {
            translated_text,
            note: Some(format!("Ollama 流式翻译完成（模型：{}）", model)),
        })
    }
}
