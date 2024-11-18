// vacChat.ts
import type { VacChatParams } from '@/types';

const STREAM_TIMEOUT = 1200000; // 120 seconds

// Request lock with timeout to prevent stuck states
let streamLock: { isStreaming: boolean; timestamp: number; requestId?: string } = {
    isStreaming: false,
    timestamp: 0
};

// Utility to check if lock is stale (older than timeout)
const isLockStale = () => {
    return streamLock.isStreaming && 
           (Date.now() - streamLock.timestamp > STREAM_TIMEOUT);
};

// Reset lock if it's stale
const resetStaleLock = () => {
    if (isLockStale()) {
        console.warn('Detected stale stream lock, resetting', { 
            requestId: streamLock.requestId 
        });
        streamLock = { isStreaming: false, timestamp: 0 };
    }
};

export async function vacChat({ 
    userMessage, 
    chatHistory, 
    humanChatHistory,
    onBotMessage, 
    apiEndpoint,
    instructions,
    documents 
}: VacChatParams) {
    resetStaleLock();

    if (streamLock.isStreaming) {
        console.warn('Stream already in progress', { 
            requestId: streamLock.requestId 
        });
        throw new Error('A streaming request is already in progress');
    }

    let controller: AbortController | null = null;
    let accumulatedContent = '';
    const requestId = Math.random().toString(36).substring(7);

    try {
        streamLock = { 
            isStreaming: true, 
            timestamp: Date.now(),
            requestId 
        };
        
        controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller?.abort();
            console.warn('Client timeout reached', { requestId });
        }, STREAM_TIMEOUT);

        const response = await fetch('/api/proxy', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Request-ID': requestId
            },
            body: JSON.stringify({
                endpoint: apiEndpoint,
                user_input: userMessage,
                chat_history: chatHistory,
                humanChatHistory: humanChatHistory,
                instructions: instructions,
                documents: documents,
                isStreaming: true,
                stream_only: true,
                stream_wait_time: 1
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`HTTP error! status: ${response.status}`, { 
                cause: errorData 
            });
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');

        const decoder = new TextDecoder();
        
        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    if (accumulatedContent) {
                        onBotMessage({ 
                            sender: 'bot', 
                            content: accumulatedContent,
                        });
                    }
                    break;
                }
                
                const chunk = decoder.decode(value, { stream: true });
                if (chunk) {
                    accumulatedContent += chunk;
                    onBotMessage({ 
                        sender: 'bot', 
                        content: accumulatedContent,
                    });
                }
            }
        } finally {
            try {
                await reader.cancel();
            } catch (cancelError) {
                console.warn('Error canceling reader:', cancelError, { 
                    requestId 
                });
            }
        }
    } catch (error) {
        console.error('Streaming error:', error, { requestId });
        
        if (!accumulatedContent) {
            onBotMessage({ 
                sender: 'bot', 
                content: 'Sorry, an error occurred. Please try again.',
            });
        }
        throw error;
    } finally {
        controller?.abort();
        streamLock = { isStreaming: false, timestamp: 0 };
    }
}