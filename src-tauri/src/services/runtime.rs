use std::str::FromStr;
use std::sync::{Mutex, OnceLock};
use std::thread;
use std::time::{Duration, Instant};

use tauri::AppHandle;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use crate::commands::{settings::load_settings_from_db, translate};

const TRANSLATE_SHORTCUT_DEBOUNCE_MS: u64 = 300;

static LAST_TRANSLATE_SHORTCUT_AT: OnceLock<Mutex<Option<Instant>>> = OnceLock::new();

fn shortcut_matches(configured: &str, current: &Shortcut) -> bool {
    Shortcut::from_str(configured)
        .map(|shortcut| shortcut == *current)
        .unwrap_or(false)
}

fn should_debounce_translate_shortcut() -> bool {
    let now = Instant::now();
    let store = LAST_TRANSLATE_SHORTCUT_AT.get_or_init(|| Mutex::new(None));
    let mut last_triggered_at = match store.lock() {
        Ok(guard) => guard,
        Err(poisoned) => poisoned.into_inner(),
    };

    if let Some(previous) = *last_triggered_at {
        if now.duration_since(previous) < Duration::from_millis(TRANSLATE_SHORTCUT_DEBOUNCE_MS) {
            return true;
        }
    }

    *last_triggered_at = Some(now);
    false
}

pub fn refresh_global_shortcuts(app: &AppHandle) -> Result<(), String> {
    let settings = load_settings_from_db(app)?;
    let manager = app.global_shortcut();

    let _ = manager.unregister_all();

    for shortcut_value in [&settings.shortcut_translate, &settings.shortcut_input] {
        if shortcut_value.trim().is_empty() {
            continue;
        }

        let shortcut = Shortcut::from_str(shortcut_value)
            .map_err(|error| format!("快捷键格式无效（{}）：{}", shortcut_value, error))?;
        manager
            .register(shortcut)
            .map_err(|error| format!("注册快捷键失败（{}）：{}", shortcut_value, error))?;
    }

    Ok(())
}

pub fn handle_shortcut_event(app: &AppHandle, shortcut: &Shortcut, state: ShortcutState) {
    if state != ShortcutState::Pressed {
        return;
    }

    let settings = match load_settings_from_db(app) {
        Ok(settings) => settings,
        Err(error) => {
            log::warn!("failed to load settings for shortcut handling: {}", error);
            return;
        }
    };

    if shortcut_matches(&settings.shortcut_translate, shortcut) {
        if should_debounce_translate_shortcut() {
            log::debug!("translate shortcut ignored because debounce window is active");
            return;
        }

        let app = app.clone();
        thread::spawn(move || {
            let _ = translate::request_selection_translate(app);
        });
        return;
    }

    if shortcut_matches(&settings.shortcut_input, shortcut) {
        let _ = translate::request_input_translate(app.clone());
    }
}
