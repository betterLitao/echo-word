use std::sync::OnceLock;
use std::thread;
use std::time::Duration;

use crate::commands::settings::load_settings_from_db;
use crate::commands::translate::request_selection_translate;
use crate::utils::platform;

static CLIPBOARD_WATCHER_STARTED: OnceLock<()> = OnceLock::new();

fn should_translate_clipboard(text: &str) -> bool {
    let trimmed = text.trim();
    if trimmed.is_empty() || trimmed.len() > 240 {
        return false;
    }

    trimmed.chars().any(|character| character.is_ascii_alphabetic())
}

pub fn start_clipboard_watcher(app: tauri::AppHandle) {
    if CLIPBOARD_WATCHER_STARTED.get().is_some() {
        return;
    }

    let _ = CLIPBOARD_WATCHER_STARTED.set(());
    thread::spawn(move || {
        let mut last_seen = String::new();

        loop {
            let settings = match load_settings_from_db(&app) {
                Ok(settings) => settings,
                Err(_) => {
                    thread::sleep(Duration::from_millis(900));
                    continue;
                }
            };

            if !settings.clipboard_listen {
                thread::sleep(Duration::from_millis(900));
                continue;
            }

            let clipboard_text = match platform::read_clipboard_text() {
                Ok(text) => text,
                Err(_) => {
                    thread::sleep(Duration::from_millis(900));
                    continue;
                }
            };

            let trimmed = clipboard_text.trim();
            if !should_translate_clipboard(trimmed) || trimmed == last_seen {
                thread::sleep(Duration::from_millis(900));
                continue;
            }

            // 监听模式只负责侦测“新文本”，真正的翻译与弹窗展示继续复用现有命令，
            // 这样快捷键、HTTP API 和剪贴板监听三条入口可以共享完全相同的业务链路。
            last_seen = trimmed.to_string();
            let _ = request_selection_translate(app.clone());
            thread::sleep(Duration::from_millis(900));
        }
    });
}
