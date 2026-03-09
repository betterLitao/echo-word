use std::time::Duration;

use crate::commands::settings::AppSettings;

pub fn build_blocking_client(
    settings: &AppSettings,
    timeout: Duration,
) -> Result<reqwest::blocking::Client, String> {
    let mut builder = reqwest::blocking::Client::builder().timeout(timeout);

    if let Some(proxy) = settings.active_proxy() {
        builder = builder.proxy(reqwest::Proxy::all(proxy).map_err(|error| error.to_string())?);
    }

    builder.build().map_err(|error| error.to_string())
}
