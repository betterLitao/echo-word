use std::sync::{Mutex, OnceLock};
use std::thread;
use std::time::Duration;

static GLOBAL_SELECTION_WATCHER_STARTED: OnceLock<()> = OnceLock::new();
static PENDING_TRANSLATION_TEXT: Mutex<Option<String>> = Mutex::new(None);

#[cfg(target_os = "windows")]
pub fn start_global_selection_watcher(app: tauri::AppHandle) {
    if GLOBAL_SELECTION_WATCHER_STARTED.get().is_some() {
        return;
    }

    let _ = GLOBAL_SELECTION_WATCHER_STARTED.set(());

    thread::spawn(move || {
        use std::ptr;
        use std::sync::Mutex;
        use windows_sys::Win32::Foundation::{LPARAM, LRESULT, WPARAM, HINSTANCE};
        use windows_sys::Win32::UI::WindowsAndMessaging::{
            CallNextHookEx, SetWindowsHookExW, UnhookWindowsHookEx, WH_MOUSE_LL,
            WM_LBUTTONUP,
        };

        // 使用 isize 代替 HHOOK 避免 Send 问题
        static HOOK_HANDLE: Mutex<Option<isize>> = Mutex::new(None);
        static APP_HANDLE: Mutex<Option<tauri::AppHandle>> = Mutex::new(None);

        // 保存 app handle
        *APP_HANDLE.lock().unwrap() = Some(app.clone());

        unsafe extern "system" fn mouse_proc(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
            if code >= 0 && wparam == WM_LBUTTONUP as usize {
                // 鼠标左键释放，延迟检查选中文本
                if let Some(app) = APP_HANDLE.lock().unwrap().as_ref() {
                    let app_clone = app.clone();
                    thread::spawn(move || {
                        thread::sleep(Duration::from_millis(100));
                        handle_mouse_up(app_clone);
                    });
                }
            }

            unsafe {
                let hook = HOOK_HANDLE.lock().unwrap();
                CallNextHookEx(hook.unwrap_or(0) as _, code, wparam, lparam)
            }
        }

        unsafe {
            let hook = SetWindowsHookExW(WH_MOUSE_LL, Some(mouse_proc), 0 as HINSTANCE, 0);
            if hook.is_null() {
                eprintln!("Failed to set mouse hook");
                return;
            }

            *HOOK_HANDLE.lock().unwrap() = Some(hook as isize);

            // 消息循环
            use windows_sys::Win32::UI::WindowsAndMessaging::{
                GetMessageW, TranslateMessage, DispatchMessageW, MSG,
            };

            let mut msg: MSG = std::mem::zeroed();
            while GetMessageW(&mut msg, ptr::null_mut(), 0, 0) > 0 {
                TranslateMessage(&msg);
                DispatchMessageW(&msg);
            }

            // 清理
            if let Some(h) = *HOOK_HANDLE.lock().unwrap() {
                UnhookWindowsHookEx(h as _);
            }
        }
    });
}

#[cfg(target_os = "windows")]
fn handle_mouse_up(app: tauri::AppHandle) {
    use crate::commands::settings::load_settings_from_db;

    // 检查是否启用全局划词监听
    let settings = match load_settings_from_db(&app) {
        Ok(s) => s,
        Err(_) => return,
    };

    if !settings.global_selection_listen {
        return;
    }

    // 获取选中文本
    let text = match get_selected_text::get_selected_text() {
        Ok(t) => t,
        Err(_) => return,
    };

    if text.trim().is_empty() || text.len() < 2 || !text.chars().any(|c| c.is_ascii_alphabetic()) {
        return;
    }

    // 获取光标位置（选中文字的位置）
    use windows_sys::Win32::UI::WindowsAndMessaging::{GetGUIThreadInfo, GUITHREADINFO};
    use windows_sys::Win32::Graphics::Gdi::ClientToScreen;
    use windows_sys::Win32::Foundation::POINT;

    let mut gui_info: GUITHREADINFO = unsafe { std::mem::zeroed() };
    gui_info.cbSize = std::mem::size_of::<GUITHREADINFO>() as u32;

    let (x, y) = unsafe {
        if GetGUIThreadInfo(0, &mut gui_info) != 0 && !gui_info.hwndCaret.is_null() {
            // 获取到了 caret 位置，转换为屏幕坐标
            let mut pt = POINT {
                x: gui_info.rcCaret.left,
                y: gui_info.rcCaret.top,
            };
            if ClientToScreen(gui_info.hwndCaret, &mut pt) != 0 {
                (pt.x, pt.y)
            } else {
                // 转换失败，使用鼠标位置
                get_cursor_position()
            }
        } else {
            // 获取失败，使用鼠标位置
            get_cursor_position()
        }
    };

    // 保存待翻译文本
    *PENDING_TRANSLATION_TEXT.lock().unwrap() = Some(text);

    // 显示翻译图标窗口
    let _ = show_translation_icon(&app, x, y);
}

#[cfg(target_os = "windows")]
fn get_cursor_position() -> (i32, i32) {
    use windows_sys::Win32::UI::WindowsAndMessaging::GetCursorPos;
    use windows_sys::Win32::Foundation::POINT;

    let mut cursor_pos: POINT = unsafe { std::mem::zeroed() };
    unsafe {
        if GetCursorPos(&mut cursor_pos) != 0 {
            (cursor_pos.x, cursor_pos.y)
        } else {
            (0, 0)
        }
    }
}

fn show_translation_icon(app: &tauri::AppHandle, x: i32, y: i32) -> Result<(), String> {
    use tauri::{Manager, PhysicalPosition};

    let window = app
        .get_webview_window("translation-icon")
        .ok_or_else(|| "translation-icon window not found".to_string())?;

    // 设置窗口位置（鼠标右上角偏移）
    window
        .set_position(PhysicalPosition::new(x + 8, y - 48))
        .map_err(|e| e.to_string())?;

    // 显示窗口
    window.show().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn trigger_global_selection_translate(app: tauri::AppHandle) -> Result<(), String> {
    use crate::commands::translate;

    // 获取待翻译文本
    let text = PENDING_TRANSLATION_TEXT
        .lock()
        .unwrap()
        .take()
        .ok_or_else(|| "没有待翻译的文本".to_string())?;

    // 触发翻译
    translate::translate_captured_text_internal(app, text, "global-selection")
}

#[cfg(not(target_os = "windows"))]
pub fn start_global_selection_watcher(_app: tauri::AppHandle) {
    // 非 Windows 平台暂不支持
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
pub fn trigger_global_selection_translate(_app: tauri::AppHandle) -> Result<(), String> {
    Err("当前平台不支持".to_string())
}
