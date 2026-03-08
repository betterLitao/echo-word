use tauri::AppHandle;

#[derive(Debug, Clone)]
pub struct DictEntry {
    pub word: String,
    pub phonetic: Option<String>,
    pub translation: String,
    pub pos: Option<String>,
    pub exchange: Option<String>,
}

#[derive(Debug, Clone)]
pub struct SentenceTranslation {
    pub translated_text: String,
    pub note: Option<String>,
}

pub trait WordLookupProvider {
    fn id(&self) -> &'static str;
    fn lookup(&self, app: &AppHandle, word: &str) -> Result<Option<DictEntry>, String>;
}

pub trait SentenceTranslateProvider {
    fn id(&self) -> &'static str;
    fn translate(&self, text: &str, api_key: Option<&str>) -> Result<SentenceTranslation, String>;
}
