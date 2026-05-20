use napi_derive::napi;
use std::fs;

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