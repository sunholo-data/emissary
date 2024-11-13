import { NextResponse } from 'next/server';

const FETCH_TIMEOUT = 60000; // 60 seconds
const MAX_RETRIES = 3;
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:1956'; // Use IPv4 explicitly

interface BackendResponse extends Omit<Response, 'body'> {
    body?: ReadableStream<any>;
    json: () => Promise<any>;
}

interface ProxyError extends Error {
    name: string;
    message: string;
    status?: number;
    code?: string;
}

const logWithTimestamp = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data ? data : '');
};

// Enhanced error handling for connection issues
const handleConnectionError = (error: unknown): never => {
    logWithTimestamp('Connection error details:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        cause: (error as any)?.cause,
        stack: error instanceof Error ? error.stack : undefined
    });

    const proxyError = new Error('Backend connection failed') as ProxyError;
    
    if (error instanceof Error) {
        const cause = (error as any).cause;
        if (cause?.code === 'ECONNREFUSED') {
            proxyError.message = `Cannot connect to backend server at ${BACKEND_BASE_URL}. Is the server running?`;
            proxyError.code = 'ECONNREFUSED';
            proxyError.status = 503; // Service Unavailable
        } else {
            proxyError.message = error.message;
            proxyError.status = 500;
        }
    }
    
    throw proxyError;
};

// Health check with both IPv4 and IPv6 attempts
const checkBackendHealth = async (): Promise<boolean> => {
    const startTime = Date.now();
    const urls = [
        `${BACKEND_BASE_URL}/health`,
        BACKEND_BASE_URL.replace('127.0.0.1', 'localhost'),
    ];

    for (const url of urls) {
        try {
            logWithTimestamp(`Checking health for URL: ${url}`);
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const duration = Date.now() - startTime;
            logWithTimestamp(`Health check response for ${url}:`, {
                status: response.status,
                ok: response.ok,
                duration: `${duration}ms`
            });
            if (response.ok) return true;
        } catch (error) {
            logWithTimestamp(`Health check failed for ${url}:`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                cause: (error as any)?.cause
            });
        }
    }
    return false;
};

interface BackendResponse extends Omit<Response, 'body'> {
    body?: ReadableStream<any>;  // Keep the optional property
    json: () => Promise<any>;
}

// Updated fetch with timeout and connection error handling
const fetchWithTimeout = async (
    url: string,
    options: RequestInit,
    timeout: number
): Promise<BackendResponse> => {
    const startTime = Date.now();
    const controller = new AbortController();
    const id = setTimeout(() => {
        controller.abort();
        logWithTimestamp(`Request timed out after ${timeout}ms for URL: ${url}`);
    }, timeout);

    try {
        logWithTimestamp(`Starting ${options.method} request to: ${url}`);
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        const duration = Date.now() - startTime;
        logWithTimestamp(`Fetch response received:`, {
            method: options.method,
            status: response.status,
            ok: response.ok,
            duration: `${duration}ms`,
            headers: Object.fromEntries(response.headers.entries())
        });
        clearTimeout(id);
        
        // Create a properly typed response
        const typedResponse: BackendResponse = {
            ...response,
            body: response.body || undefined,  // Convert null to undefined
            json: response.json.bind(response)
        };
        
        return typedResponse;
    } catch (error) {
        clearTimeout(id);
        logWithTimestamp(`Fetch error:`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            cause: (error as any)?.cause,
            stack: error instanceof Error ? error.stack : undefined
        });
        return handleConnectionError(error);
    }
};

// Retry logic with exponential backoff
const retryWithBackoff = async <T>(
    operation: () => Promise<T>,
    retries: number = MAX_RETRIES
): Promise<T> => {
    let lastError: Error | undefined;

    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            // Don't retry if it's a connection refused error (server is down)
            if ((error as ProxyError).code === 'ECONNREFUSED') {
                break;
            }
            if (i === retries - 1) break;

            const backoffTime = Math.min(1000 * Math.pow(2, i), 10000);
            console.log(`[Retry] Attempt ${i + 1} failed, retrying in ${backoffTime}ms`);
            await delay(backoffTime);
        }
    }

    throw lastError;
};

// Utility to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
    const requestId = Math.random().toString(36).substring(7);
    logWithTimestamp(`[${requestId}] Proxy API Request received`);

    try {
        const { endpoint, method = 'POST', isStreaming, ...body } = await req.json();
        logWithTimestamp(`[${requestId}] Request details:`, {
            endpoint,
            isStreaming,
            bodySize: JSON.stringify(body).length
        });
        if (!endpoint) {
            logWithTimestamp(`[${requestId}] Missing endpoint parameter`);
            return NextResponse.json(
                { error: 'Missing endpoint parameter' },
                { status: 400 }
            );
        }

        const backendUrl = `${BACKEND_BASE_URL}${endpoint}`;
        logWithTimestamp(`[${requestId}] Forwarding to backend URL: ${backendUrl}`);

        // Try health check first
        const isHealthy = await checkBackendHealth();
        logWithTimestamp(`[${requestId}] Health check result: ${isHealthy}`);

        if (!isHealthy) {
            return NextResponse.json({
                error: 'Backend service unavailable',
                details: 'The backend server is not responding. Please ensure it is running.',
                retry: true
            }, { status: 503 });
        }

        const response = await retryWithBackoff(async () => {
            return fetchWithTimeout(backendUrl, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Connection': 'keep-alive',
                },
                ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
            }, FETCH_TIMEOUT);
        });

        if (endpoint === '/health') {
            return NextResponse.json({ 
                status: response.status,
                ok: response.ok 
            });
        }

        if (isStreaming && response.body) {
            logWithTimestamp(`[${requestId}] Setting up streaming response`, {
                responseType: response.type,
                responseStatus: response.status,
                responseHeaders: response.headers ? Object.fromEntries(response.headers.entries()) : 'No headers',
                hasBody: !!response.body,
                bodyType: response.body ? typeof response.body : 'undefined',
                bodyLocked: response.body?.locked
            });

            // Validate the response before proceeding
            if (!response.body) {
                throw new Error('Response body is null or undefined');
            }

            if (response.body.locked) {
                throw new Error('Response body is locked');
            }

            const { readable, writable } = new TransformStream();
            
            logWithTimestamp(`[${requestId}] TransformStream created`, {
                hasReadable: !!readable,
                hasWritable: !!writable
            });

            let streamError: Error | null = null;
            let chunkCount = 0;
            let totalBytes = 0;
            const startTime = Date.now();

            // Create a pass-through transform stream for logging
            const loggingStream = new TransformStream({
                start(controller) {
                    logWithTimestamp(`[${requestId}] Stream transform started`);
                },
                transform(chunk, controller) {
                    try {
                        chunkCount++;
                        totalBytes += chunk.length;
                        logWithTimestamp(`[${requestId}] Received chunk #${chunkCount}`, {
                            chunkSize: chunk.length,
                            totalBytesProcessed: totalBytes,
                            timeElapsed: `${Date.now() - startTime}ms`,
                            chunkPreview: new TextDecoder().decode(chunk.slice(0, 100)) + (chunk.length > 100 ? '...' : '')
                        });
                        controller.enqueue(chunk);
                    } catch (error) {
                        logWithTimestamp(`[${requestId}] Error in transform:`, error);
                        throw error;
                    }
                },
                flush(controller) {
                    logWithTimestamp(`[${requestId}] Stream transform completed`, {
                        totalChunks: chunkCount,
                        totalBytes: totalBytes
                    });
                }
            });

            // Chain the streams together with error handling
            const streamPromise = response.body
                .pipeThrough(loggingStream)
                .pipeTo(writable)
                .catch((error: Error) => {
                    streamError = error;
                    logWithTimestamp(`[${requestId}] Stream error:`, {
                        error: error.message,
                        stack: error.stack,
                        name: error.name,
                        chunks: chunkCount,
                        bytesProcessed: totalBytes,
                        duration: `${Date.now() - startTime}ms`
                    });
                    writable.abort(error);
                    throw error;
                });

            // Set up stream timeout
            const streamTimeout = setTimeout(() => {
                const timeoutError = new Error('Stream timeout');
                logWithTimestamp(`[${requestId}] Stream timeout occurred`, {
                    chunks: chunkCount,
                    bytesProcessed: totalBytes,
                    duration: `${Date.now() - startTime}ms`,
                    error: timeoutError
                });
                writable.abort(timeoutError);
            }, FETCH_TIMEOUT);

            // Monitor stream completion
            streamPromise.finally(() => {
                const duration = Date.now() - startTime;
                logWithTimestamp(`[${requestId}] Stream ended`, {
                    error: streamError?.message,
                    totalChunks: chunkCount,
                    totalBytes: totalBytes,
                    streamDuration: `${duration}ms`,
                    averageChunkSize: totalBytes / (chunkCount || 1),
                    processedPerSecond: (totalBytes / (duration || 1)) * 1000
                });
                clearTimeout(streamTimeout);
            });

            // Create the response with detailed headers
            const streamResponse = new Response(readable, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache, no-transform',
                    'Connection': 'keep-alive',
                    'Transfer-Encoding': 'chunked',
                    'X-Accel-Buffering': 'no',
                    'X-Request-ID': requestId,
                }
            });

            // Log final response creation
            logWithTimestamp(`[${requestId}] Stream response created`, {
                responseHeaders: Object.fromEntries(streamResponse.headers.entries())
            });

            return streamResponse;
        } else {
            const data = await response.json();
            logWithTimestamp(`[${requestId}] Returning JSON response`);
            return NextResponse.json(data, { status: response.status });
        }
    } catch (error: unknown) {
        logWithTimestamp(`[${requestId}] Error:`, {
            errorType: error instanceof Error ? error.constructor.name : typeof error,
            error: error instanceof Error ? error.message : 'Unknown error',
            cause: (error as any)?.cause,
            stack: error instanceof Error ? error.stack : undefined
        });

        // Return error response
        const errorResponse = {
            error: 'Backend request failed',
            details: error instanceof Error ? error.message : 'Unknown error occurred',
            retry: true
        };

        return NextResponse.json(errorResponse, { 
            status: error instanceof Error && (error as any).status ? (error as any).status : 500 
        });
    }
}