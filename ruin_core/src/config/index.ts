import fs from 'fs/promises';
import path from 'path';

export interface AppConfig {
    llm_host: string;
    llm_port: number;
    system_prompt: string;
}

const CONFIG_PATH = path.resolve(process.cwd(), 'config.json');

const DEFAULT_CONFIG: AppConfig = {
    llm_host: "127.0.0.1",
    llm_port: 5001,
    system_prompt: "You are Oxichat, a helpful AI assistant."
};

export async function loadConfig(): Promise<AppConfig> {
    try {
        const fileData = await fs.readFile(CONFIG_PATH, 'utf-8');
        return JSON.parse(fileData) as AppConfig;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 4), 'utf-8');
            return DEFAULT_CONFIG;
        }
        throw new Error(`Gagal membaca config: ${error.message}`);
    }
}