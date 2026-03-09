use std::sync::OnceLock;
use std::thread;
use std::time::{Duration, Instant};

use crate::commands::{settings::load_settings_from_db, translate};
use crate::utils::platform;

static SELECTION_WATCHER_STARTED: OnceLock<()> = OnceLock::new();

fn should_translate_selection(text: &str) -> bool {
    let trimmed = text.trim();
    if trimmed.is_empty() || trimmed.len() > 240 {
        return false;
    }

    trimmed.chars().any(|character| character.is_ascii_alphabetic())
}

#[cfg(target_os = "windows")]
fn copy_shortcut_pressed() -> bool {
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::GetAsyncKeyState;

    const VK_CONTROL: i32 = 0x11;
    const VK_C: i32 = 0x43;

    unsafe {
        (GetAsyncKeyState(VK_CONTROL) as u16 & 0x8000) != 0
            && (GetAsyncKeyState(VK_C) as u16 & 0x8000) != 0
    }
}

#[cfg(not(target_os = "windows"))]
fn copy_shortcut_pressed() -> bool {
    false
}

pub fn start_selection_watcher(app: tauri::AppHandle) {
    if !cfg!(target_os = "windows") || SELECTION_WATCHER_STARTED.get().is_some() {
        return;
    }

    let _ = SELECTION_WATCHER_STARTED.set(());
    thread::spawn(move || {
        let poll_interval = Duration::from_millis(120);
        let copy_window = Duration::from_millis(1200);
        let settings_refresh_interval = Duration::from_secs(2);

        let mut last_seen = String::new();
        let mut last_combo_down = false;
        let mut last_copy_at = Instant::now() - Duration::from_secs(10);
        let mut last_settings_refresh = Instant::now() - settings_refresh_interval;
        let mut clipboard_listen_enabled = false;

        loop {
            if last_settings_refresh.elapsed() >= settings_refresh_interval {
                match load_settings_from_db(&app) {
                    Ok(settings) => clipboard_listen_enabled = settings.clipboard_listen,
                    Err(_) => {
                        thread::sleep(poll_interval);
                        continue;
                    }
                }
                last_settings_refresh = Instant::now();
            }

            if clipboard_listen_enabled {
                thread::sleep(poll_interval);
                continue;
            }

            let combo_down = copy_shortcut_pressed();
            if combo_down && !last_combo_down {
                last_copy_at = Instant::now();
            }
            last_combo_down = combo_down;

            if last_copy_at.elapsed() > copy_window {
                thread::sleep(poll_interval);
                continue;
            }

            let clipboard_text = match platform::read_clipboard_text() {
                Ok(text) => text,
                Err(_) => {
                    thread::sleep(poll_interval);
                    continue;
                }
            };

            let trimmed = clipboard_text.trim();
            if should_translate_selection(trimmed) && trimmed != last_seen {
                last_seen = trimmed.to_string();
                if translate::request_selection_translate_internal(app.clone(), "selection-auto").is_err() {
                    last_seen.clear();
                }
            }

            thread::sleep(poll_interval);
        }
    });
}
