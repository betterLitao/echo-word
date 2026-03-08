#[cfg(target_os = "macos")]
// Cycle 01 先保留一个可运行的占位实现。
// 真正的 macOS Accessibility API 会在后续系统集成阶段接入。
pub fn check_accessibility_permission() -> bool {
    std::env::var("ECHOWORD_ASSUME_ACCESSIBILITY")
        .map(|value| value == "1")
        .unwrap_or(false)
}

#[cfg(not(target_os = "macos"))]
pub fn check_accessibility_permission() -> bool {
    false
}

#[cfg(target_os = "macos")]
pub fn open_accessibility_settings() -> Result<(), String> {
    std::process::Command::new("open")
        .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
        .spawn()
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[cfg(not(target_os = "macos"))]
pub fn open_accessibility_settings() -> Result<(), String> {
    Err("当前平台暂未提供辅助功能设置跳转".into())
}
