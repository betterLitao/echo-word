use serde_json::Value;
use tauri::Manager;

fn derive_key(app: &tauri::AppHandle) -> Vec<u8> {
    let identifier = app.config().identifier.as_bytes();
    let path_salt = app
        .path()
        .app_data_dir()
        .ok()
        .map(|path: std::path::PathBuf| path.to_string_lossy().as_bytes().to_vec())
        .unwrap_or_default();

    let mut seed = Vec::new();
    seed.extend_from_slice(identifier);
    seed.extend_from_slice(&path_salt);
    if seed.is_empty() {
        seed.extend_from_slice(b"echo-word-fallback-key");
    }
    seed
}

fn to_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn from_hex(input: &str) -> Option<Vec<u8>> {
    if input.len() % 2 != 0 {
        return None;
    }

    let mut bytes = Vec::with_capacity(input.len() / 2);
    let chars = input.as_bytes().chunks(2);
    for chunk in chars {
        let part = std::str::from_utf8(chunk).ok()?;
        let value = u8::from_str_radix(part, 16).ok()?;
        bytes.push(value);
    }
    Some(bytes)
}

// 这里先实现“轻量本地加密”：
// 1. 避免 API Key 以明文直接落库；
// 2. 兼容现有开发环境，不额外引入系统钥匙串依赖；
// 3. 后续若切到系统 Keychain，只需要替换这一层实现。
pub fn encrypt_secret(app: &tauri::AppHandle, raw: &str) -> String {
    if raw.trim().is_empty() {
        return String::new();
    }

    let key = derive_key(app);
    let encrypted = raw
        .as_bytes()
        .iter()
        .enumerate()
        .map(|(index, byte)| byte ^ key[index % key.len()])
        .collect::<Vec<u8>>();

    format!("enc:{}", to_hex(&encrypted))
}

pub fn decrypt_secret(app: &tauri::AppHandle, raw: &str) -> String {
    let Some(encoded) = raw.strip_prefix("enc:") else {
        return raw.to_string();
    };

    let Some(bytes) = from_hex(encoded) else {
        return raw.to_string();
    };

    let key = derive_key(app);
    let decrypted = bytes
        .iter()
        .enumerate()
        .map(|(index, byte)| byte ^ key[index % key.len()])
        .collect::<Vec<u8>>();

    String::from_utf8(decrypted).unwrap_or_else(|_| raw.to_string())
}

pub fn encrypt_api_key_map(app: &tauri::AppHandle, value: Value) -> Value {
    let Some(object) = value.as_object() else {
        return value;
    };

    let encrypted = object
        .iter()
        .map(|(key, item)| {
            let next = item
                .as_str()
                .map(|secret| Value::String(encrypt_secret(app, secret)))
                .unwrap_or_else(|| item.clone());
            (key.clone(), next)
        })
        .collect();

    Value::Object(encrypted)
}

pub fn decrypt_api_keys(app: &tauri::AppHandle, mut value: serde_json::Map<String, Value>) -> serde_json::Map<String, Value> {
    for item in value.values_mut() {
        if let Some(secret) = item.as_str() {
            *item = Value::String(decrypt_secret(app, secret));
        }
    }

    value
}
