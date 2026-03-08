use std::io::Read;
use std::sync::OnceLock;
use std::thread;

use serde::Deserialize;
use serde_json::json;
use tauri::Emitter;
use tiny_http::{Header, Method, Request, Response, Server, StatusCode};

use crate::services::translator::{self, TranslationMode};

static SERVER_STARTED: OnceLock<()> = OnceLock::new();

#[derive(Debug, Deserialize)]
struct TranslateRequest {
    text: String,
    mode: Option<String>,
}

fn json_header() -> Header {
    Header::from_bytes(&b"Content-Type"[..], &b"application/json; charset=utf-8"[..])
        .expect("valid response header")
}

fn read_request_body(request: &mut Request) -> Result<String, String> {
    let mut body = String::new();
    request
        .as_reader()
        .read_to_string(&mut body)
        .map_err(|error| error.to_string())?;
    Ok(body)
}

fn respond_json(request: Request, value: serde_json::Value, status: StatusCode) {
    let response = Response::from_string(value.to_string())
        .with_status_code(status)
        .with_header(json_header());
    let _ = request.respond(response);
}

fn handle_translate(mut request: Request, app: &tauri::AppHandle) {
    let body = match read_request_body(&mut request) {
        Ok(body) => body,
        Err(error) => {
            respond_json(
                request,
                json!({ "ok": false, "error": format!("读取请求体失败：{}", error) }),
                StatusCode(400),
            );
            return;
        }
    };

    let payload = serde_json::from_str::<TranslateRequest>(&body)
        .or_else(|_| Ok(TranslateRequest { text: body, mode: None }));

    let payload = match payload {
        Ok(payload) => payload,
        Err(error) => {
            respond_json(
                request,
                json!({ "ok": false, "error": format!("解析请求失败：{}", error) }),
                StatusCode(400),
            );
            return;
        }
    };

    let mode = match payload.mode.as_deref() {
        Some("word") => TranslationMode::Word,
        Some("sentence") => TranslationMode::Sentence,
        _ => TranslationMode::Auto,
    };

    match translator::translate(app, &payload.text, mode) {
        Ok(result) => respond_json(request, json!({ "ok": true, "data": result }), StatusCode(200)),
        Err(error) => respond_json(request, json!({ "ok": false, "error": error }), StatusCode(500)),
    }
}

fn handle_selection_trigger(request: Request, app: &tauri::AppHandle) {
    let _ = app.emit("selection-translate-requested", json!({ "source": "http-api" }));
    respond_json(request, json!({ "ok": true }), StatusCode(200));
}

fn handle_input_trigger(request: Request, app: &tauri::AppHandle) {
    let _ = app.emit("input-translate-requested", json!({ "source": "http-api" }));
    respond_json(request, json!({ "ok": true }), StatusCode(200));
}

// 本地 HTTP API 只监听 127.0.0.1，
// 这样 Alfred / Raycast / 脚本可以调用，但不会暴露到局域网。
pub fn start_http_server(port: u16, app: tauri::AppHandle) {
    if SERVER_STARTED.get().is_some() {
        return;
    }

    let address = format!("127.0.0.1:{}", port);
    let server = match Server::http(&address) {
        Ok(server) => server,
        Err(error) => {
            log::warn!("failed to start http server on {}: {}", address, error);
            return;
        }
    };

    let _ = SERVER_STARTED.set(());
    thread::spawn(move || {
        for request in server.incoming_requests() {
            match (request.method(), request.url()) {
                (&Method::Post, "/translate") => handle_translate(request, &app),
                (&Method::Get, "/selection_translate") => handle_selection_trigger(request, &app),
                (&Method::Get, "/input_translate") => handle_input_trigger(request, &app),
                _ => respond_json(
                    request,
                    json!({ "ok": false, "error": "Not Found" }),
                    StatusCode(404),
                ),
            }
        }
    });
}
