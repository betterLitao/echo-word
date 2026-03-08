use tauri::{Emitter, Manager};
use crate::services::translator::{self, TranslationMode, TranslationResult};
use crate::utils::platform;

fn resolve_mode(mode: Option<String>) -> TranslationMode {
    match mode.as_deref() {
        Some("word") => TranslationMode::Word,
        Some("sentence") => TranslationMode::Sentence,
        _ => TranslationMode::Auto,
    }
}

pub(crate) fn translate_text_and_show_popup_internal(
    app: tauri::AppHandle,
    text: String,
    mode: Option<String>,
    notice: Option<&str>,
) -> Result<TranslationResult, String> {
    let mut result = translator::translate(&app, &text, resolve_mode(mode))?;
    if let Some(extra_notice) = notice {
        result.notice = Some(match result.notice.take() {
            Some(current) if !current.trim().is_empty() => format!("{}；{}", extra_notice, current),
            _ => extra_notice.to_string(),
        });
    }

    app.emit("translation-result", &result)
        .map_err(|error| error.to_string())?;

    if let Some(window) = app.get_webview_window("popup") {
        window.show().map_err(|error| error.to_string())?;
        window.set_focus().map_err(|error| error.to_string())?;
    }

    Ok(result)
}

pub(crate) fn request_input_translate_internal(
    app: &tauri::AppHandle,
    source: &str,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|error| error.to_string())?;
        window.set_focus().map_err(|error| error.to_string())?;
    }

    app.emit(
        "input-translate-requested",
        serde_json::json!({ "source": source }),
    )
    .map_err(|error| error.to_string())
}

pub(crate) fn request_selection_translate_internal(
    app: tauri::AppHandle,
    source: &str,
) -> Result<(), String> {
    let text = platform::read_clipboard_text()?;
    let trimmed = text.trim();

    if trimmed.is_empty() {
        return Err("剪贴板中没有可翻译的文本".into());
    }

    let notice = match source {
        "shortcut" => Some("已通过全局快捷键读取剪贴板"),
        "http-api" => Some("已通过本地 HTTP API 读取剪贴板"),
        _ => None,
    };

    translate_text_and_show_popup_internal(app, trimmed.to_string(), None, notice).map(|_| ())
}

#[tauri::command]
pub fn translate(
    app: tauri::AppHandle,
    text: String,
    mode: Option<String>,
) -> Result<TranslationResult, String> {
    translator::translate(&app, &text, resolve_mode(mode))
}

#[tauri::command]
pub fn translate_and_show_popup(
    app: tauri::AppHandle,
    text: String,
    mode: Option<String>,
) -> Result<TranslationResult, String> {
    // 统一通过内部函数把结果广播给弹窗窗口，
    // 这样命令调用、快捷键、剪贴板监听和 HTTP API 都能共用同一条显示链路。
    translate_text_and_show_popup_internal(app, text, mode, None)
}

#[tauri::command]
pub fn request_input_translate(app: tauri::AppHandle) -> Result<(), String> {
    request_input_translate_internal(&app, "command")
}

#[tauri::command]
pub fn request_selection_translate(app: tauri::AppHandle) -> Result<(), String> {
    request_selection_translate_internal(app, "command")
}
