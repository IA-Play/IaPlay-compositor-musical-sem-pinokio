/**
 * iaplay apiClient.ts
 * Gestão Centralizada de Requisições de Elite
 */

export interface ApiResponse<T> {
    data?: T;
    error?: string;
    status: number;
}

class ApiClient {
    private async request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        const url = path.startsWith('http') ? path : path;


        const defaultOptions: RequestInit = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                ...(options.headers || {}),
            },
            // Crucial: Send cookies/session to PHP
            credentials: 'same-origin',
        };

        try {
            const response = await fetch(url, defaultOptions);
            const status = response.status;

            if (status === 401) {
                console.warn("🔐 Sessão expirada ou inválida.");
            }

            const contentType = response.headers.get("content-type");
            let data: any;

            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                data = { message: await response.text() };

                // If we get PHP code back, the server isn't parsing PHP.
                // Don't treat it as valid JSON response data.
                if (data.message.includes('<?php') || data.message.includes('<!DOCTYPE') || data.message.includes('<html')) {
                    return { error: 'PHP backend not running (Local Standalone Mode)', status: 200 };
                }
            }

            if (!response.ok) {
                return { error: data.error || data.message || `Erro ${status}`, status };
            }

            return { data: data as T, status };
        } catch (error: any) {
            return { error: "Erro de conexão local.", status: 200 };
        }
    }

    async get<T>(path: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
        const query = params ? `?${new URLSearchParams(params).toString()}` : '';
        return this.request<T>(`${path}${query}`, { method: 'GET' });
    }

    async post<T>(path: string, body: any): Promise<ApiResponse<T>> {
        return this.request<T>(path, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }
}

export const apiClient = new ApiClient();
