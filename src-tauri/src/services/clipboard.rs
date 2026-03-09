use std::sync::OnceLock;
use std::thread;
use std::time::{Duration, Instant};

use crate::commands::settings::load_settings_from_db;
use crate::commands::translate;
use crate::utils::platform;

static CLIPBOARD_WATCHER_STARTED: OnceLock<()> = OnceLock::new();
const WATCHER_POLL_INTERVAL: Duration = Duration::from_millis(900);
const FAILURE_RETRY_WINDOW: Duration = Duration::from_secs(10);

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
        let mut last_failed: Option<(String, Instant)> = None;

        loop {
            let settings = match load_settings_from_db(&app) {
                Ok(settings) => settings,
                Err(_) => {
                    thread::sleep(WATCHER_POLL_INTERVAL);
                    continue;
                }
            };

            if !settings.clipboard_listen {
                thread::sleep(WATCHER_POLL_INTERVAL);
                continue;
            }

            let clipboard_text = match platform::read_clipboard_text() {
                Ok(text) => text,
                Err(_) => {
                    thread::sleep(WATCHER_POLL_INTERVAL);
                    continue;
                }
            };

            let trimmed = clipboard_text.trim().to_string();
            if !should_translate_clipboard(&trimmed) || trimmed == last_seen {
                thread::sleep(WATCHER_POLL_INTERVAL);
                continue;
            }

            if let Some((failed_text, failed_at)) = &last_failed {
                if &trimmed == failed_text && failed_at.elapsed() < FAILURE_RETRY_WINDOW {
                    thread::sleep(WATCHER_POLL_INTERVAL);
                    continue;
                }
            }

            match translate::translate_captured_text_internal(
                app.clone(),
                clipboard_text,
                "clipboard-watch",
            ) {
                Ok(()) => {
                    last_seen = trimmed.clone();
                    last_failed = None;
                }
                Err(_) => {
                    last_failed = Some((trimmed, Instant::now()));
                }
            }

            thread::sleep(WATCHER_POLL_INTERVAL);
        }
    });
}
