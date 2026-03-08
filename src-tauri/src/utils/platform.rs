use std::process::Command;

fn command_output(mut command: Command) -> Result<String, String> {
    let output = command.output().map_err(|error| error.to_string())?;
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }

    String::from_utf8(output.stdout)
        .map(|value| value.trim().to_string())
        .map_err(|error| error.to_string())
}

#[cfg(target_os = "macos")]
// 这里先走命令行兼容方案：
// `pbpaste` 足够稳定，能覆盖快捷键触发、剪贴板监听和 HTTP 入口三条链路。
pub fn read_clipboard_text() -> Result<String, String> {
    command_output(Command::new("pbpaste"))
}

#[cfg(target_os = "windows")]
pub fn read_clipboard_text() -> Result<String, String> {
    let mut command = Command::new("powershell");
    command.args(["-NoProfile", "-Command", "Get-Clipboard"]);
    command_output(command)
}

#[cfg(target_os = "linux")]
pub fn read_clipboard_text() -> Result<String, String> {
    let mut wayland = Command::new("wl-paste");
    wayland.args(["-n"]);
    if let Ok(result) = command_output(wayland) {
        return Ok(result);
    }

    let mut xclip = Command::new("xclip");
    xclip.args(["-o", "-selection", "clipboard"]);
    if let Ok(result) = command_output(xclip) {
        return Ok(result);
    }

    let mut xsel = Command::new("xsel");
    xsel.args(["--clipboard", "--output"]);
    command_output(xsel)
}

#[cfg(target_os = "macos")]
// 当前先用 `osascript` 做真实权限探测，
// 这样引导页给出的“已授权 / 待授权”状态就不再只依赖环境变量。
pub fn check_accessibility_permission() -> bool {
    let mut command = Command::new("osascript");
    command.args([
        "-e",
        "tell application \"System Events\" to return UI elements enabled",
    ]);

    match command_output(command) {
        Ok(result) => result.eq_ignore_ascii_case("true"),
        Err(_) => std::env::var("ECHOWORD_ASSUME_ACCESSIBILITY")
            .map(|value| value == "1")
            .unwrap_or(false),
    }
}

#[cfg(not(target_os = "macos"))]
pub fn check_accessibility_permission() -> bool {
    false
}

#[cfg(target_os = "macos")]
pub fn open_accessibility_settings() -> Result<(), String> {
    Command::new("open")
        .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
        .spawn()
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[cfg(not(target_os = "macos"))]
pub fn open_accessibility_settings() -> Result<(), String> {
    Err("当前平台暂未提供辅助功能设置跳转".into())
}
