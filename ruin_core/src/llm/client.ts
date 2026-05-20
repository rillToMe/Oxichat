import type { AppConfig } from '../config/index.js';

export async function askLLM(prompt: string, config: AppConfig): Promise<string> {
    const apiUrl = `http://${config.llm_host}:${config.llm_port}/v1/chat/completions`;

    const payload = {
        messages: [
            { role: "system", content: config.system_prompt },
            { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 512
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP Error! status: ${response.status}`);
        }

        const data: any = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error: any) {
        return `[ERROR LLM]: Gagal terhubung ke API. Pastikan Koboldcpp menyala. Detail: ${error.message}`;
    }
}