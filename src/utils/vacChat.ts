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

export async function vacChat(params: VacChatParams) {
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

        // Extract all params except onBotMessage to avoid context issues
        const { 
            onBotMessage, 
            userMessage,
            chatHistory,
            humanChatHistory,
            apiEndpoint,
            ...configParams // Everything else goes here
        } = params;

        const requestBody = {
            endpoint: apiEndpoint,
            user_input: userMessage,
            chat_history: chatHistory,
            humanChatHistory: humanChatHistory,
            isStreaming: true,
            stream_only: true,
            stream_wait_time: 1,
            ...configParams // Other config params that don't conflict
        };

        const response = await fetch('/api/proxy', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Request-ID': requestId
            },
            body: JSON.stringify(requestBody),
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
        let done = false;
        let lastSentContent = '';
        try {
            while (!done) {
                const result = await reader.read();
                done = result.done;
                
                if (done) {
                    if (accumulatedContent && accumulatedContent !== lastSentContent) {
                        const newContent = accumulatedContent.slice(lastSentContent.length);
                        if (newContent.length > 0) {  // Only send if there's actually new content
                            lastSentContent = accumulatedContent;
                            params.onBotMessage({ 
                                sender: 'bot', 
                                content: newContent,
                            });
                        }
                    }
                    break;
                }
                
                const chunk = decoder.decode(result.value, { stream: true });
        
                if (chunk) {
                    accumulatedContent += chunk;
                    const newContent = accumulatedContent.slice(lastSentContent.length);
                    lastSentContent = accumulatedContent;
                    
                    console.log('Chunk received:', {
                        chunkLength: chunk.length,
                        newContentLength: newContent.length,
                        totalLength: accumulatedContent.length,
                        isDone: result.done
                    });
                    
                    if (newContent.length > 0) {  // Only send if there's new content
                        params.onBotMessage({ 
                            sender: 'bot', 
                            content: newContent,
                        });
                    }
                }
                
                // Final flush of the decoder
                const final = decoder.decode(undefined);
                if (final) {
                    accumulatedContent += final;
                    const newContent = accumulatedContent.slice(lastSentContent.length);
                    
                    if (newContent.length > 0) {  // Only send if there's new content
                        lastSentContent = accumulatedContent;
                        params.onBotMessage({ 
                            sender: 'bot', 
                            content: newContent,
                        });
                    }
                }
        
                console.log('Stream completed, total content length:', accumulatedContent.length);
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
            params.onBotMessage({ 
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
