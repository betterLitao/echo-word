use crate::services::translator::{self, TranslationMode, TranslationResult};

#[tauri::command]
pub fn translate(
    app: tauri::AppHandle,
    text: String,
    mode: Option<String>,
) -> Result<TranslationResult, String> {
    let mode = match mode.as_deref() {
        Some("word") => TranslationMode::Word,
        Some("sentence") => TranslationMode::Sentence,
        _ => TranslationMode::Auto,
    };

    translator::translate(&app, &text, mode)
}
