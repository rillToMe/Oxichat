use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::ffi::{CStr, CString};
use std::io::{self, Write};
use std::os::raw::c_char;
use clap::Parser;
use libloading::{Library, Symbol};

#[derive(Parser, Debug)]
struct Args {
    #[arg(long, default_value = "127.0.0.1")]
    host: String,

    #[arg(short, long, default_value = "5001")]
    port: u16,

    /// PATH DINAMIS KE FILE DLL C#
    #[arg(long, default_value = "./ruin_ext.dll")]
    dll_path: String,
}

#[derive(Serialize, Deserialize, Clone)]
struct Message {
    role: String,
    content: String,
}

type AnsiHighlighterFn = unsafe extern "C" fn(*const c_char) -> *mut c_char;
type FreeCSharpStringFn = unsafe extern "C" fn(*mut c_char);

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();
    let api_url = format!("http://{}:{}/v1/chat/completions", args.host, args.port);
    let client = Client::new();

    // PROSES LOAD DLL SECARA DINAMIS 
    println!("Loading extension dari: {}", args.dll_path);
    
    // Load library secara runtime. Jika file tidak ada, aplikasi tidak akan crash di awal, 
    let lib = unsafe { Library::new(&args.dll_path) };
    
    // bungkus ke dalam Option,kalau DLL gagal di-load, CLI tetap bisa jalan
    let dynamic_funcs = unsafe {
        match lib {
            Ok(ref library) => {
                let highlighter: Result<Symbol<AnsiHighlighterFn>, _> = library.get(b"ansi_syntax_highlighter");
                let crystal_free: Result<Symbol<FreeCSharpStringFn>, _> = library.get(b"free_csharp_string");
                
                if let (Ok(h), Ok(f)) = (highlighter, crystal_free) {
                    Some((h, f))
                } else {
                    println!(" DLL tidak ditemukan, fallback ke text biasa.");
                    None
                }
            }
            Err(ref e) => {
                println!("Gagal meload DLL ({}). Menjalankan tanpa extension.", e);
                None
            }
        }
    };

    let mut history = vec![Message {
        role: "system".to_string(),
        content: "You are a helpful and concise CLI developer assistant.".to_string(),
    }];

    println!("========================================");
    println!("Oxichat - Dynamic Local Distributed AI CLI");
    println!("========================================\n");

    loop {
        print!("\x1b[36mKamu:\x1b[0m ");
        io::stdout().flush()?;

        let mut user_input = String::new();
        io::stdin().read_line(&mut user_input)?;
        let input_trim = user_input.trim();

        if input_trim.eq_ignore_ascii_case("exit") || input_trim.eq_ignore_ascii_case("quit") {
            println!("Bye!");
            break;
        }

        if input_trim.is_empty() {
            continue;
        }

        history.push(Message {
            role: "user".to_string(),
            content: input_trim.to_string(),
        });

        print!("\x1b[33mAI sedang mengetik...\x1b[0m\r");
        io::stdout().flush()?;

        let payload = json!({
            "messages": history,
            "temperature": 0.7,
            "max_tokens": 1024,
            "stream": false
        });

        let res = client.post(&api_url).json(&payload).send().await;
        print!("\x1b[2K\r"); 

        match res {
            Ok(response) => {
                if let Ok(data) = response.json::<Value>().await {
                    if let Some(ai_msg) = data["choices"][0]["message"]["content"].as_str() {
                        
                        let mut printed = false;

                        // Jika DLL berhasil di-load, gunakan fungsinya secara dinamis
                        if let Some((highlighter_fn, free_fn)) = &dynamic_funcs {
                            let c_ai_msg = CString::new(ai_msg).unwrap();
                            unsafe {
                                let processed_ptr = highlighter_fn(c_ai_msg.as_ptr());
                                if !processed_ptr.is_null() {
                                    let highlighted_msg = CStr::from_ptr(processed_ptr).to_string_lossy().into_owned();
                                    println!("\x1b[32mAI:\x1b[0m {}\n", highlighted_msg);
                                    free_fn(processed_ptr); // Bersihkan memori C#
                                    printed = true;
                                }
                            }
                        }

                        // Fallback jika DLL gagal
                        if !printed {
                            println!("\x1b[32mAI:\x1b[0m {}\n", ai_msg);
                        }

                        history.push(Message {
                            role: "assistant".to_string(),
                            content: ai_msg.to_string(),
                        });
                    }
                }
            }
            Err(e) => println!("Gagal menghubungi server: {}\n", e),
        }
    }

    drop(lib);
    Ok(())
}
