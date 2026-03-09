use hmac::{Hmac, Mac};
use md5::{Digest as Md5Digest, Md5};
use sha2::{Digest as Sha256Digest, Sha256};

pub fn to_lower_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{:02x}", byte)).collect()
}

pub fn sha256_hex(input: impl AsRef<[u8]>) -> String {
    let mut hasher = Sha256::new();
    hasher.update(input.as_ref());
    to_lower_hex(&hasher.finalize())
}

pub fn md5_hex(input: impl AsRef<[u8]>) -> String {
    let mut hasher = Md5::new();
    hasher.update(input.as_ref());
    to_lower_hex(&hasher.finalize())
}

pub fn hmac_sha256(key: &[u8], message: impl AsRef<[u8]>) -> Result<Vec<u8>, String> {
    let mut mac = Hmac::<Sha256>::new_from_slice(key).map_err(|error| error.to_string())?;
    mac.update(message.as_ref());
    Ok(mac.finalize().into_bytes().to_vec())
}
