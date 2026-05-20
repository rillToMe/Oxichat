use napi_derive::napi;
use rusqlite::{params, Connection, Result as SqlResult};
use std::fs;
use std::path::PathBuf;

#[napi]
pub fn gather_context(path: String) -> String {
    // membaca isi direktori
    match fs::read_dir(&path) {
        Ok(entries) => {
            let mut file_list = Vec::new();
            
            for entry in entries.flatten() {
                let file_name = entry.file_name().into_string().unwrap_or_default();
                
                // abaikan folder node_modules dan file hidden
                if !file_name.starts_with('.') && file_name != "node_modules" {
                    file_list.push(file_name);
                }
            }
            
            if file_list.is_empty() {
                return format!("Direktori '{}' kosong atau hanya berisi file hidden.", path);
            }
            
            format!("Struktur direktori saat ini ({}):\n- {}", path, file_list.join("\n- "))
        }
        Err(err) => format!("[ERROR] Gagal memindai direktori {}: {}", path, err),
    }
}

#[napi]
pub fn read_file(file_path: String) -> String {
    // Membaca isi file menjadi string secara instan
    match std::fs::read_to_string(&file_path) {
        Ok(content) => content,
        Err(_) => format!("[File tidak ditemukan atau tidak dapat dibaca: {}]", file_path),
    }
}

// Fhelper untuk mendapatkan koneksi ke DB Global
fn get_db_connection() -> SqlResult<Connection> {
    // Simpan di global AppData Windows
    let mut db_path = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    db_path.push("oxichat");
    
    if !db_path.exists() {
        fs::create_dir_all(&db_path).expect("Gagal membuat folder global Oxichat");
    }
    
    db_path.push("history.db");
    Connection::open(db_path)
}

#[napi]
pub fn init_db() -> String {
    match get_db_connection() {
        Ok(conn) => {
            let query = "
                CREATE TABLE IF NOT EXISTS chat_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    workspace TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ";
            match conn.execute(query, []) {
                Ok(_) => "Database SQLite berhasil diinisialisasi.".to_string(),
                Err(e) => format!("[ERROR DB] Gagal membuat tabel: {}", e),
            }
        }
        Err(e) => format!("[ERROR DB] Gagal membuka koneksi: {}", e),
    }
}

#[napi]
pub fn save_message(workspace: String, role: String, content: String) -> bool {
    if let Ok(conn) = get_db_connection() {
        let query = "INSERT INTO chat_history (workspace, role, content) VALUES (?1, ?2, ?3)";
        return conn.execute(query, params![workspace, role, content]).is_ok();
    }
    false
}

#[napi]
pub fn load_history(workspace: String, limit: u32) -> String {
    if let Ok(conn) = get_db_connection() {
        let query = "
            SELECT role, content FROM chat_history 
            WHERE workspace = ?1 
            ORDER BY id DESC LIMIT ?2
        ";
        
        let mut stmt = match conn.prepare(query) {
            Ok(s) => s,
            Err(_) => return "[]".to_string(),
        };

        // Tangkap langsung pakai match
        let history_iter = match stmt.query_map(params![workspace, limit], |row| {
            let role: String = row.get(0)?;
            let content: String = row.get(1)?;
            Ok(format!(r#"{{"role": "{}", "content": "{}"}}"#, role, content.replace('"', "\\\"").replace('\n', "\\n")))
        }) {
            Ok(iter) => iter,
            Err(_) => return "[]".to_string(),
        };

        let mut results = Vec::new();
        for item in history_iter {
            if let Ok(json_str) = item {
                results.push(json_str);
            }
        }
        
        // Karena kita ambil DESC, kita harus membalik urutannya
        results.reverse();
        
        return format!("[{}]", results.join(","));
    }
    "[]".to_string()
}