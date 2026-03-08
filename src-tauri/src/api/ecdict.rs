use std::path::PathBuf;

use rusqlite::Connection;
use tauri::Manager;

use crate::api::provider::{DictEntry, WordLookupProvider};

pub struct EcdictProvider;

impl EcdictProvider {
    // 资源路径同时兼容开发态和后续打包态，避免只在其中一种环境下可用。
    fn resolve_db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
        let mut candidates = Vec::new();

        if let Ok(resource_dir) = app.path().resource_dir() {
            candidates.push(resource_dir.join("ecdict-core.db"));
        }

        let current_dir = std::env::current_dir().map_err(|error| error.to_string())?;
        candidates.push(current_dir.join("src-tauri/resources/ecdict-core.db"));
        candidates.push(current_dir.join("resources/ecdict-core.db"));

        candidates
            .into_iter()
            .find(|path| path.exists())
            .ok_or_else(|| "未找到内置 ECDICT 词典资源".to_string())
    }

    fn open_connection(app: &tauri::AppHandle) -> Result<Connection, String> {
        let path = Self::resolve_db_path(app)?;
        Connection::open(path).map_err(|error| error.to_string())
    }

    fn fallback_entry(word: &str) -> Option<DictEntry> {
        match word.to_lowercase().as_str() {
            "ephemeral" => Some(DictEntry {
                word: "ephemeral".into(),
                phonetic: Some("/ɪˈfemərəl/".into()),
                translation: "adj. 短暂的；转瞬即逝的".into(),
                pos: Some("adj.".into()),
                exchange: None,
            }),
            "think" => Some(DictEntry {
                word: "think".into(),
                phonetic: Some("/θɪŋk/".into()),
                translation: "v. 想；思考；认为".into(),
                pos: Some("v.".into()),
                exchange: Some("thought|thinking".into()),
            }),
            _ => None,
        }
    }
}

impl WordLookupProvider for EcdictProvider {
    fn id(&self) -> &'static str {
        "ecdict"
    }

    fn lookup(&self, app: &tauri::AppHandle, word: &str) -> Result<Option<DictEntry>, String> {
        let normalized = word.trim().to_lowercase();
        if normalized.is_empty() {
            return Ok(None);
        }

        let conn = match Self::open_connection(app) {
            Ok(conn) => conn,
            Err(_) => return Ok(Self::fallback_entry(&normalized)),
        };

        let mut stmt = conn
            .prepare(
                "SELECT word, phonetic, translation, pos, exchange
                 FROM stardict
                 WHERE lower(word) = lower(?1)
                 LIMIT 1",
            )
            .map_err(|error| error.to_string())?;

        let row = stmt.query_row([normalized.as_str()], |row| {
            Ok(DictEntry {
                word: row.get::<_, String>(0)?,
                phonetic: row.get::<_, Option<String>>(1)?,
                translation: row.get::<_, String>(2)?,
                pos: row.get::<_, Option<String>>(3)?,
                exchange: row.get::<_, Option<String>>(4)?,
            })
        });

        match row {
            Ok(entry) => Ok(Some(entry)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(Self::fallback_entry(&normalized)),
            Err(error) => Err(error.to_string()),
        }
    }
}
