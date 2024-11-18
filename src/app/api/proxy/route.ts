// src/app/api/proxy/route.ts
import { NextResponse } from 'next/server';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:1956';

const MAX_RETRIES = 3;
const HEALTH_CHECK_RETRIES = 3;  // Number of health check attempts during startup
const HEALTH_CHECK_RETRY_DELAY = 5000;  // 5 seconds between retries

const INITIAL_REQUEST_TIMEOUT = 20000;  // 20 seconds for first request
const NORMAL_REQUEST_TIMEOUT = 120000;  // 120 seconds for subsequent requests
const WARMUP_MARKER = { 
    isFirstRequest: true,
    timestamp: 0 
};

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
    const isWarmupPhase = WARMUP_MARKER.isFirstRequest || 
                         (Date.now() - WARMUP_MARKER.timestamp > 3600000); // Reset after 1 hour idle

    for (let attempt = 1; attempt <= (allowRetries ? HEALTH_CHECK_RETRIES : 1); attempt++) {
        try {
            logWithTimestamp(requestId, `Health check attempt ${attempt}/${HEALTH_CHECK_RETRIES}`, {
                url: healthUrl,
                isWarmupPhase
            });
            
            const response = await fetchWithTimeout(
                healthUrl,
                {
                    method: 'GET',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-Request-ID': requestId
                    }
                },
                10000,
                requestId,
                isWarmupPhase
            );

            const duration = Date.now() - startTime;
            const isHealthy = response.ok && response.status === 200;

            logWithTimestamp(requestId, `Health check response:`, {
                url: healthUrl,
                status: response.status,
                healthy: isHealthy,
                attempt,
                duration: `${duration}ms`,
                isWarmupPhase
            });

            if (isHealthy) return true;
            
            if (attempt < HEALTH_CHECK_RETRIES && allowRetries) {
                const retryDelay = isWarmupPhase ? 
                    HEALTH_CHECK_RETRY_DELAY * 2 : // Double delay during warmup
                    HEALTH_CHECK_RETRY_DELAY;
                    
                logWithTimestamp(requestId, `Backend not ready, waiting ${retryDelay}ms before retry`);
                await delay(retryDelay);
            }

        } catch (error) {
            if (attempt < HEALTH_CHECK_RETRIES && allowRetries) {
                const retryDelay = isWarmupPhase ? 
                    HEALTH_CHECK_RETRY_DELAY * 2 : 
                    HEALTH_CHECK_RETRY_DELAY;
                logWithTimestamp(requestId, `Retrying health check in ${retryDelay}ms`);
                await delay(retryDelay);
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
    requestId: string,
    isWarmupPhase: boolean = false
): Promise<BackendResponse> => {
    const controller = new AbortController();
    const timeoutMs = isWarmupPhase ? INITIAL_REQUEST_TIMEOUT : timeout;
    
    const id = setTimeout(() => {
        controller.abort();
        logWithTimestamp(requestId, `Request timed out after ${timeoutMs}ms`, {
            isWarmupPhase,
            url
        });
    }, timeoutMs);

    try {
        logWithTimestamp(requestId, `Fetching ${options.method} ${url}`, {
            isWarmupPhase,
            timeout: timeoutMs
        });
        
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        
        clearTimeout(id);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        // If this succeeds, we're warmed up
        if (isWarmupPhase) {
            WARMUP_MARKER.isFirstRequest = false;
            WARMUP_MARKER.timestamp = Date.now();
            logWithTimestamp(requestId, 'Backend warmup completed');
        }

        return {
            ...response,
            body: response.body || undefined,
            json: response.json.bind(response),
            ok: response.ok,
            status: response.status
        };

    } catch (error) {
        clearTimeout(id);
        if (error instanceof Error && error.name === 'AbortError') {
            logWithTimestamp(requestId, 'Request aborted due to timeout', {
                url,
                timeout: timeoutMs,
                isWarmupPhase
            });
            const timeoutError = new Error(
                isWarmupPhase ? 
                'Backend still warming up, please retry' : 
                'Request timeout'
            ) as ProxyError;
            timeoutError.status = isWarmupPhase ? 503 : 504;
            throw timeoutError;
        }
        return handleConnectionError(error, requestId);
    }
};

export async function POST(req: Request) {
    const requestId = req.headers.get('X-Request-ID') || 
                     Math.random().toString(36).substring(7);

    const isWarmupPhase = WARMUP_MARKER.isFirstRequest || 
                            (Date.now() - WARMUP_MARKER.timestamp > 3600000);
                     
    logWithTimestamp(requestId, 'Proxy request received', { isWarmupPhase });

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
                timestamp: new Date().toISOString(),
                isWarmupPhase
            });
        }

        const backendUrl = `${BACKEND_BASE_URL}${endpoint}`;

        // Check health before proceeding with main request - with retries during startup
        const isHealthy = await checkBackendHealth(requestId, true);
        if (!isHealthy) {
            return NextResponse.json({
                error: 'Backend service unavailable',
                details: isWarmupPhase ? 
                    'Backend is still warming up, please retry shortly' : 
                    'Backend is not responding, please try again later',
                retry: true,
                retryAfter: isWarmupPhase ? 3 : 5,
                isWarmup: isWarmupPhase
            }, { 
                status: 503,
                headers: {
                    'Retry-After': isWarmupPhase ? '3' : '5'
                }
            });
        }
        
        const response = await fetchWithTimeout(
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
            isWarmupPhase ? INITIAL_REQUEST_TIMEOUT : NORMAL_REQUEST_TIMEOUT,
            requestId,
            isWarmupPhase
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