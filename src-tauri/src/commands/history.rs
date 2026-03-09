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

fn normalize_date_range(date_range: Option<String>) -> String {
    match date_range
        .unwrap_or_else(|| "all".into())
        .trim()
        .to_ascii_lowercase()
        .as_str()
    {
        "today" => "today".into(),
        "7d" | "7days" | "last7days" | "last-7-days" => "7d".into(),
        "30d" | "30days" | "last30days" | "last-30-days" => "30d".into(),
        _ => "all".into(),
    }
}

#[tauri::command]
pub fn get_history(
    app: tauri::AppHandle,
    query: Option<String>,
    date_range: Option<String>,
    page: Option<u32>,
    page_size: Option<u32>,
) -> Result<Vec<HistoryItem>, String> {
    let conn = connection::open_app_db(&app)?;
    let keyword = query.unwrap_or_default();
    let normalized_date_range = normalize_date_range(date_range);
    let current_page = page.unwrap_or(1).max(1);
    let size = page_size.unwrap_or(20).clamp(1, 100);
    let offset = (current_page - 1) * size;

    let mut stmt = conn
        .prepare(
            "SELECT id, source_text, result_text, mode, provider, created_at
             FROM history
             WHERE (?1 = '' OR source_text LIKE '%' || ?1 || '%' OR result_text LIKE '%' || ?1 || '%')
               AND (
                   ?2 = 'all'
                   OR (?2 = 'today' AND datetime(created_at, 'localtime') >= datetime('now', 'localtime', 'start of day'))
                   OR (?2 = '7d' AND datetime(created_at, 'localtime') >= datetime('now', 'localtime', '-7 days'))
                   OR (?2 = '30d' AND datetime(created_at, 'localtime') >= datetime('now', 'localtime', '-30 days'))
               )
             ORDER BY created_at DESC, id DESC
             LIMIT ?3 OFFSET ?4",
        )
        .map_err(|error| error.to_string())?;

    let rows = stmt
        .query_map(
            rusqlite::params![keyword, normalized_date_range, size as i64, offset as i64],
            |row| {
                Ok(HistoryItem {
                    id: row.get(0)?,
                    source_text: row.get(1)?,
                    result_text: row.get(2)?,
                    mode: row.get(3)?,
                    provider: row.get(4)?,
                    created_at: row.get(5)?,
                })
            },
        )
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}
