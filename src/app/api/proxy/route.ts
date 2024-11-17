// src/app/api/proxy/route.ts
import { NextResponse } from 'next/server';

const FETCH_TIMEOUT = 1200000; // 120 seconds
const MAX_RETRIES = 3;
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:1956';
const HEALTH_CHECK_RETRIES = 3;  // Number of health check attempts during startup
const HEALTH_CHECK_RETRY_DELAY = 5000;  // 5 seconds between retries


interface BackendResponse extends Omit<Response, 'body'> {
    body?: ReadableStream<any>;
    json: () => Promise<any>;
}

interface ProxyError extends Error {
    name: string;
    message: string;
    status?: number;
    code?: string;
    requestId?: string;
}

const logWithTimestamp = (requestId: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}][${requestId}] ${message}`, data ? data : '');
};

const handleConnectionError = (error: unknown, requestId: string): never => {
    logWithTimestamp(requestId, 'Connection error details:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        cause: (error as any)?.cause,
        stack: error instanceof Error ? error.stack : undefined
    });

    const proxyError = new Error('Backend connection failed') as ProxyError;
    proxyError.requestId = requestId;
    
    if (error instanceof Error) {
        const cause = (error as any).cause;
        if (cause?.code === 'ECONNREFUSED') {
            proxyError.message = `Cannot connect to backend server at ${BACKEND_BASE_URL}. Is the server running?`;
            proxyError.code = 'ECONNREFUSED';
            proxyError.status = 503;
        } else {
            proxyError.message = error.message;
            proxyError.status = 500;
        }
    }
    
    throw proxyError;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced health check with better error handling
const checkBackendHealth = async (requestId: string, allowRetries: boolean = true): Promise<boolean> => {
    const startTime = Date.now();
    const healthUrl = `${BACKEND_BASE_URL}/health`;

    for (let attempt = 1; attempt <= (allowRetries ? HEALTH_CHECK_RETRIES : 1); attempt++) {
        try {
            logWithTimestamp(requestId, `Health check attempt ${attempt}/${HEALTH_CHECK_RETRIES} for: ${healthUrl}`);
            
            const response = await fetchWithTimeout(
                healthUrl,
                {
                    method: 'GET',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-Request-ID': requestId
                    }
                },
                10000, // 10 second timeout for health checks
                requestId
            );

            const duration = Date.now() - startTime;
            const isHealthy = response.ok && response.status === 200;

            logWithTimestamp(requestId, `Health check response:`, {
                url: healthUrl,
                status: response.status,
                healthy: isHealthy,
                attempt,
                duration: `${duration}ms`
            });

            if (isHealthy) return true;
            
            if (attempt < HEALTH_CHECK_RETRIES && allowRetries) {
                logWithTimestamp(requestId, `Backend not ready, waiting ${HEALTH_CHECK_RETRY_DELAY}ms before retry`);
                await delay(HEALTH_CHECK_RETRY_DELAY);
            }

        } catch (error) {
            const duration = Date.now() - startTime;
            logWithTimestamp(requestId, `Health check attempt ${attempt} failed:`, {
                url: healthUrl,
                error: error instanceof Error ? error.message : 'Unknown error',
                cause: (error as any)?.cause,
                duration: `${duration}ms`
            });

            if (attempt < HEALTH_CHECK_RETRIES && allowRetries) {
                logWithTimestamp(requestId, `Retrying health check in ${HEALTH_CHECK_RETRY_DELAY}ms`);
                await delay(HEALTH_CHECK_RETRY_DELAY);
            }
        }
    }

    return false;
};

const retryWithBackoff = async <T>(
    operation: () => Promise<T>,
    requestId: string,
    retries: number = MAX_RETRIES
): Promise<T> => {
    let lastError: Error | undefined;

    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            
            // Don't retry on certain errors
            if ((error as ProxyError).code === 'ECONNREFUSED' || 
                (error as any)?.status === 400) {
                break;
            }
            
            if (i === retries - 1) break;

            const backoffTime = Math.min(1000 * Math.pow(2, i), 10000);
            logWithTimestamp(requestId, `Retry attempt ${i + 1}/${retries}`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                nextAttemptIn: backoffTime
            });
            
            await delay(backoffTime);
        }
    }

    throw lastError;
};

const fetchWithTimeout = async (
    url: string,
    options: RequestInit,
    timeout: number,
    requestId: string
): Promise<BackendResponse> => {
    const controller = new AbortController();
    const id = setTimeout(() => {
        controller.abort();
        logWithTimestamp(requestId, `Request timed out after ${timeout}ms`);
    }, timeout);

    try {
        logWithTimestamp(requestId, `Fetching ${options.method} ${url}`);
        
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        
        clearTimeout(id);
        
        // Create properly typed response
        const typedResponse: BackendResponse = {
            ...response,
            body: response.body || undefined,
            json: response.json.bind(response),
            ok: response.ok,
            status: response.status
        };

        return typedResponse;

    } catch (error) {
        clearTimeout(id);
        if (error instanceof Error && error.name === 'AbortError') {
            logWithTimestamp(requestId, 'Request aborted due to timeout', {
                url,
                timeout
            });
            const timeoutError = new Error('Request timeout') as ProxyError;
            timeoutError.status = 504;
            throw timeoutError;
        }
        return handleConnectionError(error, requestId);
    }
};

export async function POST(req: Request) {
    const requestId = req.headers.get('X-Request-ID') || 
                     Math.random().toString(36).substring(7);
                     
    logWithTimestamp(requestId, 'Proxy request received');

    try {
        const { endpoint, method = 'POST', isStreaming, ...body } = await req.json();

        if (!endpoint) {
            return NextResponse.json(
                { error: 'Missing endpoint parameter' },
                { status: 400 }
            );
        }

        // Special handling for health check endpoint - don't retry for direct health check requests
        if (endpoint === '/health') {
            const isHealthy = await checkBackendHealth(requestId, false);
            return NextResponse.json({ 
                status: isHealthy ? 200 : 503,
                ok: isHealthy,
                timestamp: new Date().toISOString()
            });
        }

        const backendUrl = `${BACKEND_BASE_URL}${endpoint}`;

        // Check health before proceeding with main request - with retries during startup
        const isHealthy = await checkBackendHealth(requestId, true);
        if (!isHealthy) {
            logWithTimestamp(requestId, 'Backend health check failed after retries');
            return NextResponse.json({
                error: 'Backend service unavailable',
                details: 'The backend server is not responding. Please ensure it is running.',
                retry: true,
                retryAfter: 5  // Suggest client retry after 5 seconds
            }, { 
                status: 503,
                headers: {
                    'Retry-After': '5'
                }
            });
        }
        
        const response = await retryWithBackoff(
            async () => fetchWithTimeout(
                backendUrl,
                {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Connection': 'keep-alive',
                        'X-Request-ID': requestId
                    },
                    ...(method === 'POST' ? { body: JSON.stringify(body) } : {})
                },
                FETCH_TIMEOUT,
                requestId
            ),
            requestId
        );

        if (isStreaming && response.body) {
            const { readable, writable } = new TransformStream();
            let chunkCount = 0;
            let totalBytes = 0;
            
            response.body
                .pipeThrough(new TransformStream({
                    transform(chunk, controller) {
                        chunkCount++;
                        totalBytes += chunk.length;
                        controller.enqueue(chunk);
                    },
                    flush() {
                        logWithTimestamp(requestId, 'Stream completed', {
                            totalChunks: chunkCount,
                            totalBytes
                        });
                    }
                }))
                .pipeTo(writable)
                .catch(error => {
                    logWithTimestamp(requestId, 'Stream error:', error);
                    writable.abort(error);
                });

            return new Response(readable, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache, no-transform',
                    'Connection': 'keep-alive',
                    'Transfer-Encoding': 'chunked',
                    'X-Accel-Buffering': 'no',
                    'X-Request-ID': requestId
                }
            });
        }

        const data = await response.json();
        return NextResponse.json(data);
        
    } catch (error) {
        logWithTimestamp(requestId, 'Proxy error:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            status: (error as ProxyError).status || 500
        });

        return NextResponse.json({
            error: 'Backend request failed',
            details: error instanceof Error ? error.message : 'Unknown error occurred',
            retry: (error as ProxyError).status !== 400
        }, { 
            status: (error as ProxyError).status || 500
        });
    }
}