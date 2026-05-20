import { loadConfig } from './config/index.js';
import { askLLMStream, type ChatMessage } from './llm/client.js';
import { askUserInput } from './ui/repl.js';

import { 
    gatherContext, 
    readFile, 
    initDb, 
    saveMessage, 
    loadHistory 
} from '../../ruin_plugins/index.js';

async function main() {
    console.clear();
    console.log("Oxichat CLI Load Konfigurasi...\n");
    
    const config = await loadConfig();
    console.log(`\x1b[32m[Config Loaded]\x1b[0m Target LLM: http://${config.llm_host}:${config.llm_port}`);

    // Inisialisasi Database SQLite Rust
    const dbStatus = initDb();
    console.log(`\x1b[34m[Database]\x1b[0m ${dbStatus}`);

    const dirContext = gatherContext("./");
    const configContent = readFile("./config.json");
    const fullContext = `${dirContext}\n\nIsi dari config.json saat ini:\n${configContent}`;
    
    console.log(`\x1b[33m[Context diinjeksi]\x1b[0m Direktori local & config.json\n`);

    const currentWorkspace = process.cwd();

    // Muat 10 histori percakapan terakhir dari SQLite
    const rawHistory = loadHistory(currentWorkspace, 10);
    let chatHistory: ChatMessage[] = [];
    try {
        chatHistory = JSON.parse(rawHistory);
        if (chatHistory.length > 0) {
            console.log(`\x1b[90mMemuat ${chatHistory.length} percakapan sebelumnya dari memori lokal...\x1b[0m\n`);
        }
    } catch (e) {
        console.log(`\x1b[31m[ERROR]\x1b[0m Gagal mem-parse riwayat chat dari SQLite.`);
    }

    while (true) {
        try {
            const input = await askUserInput();

            if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
                console.log("Sampai jumpa!");
                break;
            }

            // Simpan input user ke SQLite
            saveMessage(currentWorkspace, "user", input);
            
            // Masukkan ke array sementara untuk dikirim ke LLM saat ini juga
            chatHistory.push({ role: 'user', content: input });
            
            // Sliding Window di RAM
            if (chatHistory.length > 10) {
                chatHistory = chatHistory.slice(chatHistory.length - 10);
            }

            process.stdout.write("\n\x1b[35m[Oxichat]\x1b[0m: ");

            const stream = askLLMStream(chatHistory, config, fullContext);
            let fullResponse = "";

            for await (const chunk of stream) {
                process.stdout.write(chunk);
                fullResponse += chunk;
            }

            // Simpan jawaban utuh AI ke SQLite
            saveMessage(currentWorkspace, "assistant", fullResponse);
            
            // Masukkan ke array sementara
            chatHistory.push({ role: 'assistant', content: fullResponse });

            console.log("\n"); 
            
        } catch (error: any) {
            if (error === '') {
                console.log("\nSesi diakhiri oleh sistem (Ctrl+C).");
            } else {
                console.log(`\n\x1b[31m[SYSTEM ERROR]\x1b[0m: ${error.message || error}`);
            }
            break;
        }
    }
}

main().catch(console.error);