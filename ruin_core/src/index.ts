import { loadConfig } from './config/index.js';
import { askLLMStream } from './llm/client.js';
import { askUserInput } from './ui/repl.js';

import { gatherContext, readFile } from '../../ruin_plugins/index.js';

async function main() {
    console.clear();
    console.log("Oxichat CLI Load Konfigurasi...\n");
    
    const config = await loadConfig();
    console.log(`\x1b[32m[Config Loaded]\x1b[0m Target LLM: http://${config.llm_host}:${config.llm_port}`);

    // Rust membaca isi folder (Directory Tree)
    const dirContext = gatherContext("./");
    
    // Rust membaca isi file
    const configContent = readFile("./config.json");
    
    //Gabungkan semua jadi satu string konteks utuh untuk LLM
    const fullContext = `${dirContext}\n\nIsi dari config.json saat ini:\n${configContent}`;
    
    console.log(`\x1b[33m[Context diinject ke AI]\x1b[0m Direktori local & config.json\n`);

    while (true) {
        try {
            const input = await askUserInput();

            if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
                console.log("Bye!");
                break;
            }

            process.stdout.write("\n\x1b[35m[Oxichat]\x1b[0m: ");

            //Lempar fullContext ke LLM
            const stream = askLLMStream(input, config, fullContext);
            let fullResponse = "";

            for await (const chunk of stream) {
                process.stdout.write(chunk);
                fullResponse += chunk;
            }

            console.log("\n"); 
            
        } catch (error) {
            console.log("\nSesi diakhiri oleh sistem (Ctrl+C).");
            break;
        }
    }
}

main().catch(console.error);