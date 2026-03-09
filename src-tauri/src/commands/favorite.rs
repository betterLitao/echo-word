use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri_plugin_dialog::{DialogExt, FilePath};

use crate::commands::settings::load_settings_from_db;
use crate::db::connection;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FavoriteItem {
    pub id: Option<i64>,
    pub word: String,
    pub phonetic: Option<String>,
    pub chinese_phonetic: Option<String>,
    pub translation: String,
    pub source_text: Option<String>,
    pub created_at: Option<String>,
}

#[tauri::command]
pub fn add_favorite(app: tauri::AppHandle, item: FavoriteItem) -> Result<Option<String>, String> {
    let conn = connection::open_app_db(&app)?;
    conn.execute(
        "INSERT INTO favorites (word, phonetic, chinese_phonetic, translation, source_text)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(word) DO UPDATE SET
           phonetic = excluded.phonetic,
           chinese_phonetic = excluded.chinese_phonetic,
           translation = excluded.translation,
           source_text = excluded.source_text",
        rusqlite::params![
            item.word,
            item.phonetic,
            item.chinese_phonetic,
            item.translation,
            item.source_text,
        ],
    )
    .map_err(|error| error.to_string())?;

    let notice = load_settings_from_db(&app)
        .ok()
        .and_then(|settings| settings.privacy_mode.then_some("隐私模式下收藏仍会保存".to_string()));

    Ok(notice)
}

#[tauri::command]
pub fn remove_favorite(app: tauri::AppHandle, word: String) -> Result<(), String> {
    let conn = connection::open_app_db(&app)?;
    conn.execute("DELETE FROM favorites WHERE word = ?1", rusqlite::params![word])
        .map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_favorites(
    app: tauri::AppHandle,
    query: Option<String>,
    page: Option<u32>,
    page_size: Option<u32>,
) -> Result<Vec<FavoriteItem>, String> {
    let conn = connection::open_app_db(&app)?;
    let keyword = query.unwrap_or_default();
    let current_page = page.unwrap_or(1).max(1);
    let size = page_size.unwrap_or(20).clamp(1, 100);
    let offset = (current_page - 1) * size;

    let mut stmt = conn
        .prepare(
            "SELECT id, word, phonetic, chinese_phonetic, translation, source_text, created_at
             FROM favorites
             WHERE (?1 = '' OR word LIKE '%' || ?1 || '%' OR translation LIKE '%' || ?1 || '%')
             ORDER BY created_at DESC, id DESC
             LIMIT ?2 OFFSET ?3",
        )
        .map_err(|error| error.to_string())?;

    let rows = stmt
        .query_map(
            rusqlite::params![keyword, size as i64, offset as i64],
            |row| {
                Ok(FavoriteItem {
                    id: row.get(0)?,
                    word: row.get(1)?,
                    phonetic: row.get(2)?,
                    chinese_phonetic: row.get(3)?,
                    translation: row.get(4)?,
                    source_text: row.get(5)?,
                    created_at: row.get(6)?,
                })
            },
        )
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

fn map_favorite(row: &rusqlite::Row<'_>) -> Result<FavoriteItem, rusqlite::Error> {
    Ok(FavoriteItem {
        id: row.get(0)?,
        word: row.get(1)?,
        phonetic: row.get(2)?,
        chinese_phonetic: row.get(3)?,
        translation: row.get(4)?,
        source_text: row.get(5)?,
        created_at: row.get(6)?,
    })
}

fn load_all_favorites(app: &tauri::AppHandle) -> Result<Vec<FavoriteItem>, String> {
    let conn = connection::open_app_db(app)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, word, phonetic, chinese_phonetic, translation, source_text, created_at
             FROM favorites
             ORDER BY created_at DESC, id DESC",
        )
        .map_err(|error| error.to_string())?;

    let rows = stmt
        .query_map([], map_favorite)
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

fn escape_csv_field(value: &str) -> String {
    let escaped = value.replace('"', "\"\"");
    format!("\"{}\"", escaped)
}

fn format_favorites_csv(items: &[FavoriteItem]) -> String {
    let mut lines = vec![
        "word,phonetic,chinese_phonetic,translation,created_at".to_string(),
    ];

    for item in items {
        lines.push(
            [
                escape_csv_field(&item.word),
                escape_csv_field(item.phonetic.as_deref().unwrap_or_default()),
                escape_csv_field(item.chinese_phonetic.as_deref().unwrap_or_default()),
                escape_csv_field(&item.translation),
                escape_csv_field(item.created_at.as_deref().unwrap_or_default()),
            ]
            .join(","),
        );
    }

    lines.join("\n")
}

fn format_favorites_anki(items: &[FavoriteItem]) -> String {
    items
        .iter()
        .map(|item| {
            [
                item.word.replace('\t', " "),
                item.translation.replace('\t', " "),
                item.phonetic.clone().unwrap_or_default().replace('\t', " "),
            ]
            .join("\t")
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn extension_for_format(format: &str) -> Option<&'static str> {
    match format {
        "csv" => Some("csv"),
        "json" => Some("json"),
        "anki" => Some("tsv"),
        _ => None,
    }
}

fn filter_name_for_format(format: &str) -> Option<&'static str> {
    match format {
        "csv" => Some("CSV"),
        "json" => Some("JSON"),
        "anki" => Some("Anki TSV"),
        _ => None,
    }
}

#[tauri::command]
pub async fn export_favorites(
    app: tauri::AppHandle,
    format: String,
) -> Result<Option<String>, String> {
    let normalized = format.trim().to_lowercase();
    let extension = extension_for_format(&normalized)
        .ok_or_else(|| "unsupported export format".to_string())?;
    let filter_name = filter_name_for_format(&normalized)
        .ok_or_else(|| "unsupported export format".to_string())?;

    let file_path = app
        .dialog()
        .file()
        .add_filter(filter_name, &[extension])
        .set_file_name(&format!("favorites-export.{extension}"))
        .blocking_save_file();

    let Some(file_path) = file_path else {
        return Ok(None);
    };

    let path = match file_path {
        FilePath::Path(path) => path,
        _ => return Err("unsupported file path".into()),
    };

    let favorites = load_all_favorites(&app)?;
    let content = match normalized.as_str() {
        "csv" => format_favorites_csv(&favorites),
        "json" => serde_json::to_string_pretty(&favorites).map_err(|error| error.to_string())?,
        "anki" => format_favorites_anki(&favorites),
        _ => unreachable!("format already validated"),
    };

    std::fs::write(&path, content).map_err(|error| error.to_string())?;
    Ok(Some(path.to_string_lossy().to_string()))
}
