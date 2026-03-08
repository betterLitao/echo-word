use tauri::{Emitter, Manager};

use crate::services::translator::{self, TranslationMode, TranslationResult};

fn resolve_mode(mode: Option<String>) -> TranslationMode {
    match mode.as_deref() {
        Some("word") => TranslationMode::Word,
        Some("sentence") => TranslationMode::Sentence,
        _ => TranslationMode::Auto,
    }
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
    let result = translator::translate(&app, &text, resolve_mode(mode))?;

    // 统一通过事件把结果广播给弹窗窗口，
    // 这样后续快捷键、HTTP API、划词监听都可以复用同一条显示链路。
    app.emit("translation-result", &result)
        .map_err(|error| error.to_string())?;

    if let Some(window) = app.get_webview_window("popup") {
        window.show().map_err(|error| error.to_string())?;
        window.set_focus().map_err(|error| error.to_string())?;
    }

    Ok(result)
}

#[tauri::command]
pub fn request_input_translate(app: tauri::AppHandle) -> Result<(), String> {
    app.emit("input-translate-requested", serde_json::json!({ "source": "command" }))
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn request_selection_translate(app: tauri::AppHandle) -> Result<(), String> {
    app.emit(
        "selection-translate-requested",
        serde_json::json!({ "source": "command" }),
    )
    .map_err(|error| error.to_string())
}
