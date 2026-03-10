/**
 * Backend Client
 * 
 * Handles all communication with the n8n backend.
 * All API calls go through this service.
 * 
 * @module services/backendClient
 */

// ============================================
// CONFIGURATION
// ============================================

const BACKEND_CONFIG = {
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5678',
    webhookPath: '/webhook/api/text',
    timeout: 10000, // 10 seconds
    retries: 1
}

// ============================================
// TYPES
// ============================================

export interface TextRequest {
    userId: string
    text: string
    mode: 'tutor' | 'quiz' | 'explain'
}

export interface TextResponse {
    reply: string
    ui_action: 'display' | 'speak' | 'both'
}

export interface BackendError {
    code: 'timeout' | 'network' | 'server' | 'empty-response' | 'invalid-response'
    message: string
    retryable: boolean
}

export type BackendResult =
    | { success: true; data: TextResponse }
    | { success: false; error: BackendError }

// ============================================
// BACKEND CLIENT
// ============================================

class BackendClient {
    private baseUrl: string
    private timeout: number

    constructor() {
        this.baseUrl = BACKEND_CONFIG.baseUrl
        this.timeout = BACKEND_CONFIG.timeout
    }

    /**
     * Send text to backend for processing
     */
    async sendText(payload: TextRequest): Promise<BackendResult> {
        const url = `${this.baseUrl}${BACKEND_CONFIG.webhookPath}`

        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), this.timeout)

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            // Check HTTP status
            if (!response.ok) {
                return {
                    success: false,
                    error: {
                        code: 'server',
                        message: `Server error: ${response.status}`,
                        retryable: response.status >= 500
                    }
                }
            }

            // Parse response
            const data = await response.json()

            // Validate response structure
            if (!data.reply) {
                return {
                    success: false,
                    error: {
                        code: 'empty-response',
                        message: 'Server returned empty response',
                        retryable: true
                    }
                }
            }

            // Ensure ui_action has valid value
            const ui_action = ['display', 'speak', 'both'].includes(data.ui_action)
                ? data.ui_action
                : 'display'

            return {
                success: true,
                data: {
                    reply: data.reply,
                    ui_action
                }
            }

        } catch (error) {
            // Handle specific error types
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    return {
                        success: false,
                        error: {
                            code: 'timeout',
                            message: 'Request timed out. Please try again.',
                            retryable: true
                        }
                    }
                }

                if (error.message.includes('fetch') || error.message.includes('network')) {
                    return {
                        success: false,
                        error: {
                            code: 'network',
                            message: 'Server offline. Please check connection.',
                            retryable: true
                        }
                    }
                }
            }

            return {
                success: false,
                error: {
                    code: 'network',
                    message: 'Failed to connect to server',
                    retryable: true
                }
            }
        }
    }

    /**
     * Send text with automatic retry on failure
     */
    async sendTextWithRetry(payload: TextRequest, maxRetries = BACKEND_CONFIG.retries): Promise<BackendResult> {
        let lastResult: BackendResult

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            lastResult = await this.sendText(payload)

            if (lastResult.success) {
                return lastResult
            }

            // Don't retry if not retryable
            if (!lastResult.error.retryable) {
                return lastResult
            }

            // Wait before retry (exponential backoff)
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
            }
        }

        return lastResult!
    }

    /**
     * Check if backend is reachable
     */
    async healthCheck(): Promise<boolean> {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 3000)

            const response = await fetch(`${this.baseUrl}/webhook/health`, {
                method: 'GET',
                signal: controller.signal
            })

            clearTimeout(timeoutId)
            return response.ok
        } catch {
            return false
        }
    }

    /**
     * Update base URL (for testing or environment switching)
     */
    setBaseUrl(url: string): void {
        this.baseUrl = url
    }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const backendClient = new BackendClient()

// Convenience function for direct use
export async function sendTextToBackend(payload: TextRequest): Promise<BackendResult> {
    return backendClient.sendTextWithRetry(payload)
}

export default backendClient
