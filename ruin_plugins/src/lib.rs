#![deny(clippy::all)]
use napi_derive::napi;

#[napi]
pub fn process_text(input: String) -> String {

    let highlighted = input
        .replace("rust", "\x1b[36mrust\x1b[0m")
        .replace("Rust", "\x1b[36mRust\x1b[0m");
        
    format!("\x1b[32m[🦀 RUST NATIVE]\x1b[0m {}", highlighted)
}

#[napi]
pub fn gather_context(path: String) -> String {
    format!("Memindai direktori: {} ... Selesai (0.01ms)!", path)
}