import { type AppConfig } from '../config/index.js';

export async function* askLLMStream(prompt: string, config: AppConfig, dynamicContext: string): AsyncGenerator<string, void, unknown> {
    const apiUrl = `http://${config.llm_host}:${config.llm_port}/v1/chat/completions`;

    // Gabungkan prompt sistem bawaan dengan konteks hasil Rust
    const injectedSystemPrompt = `${config.system_prompt}\n\n[SYSTEM CONTEXT]\n${dynamicContext}`;

    const payload = {
        messages: [
            { role: "system", content: injectedSystemPrompt },
            { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1024,
        stream: true
    };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok || !response.body) {
        throw new Error(`HTTP Error! status: ${response?.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.startsWith('data: ')) {
                const dataStr = line.replace('data: ', '').trim();
                if (dataStr === '[DONE]') return; 
                try {
                    const parsed = JSON.parse(dataStr);
                    const token = parsed.choices[0]?.delta?.content || '';
                    if (token) yield token;
                } catch (e) {
                    // Abaikan eror parse
                }
            }
        }
    }
}