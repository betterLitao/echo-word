mod api;
mod commands;
mod db;
mod http_server;
mod services;
mod utils;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

fn build_tray(app: &tauri::App) -> tauri::Result<()> {
    let show_item = MenuItem::with_id(app, "show", "显示主窗口", true, None::<&str>)?;
    let settings_item = MenuItem::with_id(app, "settings", "设置", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_item, &settings_item, &quit_item])?;

    TrayIconBuilder::with_id("main-tray")
        .menu(&menu)
        .on_menu_event(|app, event| match event.id().0.as_str() {
            "show" | "settings" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
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

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            db::migration::run_migrations(&app.handle())?;
            build_tray(app)?;
            wire_main_window(app);

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
            commands::settings::show_main_window,
            commands::translate::translate,
            commands::translate::translate_and_show_popup,
            commands::translate::request_input_translate,
            commands::translate::request_selection_translate,
            commands::favorite::add_favorite,
            commands::favorite::remove_favorite,
            commands::favorite::get_favorites,
            commands::history::get_history,
        ])
        .run(tauri::generate_context!())
        .expect("failed to run EchoWord application")
}
