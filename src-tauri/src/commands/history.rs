use serde::{Deserialize, Serialize};

use crate::db::connection;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryItem {
    pub id: i64,
    pub source_text: String,
    pub result_text: String,
    pub mode: String,
    pub provider: Option<String>,
    pub created_at: String,
}

#[tauri::command]
pub fn get_history(app: tauri::AppHandle, query: Option<String>) -> Result<Vec<HistoryItem>, String> {
    let conn = connection::open_app_db(&app)?;
    let keyword = query.unwrap_or_default();

    let mut stmt = conn
        .prepare(
            "SELECT id, source_text, result_text, mode, provider, created_at
             FROM history
             WHERE (?1 = '' OR source_text LIKE '%' || ?1 || '%' OR result_text LIKE '%' || ?1 || '%')
             ORDER BY created_at DESC, id DESC",
        )
        .map_err(|error| error.to_string())?;

    let rows = stmt
        .query_map([keyword], |row| {
            Ok(HistoryItem {
                id: row.get(0)?,
                source_text: row.get(1)?,
                result_text: row.get(2)?,
                mode: row.get(3)?,
                provider: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}
