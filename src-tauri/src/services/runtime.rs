use std::str::FromStr;
use std::thread;

use tauri::AppHandle;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use crate::commands::{settings::load_settings_from_db, translate};

fn shortcut_matches(configured: &str, current: &Shortcut) -> bool {
    Shortcut::from_str(configured)
        .map(|shortcut| shortcut == *current)
        .unwrap_or(false)
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

// 快捷键回调必须尽量轻：
// 真正可能阻塞的翻译逻辑交给后台线程，避免全局快捷键按下后卡住主线程。
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
