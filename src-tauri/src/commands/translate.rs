use std::sync::Mutex;

use tauri::{Emitter, Manager, PhysicalPosition};

use crate::commands::settings::load_settings_from_db;
use crate::services::translator::{self, TranslationMode, TranslationResult};
use crate::utils::platform;

const DEFAULT_POPUP_WIDTH: i32 = 380;
const DEFAULT_POPUP_HEIGHT: i32 = 300;
const POPUP_OFFSET_X: i32 = 18;
const POPUP_OFFSET_Y: i32 = 20;

#[derive(Default)]
pub struct PopupPositionState {
    pending_programmatic_move: Mutex<Option<(i32, i32)>>,
}

impl PopupPositionState {
    pub fn mark_programmatic_move(&self, x: i32, y: i32) {
        if let Ok(mut guard) = self.pending_programmatic_move.lock() {
            *guard = Some((x, y));
        }
    }

    pub fn consume_if_programmatic(&self, x: i32, y: i32) -> bool {
        if let Ok(mut guard) = self.pending_programmatic_move.lock() {
            if guard.as_ref() == Some(&(x, y)) {
                *guard = None;
                return true;
            }
        }

        false
    }
}

fn clamp(value: i32, min: i32, max: i32) -> i32 {
    value.max(min).min(max)
}

fn clamp_popup_position(
    min_x: i32,
    min_y: i32,
    width: u32,
    height: u32,
    raw_x: i32,
    raw_y: i32,
    popup_width: i32,
    popup_height: i32,
) -> (i32, i32) {
    let max_x = (min_x + width as i32 - popup_width).max(min_x);
    let max_y = (min_y + height as i32 - popup_height).max(min_y);
    (clamp(raw_x, min_x, max_x), clamp(raw_y, min_y, max_y))
}

fn popup_dimensions(window: &tauri::WebviewWindow) -> (i32, i32) {
    window
        .outer_size()
        .map(|size| (size.width as i32, size.height as i32))
        .unwrap_or((DEFAULT_POPUP_WIDTH, DEFAULT_POPUP_HEIGHT))
}

fn resolve_popup_position_from_cursor(
    app: &tauri::AppHandle,
    popup_width: i32,
    popup_height: i32,
) -> Option<(i32, i32)> {
    let cursor = app.cursor_position().ok()?;
    let monitor = app.monitor_from_point(cursor.x, cursor.y).ok()??;
    let work_area = monitor.work_area();

    Some(clamp_popup_position(
        work_area.position.x,
        work_area.position.y,
        work_area.size.width,
        work_area.size.height,
        cursor.x.round() as i32 + POPUP_OFFSET_X,
        cursor.y.round() as i32 + POPUP_OFFSET_Y,
        popup_width,
        popup_height,
    ))
}

fn resolve_popup_position_from_memory(
    app: &tauri::AppHandle,
    x: i32,
    y: i32,
    popup_width: i32,
    popup_height: i32,
) -> Option<(i32, i32)> {
    let monitor = app.monitor_from_point(x as f64, y as f64).ok()??;
    let work_area = monitor.work_area();

    Some(clamp_popup_position(
        work_area.position.x,
        work_area.position.y,
        work_area.size.width,
        work_area.size.height,
        x,
        y,
        popup_width,
        popup_height,
    ))
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
    let (popup_width, popup_height) = popup_dimensions(&window);

    let target_position = load_settings_from_db(app)
        .ok()
        .and_then(|settings| match (settings.popup_last_x, settings.popup_last_y) {
            (Some(x), Some(y)) => {
                resolve_popup_position_from_memory(app, x, y, popup_width, popup_height)
            }
            _ => None,
        })
        .or_else(|| resolve_popup_position_from_cursor(app, popup_width, popup_height));

    if let Some((target_x, target_y)) = target_position {
        let popup_position_state = app.state::<PopupPositionState>();
        popup_position_state.mark_programmatic_move(target_x, target_y);
        let _ = window.set_position(PhysicalPosition::new(target_x, target_y));
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

fn emit_translation_result(app: &tauri::AppHandle, result: &TranslationResult) -> Result<(), String> {
    app.emit("translation-result", result)
        .map_err(|error| error.to_string())
}

fn emit_stream_placeholder(app: &tauri::AppHandle, text: &str) {
    let _ = app.emit(
        "translation-stream",
        serde_json::json!({
            "source_text": text,
            "provider": "pending",
            "provider_label": null,
            "delta_text": "",
            "stream_text": "",
            "done": false,
        }),
    );
}

fn report_popup_error(app: &tauri::AppHandle, message: &str) {
    emit_translation_error(app, message);
    let _ = show_popup_near_cursor(app);
}

fn notice_for_selection_source(source: &str) -> Option<&'static str> {
    match source {
        "shortcut" => Some("来自全局快捷键"),
        "http-api" => Some("来自本地 HTTP API"),
        "selection-auto" => Some("来自 Windows Ctrl+C 选区监听"),
        "clipboard-watch" => Some("来自剪贴板监听"),
        _ => None,
    }
}

pub(crate) fn translate_text_and_show_popup_internal(
    app: tauri::AppHandle,
    text: String,
    mode: Option<String>,
    notice: Option<&str>,
) -> Result<TranslationResult, String> {
    emit_stream_placeholder(&app, &text);
    let _ = show_popup_near_cursor(&app);

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

    if let Err(error) = emit_translation_result(&app, &result) {
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

pub(crate) fn translate_captured_text_internal(
    app: tauri::AppHandle,
    text: String,
    source: &str,
) -> Result<(), String> {
    let trimmed = text.trim();

    if trimmed.is_empty() {
        let error = "剪贴板里没有可翻译的文本".to_string();
        report_popup_error(&app, &error);
        return Err(error);
    }

    let notice = notice_for_selection_source(source);
    translate_text_and_show_popup_internal(app, trimmed.to_string(), None, notice).map(|_| ())
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
    translate_captured_text_internal(app, text, source)
}

#[tauri::command]
pub fn translate(
    app: tauri::AppHandle,
    text: String,
    mode: Option<String>,
) -> Result<TranslationResult, String> {
    let result = translator::translate(&app, &text, resolve_mode(mode))?;
    let _ = emit_translation_result(&app, &result);
    Ok(result)
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
