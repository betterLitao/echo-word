mod api;
mod commands;
mod db;
mod http_server;
mod services;
mod utils;

use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};
use tauri_plugin_autostart::MacosLauncher;

fn build_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    let privacy_mode_enabled = commands::settings::load_settings_from_db(app)
        .map(|settings| settings.privacy_mode)
        .unwrap_or(false);

    let show_item = MenuItem::with_id(app, "show", "显示主窗口", true, None::<&str>)?;
    let settings_item = MenuItem::with_id(app, "settings", "设置", true, None::<&str>)?;
    let privacy_item = CheckMenuItem::with_id(
        app,
        "privacy_mode",
        "隐私模式",
        true,
        privacy_mode_enabled,
        None::<&str>,
    )?;
    let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_item, &settings_item, &privacy_item, &quit_item])?;

    TrayIconBuilder::with_id("main-tray")
        .menu(&menu)
        .on_menu_event(|app, event| match event.id().0.as_str() {
            "show" | "settings" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "privacy_mode" => {
                if let Ok(settings) = commands::settings::load_settings_from_db(app) {
                    let next_value = !settings.privacy_mode;
                    let _ = commands::settings::update_setting(
                        app.clone(),
                        "privacy_mode".into(),
                        serde_json::json!(next_value),
                    );
                }
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                if let Some(window) = tray.app_handle().get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}

pub(crate) fn rebuild_tray(app: &tauri::AppHandle) -> Result<(), String> {
    let _ = app.remove_tray_by_id("main-tray");
    build_tray(app).map_err(|error| error.to_string())
}

fn wire_main_window(app: &tauri::App) {
    if let Some(window) = app.get_webview_window("main") {
        let app_handle = app.handle().clone();
        window.on_window_event(move |event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                if let Some(main_window) = app_handle.get_webview_window("main") {
                    let _ = main_window.hide();
                }
            }
        });

        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn wire_popup_window(app: &tauri::App) {
    if let Some(window) = app.get_webview_window("popup") {
        let app_handle = app.handle().clone();
        window.on_window_event(move |event| {
            if let tauri::WindowEvent::Moved(position) = event {
                let popup_position_state = app_handle.state::<commands::translate::PopupPositionState>();
                if popup_position_state.consume_if_programmatic(position.x, position.y) {
                    return;
                }

                let _ = commands::settings::update_setting_value(
                    &app_handle,
                    "popup_last_x",
                    serde_json::json!(position.x),
                );
                let _ = commands::settings::update_setting_value(
                    &app_handle,
                    "popup_last_y",
                    serde_json::json!(position.y),
                );
            }
        });
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None::<Vec<&str>>,
        ))
        .setup(|app| {
            db::migration::run_migrations(&app.handle())?;
            app.manage(commands::translate::PopupPositionState::default());
            build_tray(&app.handle())?;
            wire_main_window(app);
            wire_popup_window(app);

            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(|app, shortcut, event| {
                        services::runtime::handle_shortcut_event(app, &shortcut, event.state());
                    })
                    .build(),
            )?;
            let _ = services::runtime::refresh_global_shortcuts(&app.handle());

            let settings = commands::settings::load_settings_from_db(&app.handle())?;
            http_server::start_http_server(settings.http_api_port, app.handle().clone());
            services::selection::start_selection_watcher(app.handle().clone());
            services::clipboard::start_clipboard_watcher(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::settings::get_settings,
            commands::settings::update_setting,
            commands::settings::check_accessibility,
            commands::settings::open_accessibility_settings,
            commands::settings::show_popup,
            commands::settings::hide_popup,
            commands::settings::reset_popup_position,
            commands::settings::show_main_window,
            commands::translate::translate,
            commands::translate::translate_and_show_popup,
            commands::translate::request_input_translate,
            commands::translate::request_selection_translate,
            commands::favorite::add_favorite,
            commands::favorite::remove_favorite,
            commands::favorite::get_favorites,
            commands::favorite::export_favorites,
            commands::history::get_history,
        ])
        .run(tauri::generate_context!())
        .expect("failed to run EchoWord application")
}
