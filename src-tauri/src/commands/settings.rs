use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::Manager;

use crate::db::{connection, migration};
use crate::utils::platform;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct AppSettings {
    pub shortcut_translate: String,
    pub shortcut_input: String,
    pub translation_provider: String,
    pub fallback_chain: Vec<String>,
    pub api_keys: serde_json::Map<String, Value>,
    pub theme: String,
    pub data_dir: String,
    pub privacy_mode: bool,
    pub clipboard_listen: bool,
    pub auto_update: bool,
    pub proxy: String,
    pub http_api_port: u16,
    pub onboarding_completed: bool,
    pub dictionary_version: String,
    pub multi_engine_enabled: bool,
    pub multi_engine_list: Vec<String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            shortcut_translate: "CmdOrCtrl+Shift+T".into(),
            shortcut_input: "CmdOrCtrl+Shift+I".into(),
            translation_provider: "ecdict".into(),
            fallback_chain: vec!["deepl".into(), "tencent".into(), "baidu".into()],
            api_keys: serde_json::Map::new(),
            theme: "system".into(),
            data_dir: "默认应用目录".into(),
            privacy_mode: false,
            clipboard_listen: false,
            auto_update: true,
            proxy: String::new(),
            http_api_port: 16888,
            onboarding_completed: false,
            dictionary_version: "core".into(),
            multi_engine_enabled: false,
            multi_engine_list: Vec::new(),
        }
    }
}

impl AppSettings {
    pub fn api_key(&self, provider: &str) -> Option<&str> {
        self.api_keys.get(provider).and_then(|value| value.as_str())
    }
}

fn parse_value<T: serde::de::DeserializeOwned>(raw: Option<&String>, default: T) -> T {
    raw.and_then(|value| serde_json::from_str::<T>(value).ok())
        .unwrap_or(default)
}

// settings 表底层是 KV 结构，这里在命令层把它还原为前端可直接消费的完整配置对象。
pub(crate) fn load_settings_from_db(app: &tauri::AppHandle) -> Result<AppSettings, String> {
    migration::run_migrations(app)?;
    let conn = connection::open_app_db(app)?;
    let mut stmt = conn
        .prepare("SELECT key, value FROM settings")
        .map_err(|error| error.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|error| error.to_string())?;

    let pairs = rows
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())?;

    let map = pairs.into_iter().collect::<std::collections::HashMap<String, String>>();
    let defaults = AppSettings::default();

    Ok(AppSettings {
        shortcut_translate: parse_value(map.get("shortcut_translate"), defaults.shortcut_translate),
        shortcut_input: parse_value(map.get("shortcut_input"), defaults.shortcut_input),
        translation_provider: parse_value(map.get("translation_provider"), defaults.translation_provider),
        fallback_chain: parse_value(map.get("fallback_chain"), defaults.fallback_chain),
        api_keys: parse_value(map.get("api_keys"), defaults.api_keys),
        theme: parse_value(map.get("theme"), defaults.theme),
        data_dir: parse_value(map.get("data_dir"), defaults.data_dir),
        privacy_mode: parse_value(map.get("privacy_mode"), defaults.privacy_mode),
        clipboard_listen: parse_value(map.get("clipboard_listen"), defaults.clipboard_listen),
        auto_update: parse_value(map.get("auto_update"), defaults.auto_update),
        proxy: parse_value(map.get("proxy"), defaults.proxy),
        http_api_port: parse_value(map.get("http_api_port"), defaults.http_api_port),
        onboarding_completed: parse_value(map.get("onboarding_completed"), defaults.onboarding_completed),
        dictionary_version: parse_value(map.get("dictionary_version"), defaults.dictionary_version),
        multi_engine_enabled: parse_value(map.get("multi_engine_enabled"), defaults.multi_engine_enabled),
        multi_engine_list: parse_value(map.get("multi_engine_list"), defaults.multi_engine_list),
    })
}

#[tauri::command]
pub fn get_settings(app: tauri::AppHandle) -> Result<AppSettings, String> {
    load_settings_from_db(&app)
}

#[tauri::command]
pub fn update_setting(app: tauri::AppHandle, key: String, value: Value) -> Result<(), String> {
    // 统一使用 JSON 字符串落库，便于后续存储数组、对象等复杂配置。
    migration::run_migrations(&app)?;
    let conn = connection::open_app_db(&app)?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')",
        rusqlite::params![key, value.to_string()],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn check_accessibility() -> bool {
    platform::check_accessibility_permission()
}

#[tauri::command]
pub fn open_accessibility_settings() -> Result<(), String> {
    platform::open_accessibility_settings()
}

#[tauri::command]
pub fn show_popup(app: tauri::AppHandle) -> Result<(), String> {
    // Cycle 01 先打通窗口控制命令，后续翻译完成后只需要补事件和定位逻辑。
    let window = app
        .get_webview_window("popup")
        .ok_or_else(|| "popup window not found".to_string())?;
    window.show().map_err(|error| error.to_string())?;
    window.set_focus().map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn hide_popup(app: tauri::AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("popup")
        .ok_or_else(|| "popup window not found".to_string())?;
    window.hide().map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn show_main_window(app: tauri::AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())?;
    window.show().map_err(|error| error.to_string())?;
    window.set_focus().map_err(|error| error.to_string())?;
    Ok(())
}
