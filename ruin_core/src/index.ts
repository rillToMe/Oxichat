import enquirer from 'enquirer';
const { prompt } = enquirer;
import { processText, gatherContext } from '../../ruin_plugins/index.js';

async function main() {
    console.clear();
    console.log("🚀 Oxichat CLI Started!\n");
    
    // 1. Panggil Rust untuk baca context (Simulasi)
    const contextMsg = gatherContext("./ruin_core");
    console.log(`\x1b[33m[Context Gatherer]\x1b[0m ${contextMsg}\n`);

    // 2. Interactive REPL Loop
    while (true) {
        try {
            const response: { userInput: string } = await prompt({
                type: 'input',
                name: 'userInput',
                message: 'Ketik sesuatu (mengandung kata "rust") atau "exit":'
            });

            if (response.userInput.toLowerCase() === 'exit') {
                console.log("Sampai jumpa!");
                break;
            }

            // 3. Lempar input TS ke modul Rust Native!
            const result = processText(response.userInput);
            
            // 4. Render hasilnya di terminal
            console.log(`\n${result}\n`);
            
        } catch (error) {
            // Tangkap Ctrl+C
            console.log("\nSesi diakhiri.");
            break;
        }
    }
}

main().catch(console.error);