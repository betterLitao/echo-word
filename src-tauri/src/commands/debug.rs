use serde_json::json;
use tauri::Manager;

use crate::api::ecdict::EcdictProvider;
use crate::api::provider::WordLookupProvider;
use crate::services::phonetic;

/// 测试 ECDICT 查询
#[tauri::command]
pub fn debug_ecdict_lookup(app: tauri::AppHandle, word: String) -> Result<serde_json::Value, String> {
    let provider = EcdictProvider;
    match provider.lookup(&app, &word)? {
        Some(entry) => Ok(json!({
            "found": true,
            "word": entry.word,
            "phonetic": entry.phonetic,
            "translation": entry.translation,
            "pos": entry.pos,
            "exchange": entry.exchange,
        })),
        None => Ok(json!({
            "found": false,
            "word": word,
        })),
    }
}

/// 测试音标谐音生成
#[tauri::command]
pub fn debug_phonetic_hint(phonetic: String) -> Result<String, String> {
    Ok(phonetic::to_chinese_hint(&phonetic))
}

/// 获取词典统计信息
#[tauri::command]
pub fn debug_dict_stats(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    use rusqlite::Connection;

    // 复用 EcdictProvider 的路径解析逻辑
    let mut candidates = Vec::new();

    if let Ok(resource_dir) = app.path().resource_dir() {
        candidates.push(resource_dir.join("ecdict-core.db"));
    }

    let current_dir = std::env::current_dir().map_err(|e| e.to_string())?;
    candidates.push(current_dir.join("src-tauri/resources/ecdict-core.db"));
    candidates.push(current_dir.join("resources/ecdict-core.db"));

    let db_path = candidates
        .iter()
        .find(|p| p.exists())
        .ok_or_else(|| "未找到内置 ECDICT 词典资源".to_string())?;

    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let total_words: i64 = conn
        .query_row("SELECT COUNT(*) FROM stardict", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    let db_size = std::fs::metadata(db_path)
        .map(|m| m.len())
        .unwrap_or(0);

    Ok(json!({
        "path": db_path.display().to_string(),
        "total_words": total_words,
        "size_bytes": db_size,
        "size_mb": format!("{:.2}", db_size as f64 / 1024.0 / 1024.0),
    }))
}
