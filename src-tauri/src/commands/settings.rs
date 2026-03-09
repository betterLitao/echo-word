use std::str::FromStr;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::Manager;
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_global_shortcut::Shortcut;

use crate::commands::translate::show_popup_near_cursor;
use crate::db::{connection, migration};
use crate::services::runtime;
use crate::utils::{crypto, platform};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct AppSettings {
    pub shortcut_translate: String,
    pub shortcut_input: String,
    pub translation_provider: String,
    pub fallback_chain: Vec<String>,
    pub api_keys: serde_json::Map<String, Value>,
    pub youdao_app_key: String,
    pub youdao_app_secret: String,
    pub tencent_secret_id: String,
    pub tencent_secret_key: String,
    pub baidu_app_id: String,
    pub baidu_secret_key: String,
    pub theme: String,
    pub data_dir: String,
    pub privacy_mode: bool,
    pub auto_start: bool,
    pub clipboard_listen: bool,
    pub auto_update: bool,
    pub proxy_enabled: bool,
    pub proxy_url: String,
    pub http_api_port: u16,
    pub onboarding_completed: bool,
    pub dictionary_version: String,
    pub multi_engine_enabled: bool,
    pub multi_engine_list: Vec<String>,
    pub ollama_endpoint: String,
    pub ollama_model: String,
    pub popup_last_x: Option<i32>,
    pub popup_last_y: Option<i32>,
    pub language: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            shortcut_translate: "CmdOrCtrl+Shift+T".into(),
            shortcut_input: "CmdOrCtrl+Shift+I".into(),
            translation_provider: "ecdict".into(),
            fallback_chain: vec!["deepl".into(), "tencent".into(), "baidu".into()],
            api_keys: serde_json::Map::new(),
            youdao_app_key: String::new(),
            youdao_app_secret: String::new(),
            tencent_secret_id: String::new(),
            tencent_secret_key: String::new(),
            baidu_app_id: String::new(),
            baidu_secret_key: String::new(),
            theme: "system".into(),
            data_dir: "默认应用目录".into(),
            privacy_mode: false,
            auto_start: false,
            clipboard_listen: false,
            auto_update: true,
            proxy_enabled: false,
            proxy_url: String::new(),
            http_api_port: 16888,
            onboarding_completed: false,
            dictionary_version: "core".into(),
            multi_engine_enabled: false,
            multi_engine_list: Vec::new(),
            ollama_endpoint: "http://localhost:11434/api/generate".into(),
            ollama_model: String::new(),
            popup_last_x: None,
            popup_last_y: None,
            language: "zh-CN".into(),
        }
    }
}

impl AppSettings {
    pub fn api_key(&self, provider: &str) -> Option<&str> {
        self.api_keys.get(provider).and_then(|value| value.as_str())
    }

    pub fn active_proxy(&self) -> Option<&str> {
        self.proxy_enabled
            .then_some(self.proxy_url.trim())
            .filter(|value| !value.is_empty())
    }
}

fn parse_value<T: serde::de::DeserializeOwned>(raw: Option<&String>, default: T) -> T {
    raw.and_then(|value| serde_json::from_str::<T>(value).ok())
        .unwrap_or(default)
}

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
    let map = pairs
        .into_iter()
        .collect::<std::collections::HashMap<String, String>>();

    let defaults = AppSettings::default();
    let api_keys = crypto::decrypt_api_keys(
        app,
        parse_value(map.get("api_keys"), defaults.api_keys.clone()),
    );

    let legacy_proxy: String = parse_value(map.get("proxy"), String::new());
    let proxy_url_default = if legacy_proxy.trim().is_empty() {
        defaults.proxy_url.clone()
    } else {
        legacy_proxy
    };
    let proxy_url = parse_value(map.get("proxy_url"), proxy_url_default);
    let proxy_enabled = parse_value(map.get("proxy_enabled"), !proxy_url.trim().is_empty());
    let auto_start_stored = parse_value(map.get("auto_start"), defaults.auto_start);
    let auto_start = app
        .autolaunch()
        .is_enabled()
        .unwrap_or(auto_start_stored);

    Ok(AppSettings {
        shortcut_translate: parse_value(map.get("shortcut_translate"), defaults.shortcut_translate),
        shortcut_input: parse_value(map.get("shortcut_input"), defaults.shortcut_input),
        translation_provider: parse_value(map.get("translation_provider"), defaults.translation_provider),
        fallback_chain: parse_value(map.get("fallback_chain"), defaults.fallback_chain),
        api_keys,
        youdao_app_key: parse_value(map.get("youdao_app_key"), defaults.youdao_app_key),
        youdao_app_secret: parse_value(map.get("youdao_app_secret"), defaults.youdao_app_secret),
        tencent_secret_id: parse_value(map.get("tencent_secret_id"), defaults.tencent_secret_id),
        tencent_secret_key: parse_value(map.get("tencent_secret_key"), defaults.tencent_secret_key),
        baidu_app_id: parse_value(map.get("baidu_app_id"), defaults.baidu_app_id),
        baidu_secret_key: parse_value(map.get("baidu_secret_key"), defaults.baidu_secret_key),
        theme: parse_value(map.get("theme"), defaults.theme),
        data_dir: parse_value(map.get("data_dir"), defaults.data_dir),
        privacy_mode: parse_value(map.get("privacy_mode"), defaults.privacy_mode),
        auto_start,
        clipboard_listen: parse_value(map.get("clipboard_listen"), defaults.clipboard_listen),
        auto_update: parse_value(map.get("auto_update"), defaults.auto_update),
        proxy_enabled,
        proxy_url,
        http_api_port: parse_value(map.get("http_api_port"), defaults.http_api_port),
        onboarding_completed: parse_value(map.get("onboarding_completed"), defaults.onboarding_completed),
        dictionary_version: parse_value(map.get("dictionary_version"), defaults.dictionary_version),
        multi_engine_enabled: parse_value(map.get("multi_engine_enabled"), defaults.multi_engine_enabled),
        multi_engine_list: parse_value(map.get("multi_engine_list"), defaults.multi_engine_list),
        ollama_endpoint: parse_value(map.get("ollama_endpoint"), defaults.ollama_endpoint),
        ollama_model: parse_value(map.get("ollama_model"), defaults.ollama_model),
        popup_last_x: parse_value(map.get("popup_last_x"), defaults.popup_last_x),
        popup_last_y: parse_value(map.get("popup_last_y"), defaults.popup_last_y),
        language: parse_value(map.get("language"), defaults.language),
    })
}

#[tauri::command]
pub fn get_settings(app: tauri::AppHandle) -> Result<AppSettings, String> {
    load_settings_from_db(&app)
}

fn validate_shortcut_value(key: &str, value: &Value) -> Result<(), String> {
    if key != "shortcut_translate" && key != "shortcut_input" {
        return Ok(());
    }

    let shortcut = value
        .as_str()
        .ok_or_else(|| "快捷键配置必须是字符串".to_string())?;
    Shortcut::from_str(shortcut)
        .map(|_| ())
        .map_err(|error| format!("快捷键格式无效：{}", error))
}

fn persist_setting(app: &tauri::AppHandle, key: &str, stored_value: Value) -> Result<(), String> {
    let stored_json = stored_value.to_string();

    migration::run_migrations(app)?;
    let conn = connection::open_app_db(app)?;
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')",
        rusqlite::params![key, stored_json],
    )
    .map_err(|error| error.to_string())?;

    Ok(())
}

fn apply_side_effects(app: &tauri::AppHandle, key: &str, value: &Value) -> Result<(), String> {
    if matches!(key, "shortcut_translate" | "shortcut_input") {
        runtime::refresh_global_shortcuts(app)?;
    }

    if key == "auto_start" {
        let enabled = value
            .as_bool()
            .ok_or_else(|| "auto_start 必须是布尔值".to_string())?;

        if enabled {
            app.autolaunch().enable().map_err(|error| error.to_string())?;
        } else {
            app.autolaunch().disable().map_err(|error| error.to_string())?;
        }
    }

    if key == "privacy_mode" {
        crate::rebuild_tray(app)?;
    }

    Ok(())
}

pub(crate) fn update_setting_value(
    app: &tauri::AppHandle,
    key: &str,
    value: Value,
) -> Result<(), String> {
    validate_shortcut_value(key, &value)?;
    let runtime_value = value.clone();

    let stored_value = if key == "api_keys" {
        crypto::encrypt_api_key_map(app, value)
    } else {
        value
    };

    persist_setting(app, key, stored_value)?;
    apply_side_effects(app, key, &runtime_value)
}

#[tauri::command]
pub fn update_setting(app: tauri::AppHandle, key: String, value: Value) -> Result<(), String> {
    update_setting_value(&app, &key, value)
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
    show_popup_near_cursor(&app)
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
pub fn reset_popup_position(app: tauri::AppHandle) -> Result<(), String> {
    update_setting_value(&app, "popup_last_x", Value::Null)?;
    update_setting_value(&app, "popup_last_y", Value::Null)?;
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
