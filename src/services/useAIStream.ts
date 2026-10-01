import { useState, useCallback } from 'react';

interface StreamOptions {
    onChunk?: (chunk: string) => void;
    onComplete?: (fullText: string) => void;
    onError?: (error: string) => void;
}

export const useAIStream = () => {
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamedText, setStreamedText] = useState("");

    const stream = useCallback(async (path: string, body: any, options: StreamOptions = {}) => {
        setIsStreaming(true);
        setStreamedText("");
        let fullText = "";

        try {
            const response = await fetch(path, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...body, stream: true })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erro na geração da IA (${response.status})`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("Stream não suportado pelo navegador.");

            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunkStr = decoder.decode(value, { stream: true });
                buffer += chunkStr;

                const lines = buffer.split('\n');
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.trim() === '') continue;
                    try {
                        const processedLine = line.startsWith('data: ') ? line.slice(6) : line;
                        if (processedLine === '[DONE]') continue;

                        const json = JSON.parse(processedLine);

                        if (json.error) {
                            throw new Error(json.error.message || JSON.stringify(json.error));
                        } else if (json.candidates?.[0]?.content?.parts?.[0]?.text) {
                            const part = json.candidates[0].content.parts[0].text;
                            fullText += part;
                            setStreamedText(fullText);
                            options.onChunk?.(part);
                        } else if (json.choices?.[0]?.delta?.content) {
                            const part = json.choices[0].delta.content;
                            fullText += part;
                            setStreamedText(fullText);
                            options.onChunk?.(part);
                        } else if (json.response) {
                            // Ollama native stream format
                            const part = json.response;
                            fullText += part;
                            setStreamedText(fullText);
                            options.onChunk?.(part);
                        }
                    } catch (e: any) {
                        // Linha incompleta ignorada
                    }
                }
            }

            options.onComplete?.(fullText);
            return fullText;

        } catch (error: any) {
            console.warn("AI Stream fallback trigger:", error.message);
            options.onError?.(error.message);
            throw error;
        } finally {
            setIsStreaming(false);
        }
    }, []);

    return { stream, isStreaming, streamedText };
};

