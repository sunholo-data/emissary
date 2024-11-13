import type { VacChatParams } from '@/types';

// Configure timeouts and retries
const STREAM_TIMEOUT = 60000; // 60 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Request lock with timeout to prevent stuck states
let streamLock: { isStreaming: boolean; timestamp: number } = {
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
        console.warn('Detected stale stream lock, resetting');
        streamLock = { isStreaming: false, timestamp: 0 };
    }
};

// Helper for retrying failed requests
const retryWithBackoff = async (
    operation: () => Promise<any>,
    retries: number = MAX_RETRIES
): Promise<any> => {
    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (i === retries - 1) throw error;
            const delay = RETRY_DELAY * Math.pow(2, i);
            console.log(`Retry ${i + 1}/${retries} after ${delay}ms`, error);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
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
        console.warn('Stream already in progress, refusing new request');
        throw new Error('A streaming request is already in progress');
    }

    let controller: AbortController | null = null;
    let accumulatedContent = '';

    try {
        streamLock = { isStreaming: true, timestamp: Date.now() };
        
        controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller?.abort();
        }, STREAM_TIMEOUT);

        const response = await retryWithBackoff(async () => {
            const resp = await fetch('/api/proxy', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
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
                signal: controller!.signal
            });

            if (!resp.ok) {
                throw new Error(`HTTP error! status: ${resp.status}`);
            }
            return resp;
        });

        clearTimeout(timeoutId);

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');

        const decoder = new TextDecoder();
        
        let isFirstChunk = true;

        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    if (accumulatedContent) {
                        onBotMessage({ 
                            sender: 'bot', 
                            content: accumulatedContent 
                        });
                    }
                    break;
                }
                
                // Handle first chunk separately with retry logic
                if (isFirstChunk) {
                    try {
                        const chunk = decoder.decode(value, { stream: true });
                        if (chunk) {
                            accumulatedContent = chunk;
                            onBotMessage({ 
                                sender: 'bot', 
                                content: accumulatedContent 
                            });
                        }
                        isFirstChunk = false;
                    } catch (firstChunkError) {
                        console.warn('Error processing first chunk:', firstChunkError);
                        throw firstChunkError;
                    }
                } else {
                    const chunk = decoder.decode(value, { stream: true });
                    if (chunk) {
                        accumulatedContent += chunk;
                        onBotMessage({ 
                            sender: 'bot', 
                            content: accumulatedContent 
                        });
                    }
                }
            }
        } finally {
            try {
                await reader.cancel();
            } catch (cancelError) {
                console.warn('Error canceling reader:', cancelError);
            }
        }
    } catch (error) {
        console.error('Streaming error:', error);
        
        // Only send error message if we haven't sent any content yet
        if (!accumulatedContent) {
            onBotMessage({ 
                sender: 'bot', 
                content: 'Sorry, an error occurred. Please try again.' 
            });
        }
        throw error;
    } finally {
        // Cleanup
        controller?.abort();
        streamLock = { isStreaming: false, timestamp: 0 };
    }
}