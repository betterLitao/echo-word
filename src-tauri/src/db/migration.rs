use crate::db::connection;

const INIT_SQL: &str = include_str!("migrations/v001_init.sql");

const DEFAULT_SETTINGS: &[(&str, &str)] = &[
    ("shortcut_translate", "\"CmdOrCtrl+Shift+T\""),
    ("shortcut_input", "\"CmdOrCtrl+Shift+I\""),
    ("translation_provider", "\"ecdict\""),
    ("fallback_chain", "[\"deepl\",\"tencent\",\"baidu\"]"),
    ("api_keys", "{}"),
    ("youdao_app_key", "\"\""),
    ("youdao_app_secret", "\"\""),
    ("tencent_secret_id", "\"\""),
    ("tencent_secret_key", "\"\""),
    ("baidu_app_id", "\"\""),
    ("baidu_secret_key", "\"\""),
    ("theme", "\"system\""),
    ("data_dir", "\"默认应用目录\""),
    ("privacy_mode", "false"),
    ("auto_start", "false"),
    ("clipboard_listen", "false"),
    ("auto_update", "true"),
    ("proxy", "\"\""),
    ("proxy_enabled", "false"),
    ("proxy_url", "\"\""),
    ("http_api_port", "16888"),
    ("onboarding_completed", "false"),
    ("dictionary_version", "\"core\""),
    ("multi_engine_enabled", "false"),
    ("multi_engine_list", "[]"),
    ("ollama_endpoint", "\"http://localhost:11434/api/generate\""),
    ("ollama_model", "\"\""),
    ("popup_last_x", "null"),
    ("popup_last_y", "null"),
    ("language", "\"zh-CN\""),
];

// 当前阶段先提供最小 Migration 能力：
// 1. 初始化 schema；
// 2. 写入默认设置；
// 3. 记录版本号。
// 后续新增表或字段时，只需要继续追加版本脚本即可。
pub fn run_migrations(app: &tauri::AppHandle) -> Result<(), String> {
    let conn = connection::open_app_db(app)?;
    conn.execute_batch(INIT_SQL)
        .map_err(|error| error.to_string())?;

    // 默认设置采用 INSERT OR IGNORE，保证首次初始化和后续升级都可安全重复执行。
    for (key, value) in DEFAULT_SETTINGS {
        conn.execute(
            "INSERT OR IGNORE INTO settings (key, value) VALUES (?1, ?2)",
            rusqlite::params![key, value],
        )
        .map_err(|error| error.to_string())?;
    }

    let current_version: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_version",
            [],
            |row| row.get(0),
        )
        .map_err(|error| error.to_string())?;

    if current_version == 0 {
        conn.execute(
            "INSERT INTO schema_version (version, description) VALUES (?1, ?2)",
            rusqlite::params![1_i64, "initial schema"],
        )
        .map_err(|error| error.to_string())?;
    }

    Ok(())
}
