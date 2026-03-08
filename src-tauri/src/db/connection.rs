use std::fs;
use std::path::PathBuf;

use rusqlite::Connection;

pub fn app_data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let path = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join("echoword");
    fs::create_dir_all(&path).map_err(|error| error.to_string())?;
    Ok(path)
}

pub fn app_db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app_data_dir(app)?.join("data.db"))
}

pub fn open_app_db(app: &tauri::AppHandle) -> Result<Connection, String> {
    let db_path = app_db_path(app)?;
    let conn = Connection::open(db_path).map_err(|error| error.to_string())?;
    conn.pragma_update(None, "journal_mode", "WAL")
        .map_err(|error| error.to_string())?;
    Ok(conn)
}
