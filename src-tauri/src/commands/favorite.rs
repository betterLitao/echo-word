use serde::{Deserialize, Serialize};

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
pub fn add_favorite(app: tauri::AppHandle, item: FavoriteItem) -> Result<(), String> {
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
    Ok(())
}

#[tauri::command]
pub fn remove_favorite(app: tauri::AppHandle, word: String) -> Result<(), String> {
    let conn = connection::open_app_db(&app)?;
    conn.execute("DELETE FROM favorites WHERE word = ?1", rusqlite::params![word])
        .map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_favorites(app: tauri::AppHandle, query: Option<String>) -> Result<Vec<FavoriteItem>, String> {
    let conn = connection::open_app_db(&app)?;
    let keyword = query.unwrap_or_default();

    let mut stmt = conn
        .prepare(
            "SELECT id, word, phonetic, chinese_phonetic, translation, source_text, created_at
             FROM favorites
             WHERE (?1 = '' OR word LIKE '%' || ?1 || '%' OR translation LIKE '%' || ?1 || '%')
             ORDER BY created_at DESC, id DESC",
        )
        .map_err(|error| error.to_string())?;

    let rows = stmt
        .query_map([keyword], |row| {
            Ok(FavoriteItem {
                id: row.get(0)?,
                word: row.get(1)?,
                phonetic: row.get(2)?,
                chinese_phonetic: row.get(3)?,
                translation: row.get(4)?,
                source_text: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}
