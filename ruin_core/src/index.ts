import { loadConfig } from './config/index.js';
import { askLLMStream, type ChatMessage } from './llm/client.js';
import { askUserInput } from './ui/repl.js';
import { gatherContext, readFile } from '../../ruin_plugins/index.js';

async function main() {
    console.clear();
    console.log("Oxichat CLI Memuat Konfigurasi...\n");
    
    const config = await loadConfig();
    console.log(`\x1b[32m[Config Loaded]\x1b[0m Target LLM: http://${config.llm_host}:${config.llm_port}`);

    const dirContext = gatherContext("./");
    const configContent = readFile("./config.json");
    const fullContext = `${dirContext}\n\nIsi dari config.json saat ini:\n${configContent}`;
    
    console.log(`\x1b[33m[Context Diinjeksi ke AI]\x1b[0m Direktori local & config.json\n`);

    // INISIALISASI MEMORI 
    let chatHistory: ChatMessage[] = [];
    const MAX_HISTORY = 10; // Batasi hanya mengingat 10 chat terakhir

    while (true) {
        try {
            const input = await askUserInput();

            if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
                console.log("Sampai jumpa!");
                break;
            }

            // Masukkan prompt user ke history
            chatHistory.push({ role: 'user', content: input });

            // Buang ingatan terlama jika melebihi batas
            if (chatHistory.length > MAX_HISTORY) {
                // Ambil 10 data paling belakang
                chatHistory = chatHistory.slice(chatHistory.length - MAX_HISTORY);
            }

            process.stdout.write("\n\x1b[35m[Oxichat]\x1b[0m: ");

            // Lempar history ke API
            const stream = askLLMStream(chatHistory, config, fullContext);
            let fullResponse = "";

            for await (const chunk of stream) {
                process.stdout.write(chunk);
                fullResponse += chunk;
            }

            // Masukkan jawaban utuh AI ke history
            chatHistory.push({ role: 'assistant', content: fullResponse });

            console.log("\n"); 
            
        } catch (error) {
            console.log("\nSesi diakhiri oleh sistem (Ctrl+C).");
            break;
        }
    }
}

main().catch(console.error);