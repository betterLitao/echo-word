use std::num::NonZeroUsize;
use std::sync::{Mutex, OnceLock};

use lru::LruCache;

use crate::services::translator::TranslationResult;

static TRANSLATION_CACHE: OnceLock<Mutex<LruCache<String, TranslationResult>>> = OnceLock::new();

fn cache() -> &'static Mutex<LruCache<String, TranslationResult>> {
    TRANSLATION_CACHE.get_or_init(|| {
        Mutex::new(LruCache::new(
            NonZeroUsize::new(500).expect("cache capacity must be non-zero"),
        ))
    })
}

fn cache_key(provider: &str, from: &str, to: &str, text: &str) -> String {
    format!("{}:{}:{}:{}", provider, from, to, text.trim().to_lowercase())
}

pub fn get(provider: &str, from: &str, to: &str, text: &str) -> Option<TranslationResult> {
    cache()
        .lock()
        .ok()
        .and_then(|mut store| store.get(&cache_key(provider, from, to, text)).cloned())
}

pub fn put(provider: &str, from: &str, to: &str, text: &str, result: TranslationResult) {
    if let Ok(mut store) = cache().lock() {
        store.put(cache_key(provider, from, to, text), result);
    }
}
