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
    let text = match get_selected_text_windows() {
        Ok(t) => t,
        Err(e) => {
            let error = format!("获取选中文本失败: {}", e);
            report_popup_error(&app, &error);
            return Err(error);
        }
    };

    if text.trim().is_empty() {
        let error = "未检测到选中文本".to_string();
        report_popup_error(&app, &error);
        return Err(error);
    }

    translate_captured_text_internal(app, text, source)
}

#[cfg(target_os = "windows")]
fn get_selected_text_windows() -> Result<String, String> {
    // 方案 1: 使用 get-selected-text crate（推荐）
    match get_selected_text::get_selected_text() {
        Ok(text) => {
            if !text.trim().is_empty() {
                return Ok(text);
            }
            // 选中文本为空，继续尝试剪贴板
        }
        Err(e) => {
            eprintln!("get-selected-text 失败: {}", e);
        }
    }

    // 方案 2: 降级到 SendInput + 剪贴板
    try_read_selection_via_clipboard()
}

#[cfg(target_os = "windows")]
fn try_read_selection_via_uia() -> Result<String, String> {
    use windows::core::*;
    use windows::Win32::System::Com::*;
    use windows::Win32::UI::Accessibility::*;

    unsafe {
        // 初始化 COM
        let hr = CoInitializeEx(None, COINIT_APARTMENTTHREADED);
        if hr.is_err() {
            return Err(format!("COM 初始化失败: {:?}", hr));
        }

        // 创建 UI Automation 实例
        let automation: IUIAutomation = match CoCreateInstance(&CUIAutomation, None, CLSCTX_INPROC_SERVER) {
            Ok(a) => a,
            Err(e) => {
                CoUninitialize();
                return Err(format!("创建 UI Automation 失败: {}", e));
            }
        };

        // 获取焦点元素
        let focused_element = match automation.GetFocusedElement() {
            Ok(e) => e,
            Err(e) => {
                CoUninitialize();
                return Err(format!("获取焦点元素失败: {}", e));
            }
        };

        // 尝试获取 TextPattern
        let text_pattern: windows::core::Result<IUIAutomationTextPattern> =
            focused_element.GetCurrentPatternAs(UIA_TextPatternId);

        if let Ok(text_pattern) = text_pattern {
            // 获取选中的文本范围
            if let Ok(selection_array) = text_pattern.GetSelection() {
                if let Ok(length) = selection_array.Length() {
                    if length > 0 {
                        if let Ok(range) = selection_array.GetElement(0) {
                            if let Ok(text_bstr) = range.GetText(-1) {
                                let text = text_bstr.to_string();
                                CoUninitialize();
                                if !text.trim().is_empty() {
                                    return Ok(text);
                                }
                            }
                        }
                    }
                }
            }
        }

        CoUninitialize();
        Err("无法通过 UI Automation 读取选中文本".to_string())
    }
}

#[cfg(target_os = "windows")]
fn try_read_selection_via_clipboard() -> Result<String, String> {
    use std::mem;
    use std::thread;
    use std::time::Duration;
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
        SendInput, INPUT, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP, VK_CONTROL, VK_C,
    };

    let old_sequence = unsafe {
        windows_sys::Win32::System::DataExchange::GetClipboardSequenceNumber()
    };

    // 等待 100ms 确保快捷键释放
    thread::sleep(Duration::from_millis(100));

    // 使用 SendInput 模拟 Ctrl+C
    unsafe {
        let mut inputs: [INPUT; 4] = mem::zeroed();

        inputs[0].r#type = INPUT_KEYBOARD;
        inputs[0].Anonymous.ki = KEYBDINPUT {
            wVk: VK_CONTROL,
            wScan: 0,
            dwFlags: 0,
            time: 0,
            dwExtraInfo: 0,
        };

        inputs[1].r#type = INPUT_KEYBOARD;
        inputs[1].Anonymous.ki = KEYBDINPUT {
            wVk: VK_C,
            wScan: 0,
            dwFlags: 0,
            time: 0,
            dwExtraInfo: 0,
        };

        inputs[2].r#type = INPUT_KEYBOARD;
        inputs[2].Anonymous.ki = KEYBDINPUT {
            wVk: VK_C,
            wScan: 0,
            dwFlags: KEYEVENTF_KEYUP,
            time: 0,
            dwExtraInfo: 0,
        };

        inputs[3].r#type = INPUT_KEYBOARD;
        inputs[3].Anonymous.ki = KEYBDINPUT {
            wVk: VK_CONTROL,
            wScan: 0,
            dwFlags: KEYEVENTF_KEYUP,
            time: 0,
            dwExtraInfo: 0,
        };

        let sent = SendInput(4, inputs.as_ptr(), mem::size_of::<INPUT>() as i32);
        if sent != 4 {
            return Err(format!("SendInput 失败，只发送了 {} / 4 个输入事件", sent));
        }
    }

    // 等待剪贴板更新（最多 1000ms）
    let mut attempts = 0;
    let mut updated = false;
    while attempts < 100 {
        thread::sleep(Duration::from_millis(10));
        let new_sequence = unsafe {
            windows_sys::Win32::System::DataExchange::GetClipboardSequenceNumber()
        };
        if new_sequence != old_sequence {
            updated = true;
            break;
        }
        attempts += 1;
    }

    if !updated {
        return Err(format!("剪贴板未更新（尝试了 {} 次），可能没有选中文本", attempts));
    }

    // 额外等待 50ms 确保内容稳定
    thread::sleep(Duration::from_millis(50));

    platform::read_clipboard_text()
}

#[cfg(not(target_os = "windows"))]
fn get_selected_text_windows() -> Result<String, String> {
    Err("当前平台不支持".to_string())
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
