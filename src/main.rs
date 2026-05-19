use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::io::{self, Write};
use clap::Parser;

#[derive(Parser, Debug)]
#[command(author, version, about = "CLI CHAT AI, Koboldcpp API")]
struct Args {
    /// IP Address PC Host Koboldcpp (contoh: 192.168.43.229)
    #[arg(long, default_value = "127.0.0.1")]
    host: String,

    /// Port yang digunakan Koboldcpp
    #[arg(short, long, default_value = "5001")]
    port: u16,
}

#[derive(Serialize, Deserialize, Clone)]
struct Message {
    role: String,
    content: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();
    
    // URL dinamis dari argumen CLI
    let api_url = format!("http://{}:{}/v1/chat/completions", args.host, args.port);
    let client = Client::new();

    let mut history = vec![Message {
        role: "system".to_string(),
        content: "You are a helpful and concise CLI developer assistant.".to_string(),
    }];

    println!("========================================");
    println!("Local AI CLI (Rust)");
    println!("Target Server: {}", api_url);
    println!("Ketik 'exit' untuk keluar");
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

        print!("\x1b[33mAI sedang berpikir...\x1b[0m\r");
        io::stdout().flush()?;

        let payload = serde_json::json!({
            "messages": history,
            "temperature": 0.7,
            "max_tokens": 1024,
            "stream": false
        });

        let res = client.post(&api_url)
            .json(&payload)
            .send()
            .await;

        print!("\x1b[2K\r"); 

        match res {
            Ok(response) => {
                if let Ok(data) = response.json::<Value>().await {
                    if let Some(ai_msg) = data["choices"][0]["message"]["content"].as_str() {
                        println!("\x1b[32mAI:\x1b[0m {}\n", ai_msg);
                        
                        history.push(Message {
                            role: "assistant".to_string(),
                            content: ai_msg.to_string(),
                        });
                    } else {
                        println!("\x1b[31mError:\x1b[0m Format respons tidak sesuai.\n");
                    }
                }
            }
            Err(e) => {
                eprintln!("\x1b[31mGagal terhubung ke API:\x1b[0m {}\n", e);
            }
        }
    }

    Ok(())
}