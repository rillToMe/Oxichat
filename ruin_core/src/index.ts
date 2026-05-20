import { loadConfig } from './config/index.js';
import { askLLM } from './llm/client.js';
import { askUserInput } from './ui/repl.js';

import { processText, gatherContext } from '../../ruin_plugins/index.js';

async function main() {
    console.clear();
    console.log("Oxichat CLI loading Konfigurasi...\n");
    
    // Load Konfigurasi
    const config = await loadConfig();
    console.log(`\x1b[32m[Config Loaded]\x1b[0m Target LLM: http://${config.llm_host}:${config.llm_port}`);

    const contextMsg = gatherContext("./");
    console.log(`\x1b[33m[Context]\x1b[0m ${contextMsg}\n`);

    while (true) {
        try {
            const input = await askUserInput();

            if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
                console.log("Sampai jumpa!");
                break;
            }

            // Tampilkan indikator memproses
            console.log("\x1b[90mAI sedang berpikir...\x1b[0m");

            // Tembak ke LLM
            const llmResponse = await askLLM(input, config);
            
            // Proses teks balasan AI menggunakan otot Rust
            const processedResponse = processText(llmResponse);
            
            console.log(`\n\x1b[35m[Oxichat]\x1b[0m: ${processedResponse}\n`);
            
        } catch (error) {
            console.log("\nSesi diakhiri oleh sistem (Ctrl+C).");
            break;
        }
    }
}

main().catch(console.error);