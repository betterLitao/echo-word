use tauri::{Emitter, Manager, PhysicalPosition};

use crate::services::translator::{self, TranslationMode, TranslationResult};
use crate::utils::platform;

const DEFAULT_POPUP_WIDTH: i32 = 380;
const DEFAULT_POPUP_HEIGHT: i32 = 300;
const POPUP_OFFSET_X: i32 = 18;
const POPUP_OFFSET_Y: i32 = 20;

fn clamp(value: i32, min: i32, max: i32) -> i32 {
    value.max(min).min(max)
}

fn resolve_mode(mode: Option<String>) -> TranslationMode {
    match mode.as_deref() {
        Some("word") => TranslationMode::Word,
        Some("sentence") => TranslationMode::Sentence,
        _ => TranslationMode::Auto,
    }
}

pub(crate) fn show_popup_near_cursor(app: &tauri::AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("popup")
        .ok_or_else(|| "popup window not found".to_string())?;

    if let Ok(cursor) = app.cursor_position() {
        if let Ok(Some(monitor)) = app.monitor_from_point(cursor.x, cursor.y) {
            let work_area = monitor.work_area();
            let min_x = work_area.position.x;
            let min_y = work_area.position.y;
            let max_x = (min_x + work_area.size.width as i32 - DEFAULT_POPUP_WIDTH).max(min_x);
            let max_y = (min_y + work_area.size.height as i32 - DEFAULT_POPUP_HEIGHT).max(min_y);
            let target_x = clamp(cursor.x.round() as i32 + POPUP_OFFSET_X, min_x, max_x);
            let target_y = clamp(cursor.y.round() as i32 + POPUP_OFFSET_Y, min_y, max_y);
            let _ = window.set_position(PhysicalPosition::new(target_x, target_y));
        }
    }

    window.show().map_err(|error| error.to_string())?;
    window.set_focus().map_err(|error| error.to_string())?;
    Ok(())
}

fn emit_translation_error(app: &tauri::AppHandle, message: &str) {
    let _ = app.emit(
        "translation-error",
        serde_json::json!({ "message": message }),
    );
}

fn report_popup_error(app: &tauri::AppHandle, message: &str) {
    emit_translation_error(app, message);
    let _ = show_popup_near_cursor(app);
}

pub(crate) fn translate_text_and_show_popup_internal(
    app: tauri::AppHandle,
    text: String,
    mode: Option<String>,
    notice: Option<&str>,
) -> Result<TranslationResult, String> {
    let mut result = match translator::translate(&app, &text, resolve_mode(mode)) {
        Ok(result) => result,
        Err(error) => {
            report_popup_error(&app, &error);
            return Err(error);
        }
    };

    if let Some(extra_notice) = notice {
        result.notice = Some(match result.notice.take() {
            Some(current) if !current.trim().is_empty() => format!("{} | {}", extra_notice, current),
            _ => extra_notice.to_string(),
        });
    }

    if let Err(error) = app.emit("translation-result", &result) {
        let error = error.to_string();
        report_popup_error(&app, &error);
        return Err(error);
    }

    show_popup_near_cursor(&app)?;
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
    let text = match platform::read_clipboard_text() {
        Ok(text) => text,
        Err(error) => {
            report_popup_error(&app, &error);
            return Err(error);
        }
    };
    let trimmed = text.trim();

    if trimmed.is_empty() {
        let error = "Clipboard does not contain translatable text".to_string();
        report_popup_error(&app, &error);
        return Err(error);
    }

    let notice = match source {
        "shortcut" => Some("Triggered from global shortcut clipboard flow"),
        "http-api" => Some("Triggered from local HTTP API clipboard flow"),
        "selection-auto" => Some("Triggered from Windows Ctrl+C selection flow"),
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
