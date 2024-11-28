import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '@/types';

interface ThrottleOptions {
  wordsPerSecond?: number;
  minDelay?: number;
  maxDelay?: number;
}

export function useThrottledMessages(
  messages: ChatMessage[],
  isStreaming: boolean,
  options: ThrottleOptions = {}
): [ChatMessage[], () => void] {
  const {
    wordsPerSecond = 100,
    minDelay = 10,
    maxDelay = 250
  } = options;

  const [throttledMessages, setThrottledMessages] = useState<ChatMessage[]>([]);
  const queueRef = useRef<string[]>([]);
  const processingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedContentRef = useRef('');

  const resetThrottled = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setThrottledMessages(messages);
    queueRef.current = [];
    processingRef.current = false;
    lastProcessedContentRef.current = '';
  };

  useEffect(() => {
    if (messages.length === 0) {
      resetThrottled();
      return;
    }

    const lastMessage = messages[messages.length - 1];
    
    console.log('Throttle received message update:', {
      isStreaming,
      isBotMessage: lastMessage.sender === 'bot',
      messageLength: lastMessage.content.length,
      queueLength: queueRef.current.length,
      isProcessing: processingRef.current
    });

    // Only do immediate reset if we're not processing anything
    if (!isStreaming || lastMessage.sender !== 'bot') {
      if (!processingRef.current) {
        resetThrottled();
      }
      return;
    }

    const currentMessages = messages.slice(0, -1);
    const streamingMessage = lastMessage;
    const fullContent = streamingMessage.content;

    // Only process content we haven't seen before
    const newContent = fullContent.slice(lastProcessedContentRef.current.length);
    
    if (newContent) {
      // Split into reasonable chunks while preserving words
      const chunks = newContent.match(/[\w\s]{1,20}[,.!?]|\s+\w+|\w+|[^\w\s]/g) || [newContent];
      
      console.log('Processing new content:', {
        newContentLength: newContent.length,
        numberOfChunks: chunks.length,
        currentQueueLength: queueRef.current.length,
        isCurrentlyProcessing: processingRef.current
      });

      queueRef.current.push(...chunks);

      if (!processingRef.current) {
        processQueue(currentMessages, streamingMessage);
      }
    }
  }, [messages, isStreaming]);

  const processQueue = (currentMessages: ChatMessage[], streamingMessage: ChatMessage) => {
    if (queueRef.current.length === 0) {
      processingRef.current = false;
      return;
    }

    processingRef.current = true;
    const chunk = queueRef.current.shift() || '';
    lastProcessedContentRef.current += chunk;

    const words = chunk.trim().split(/\s+/).length;
    const delay = Math.min(Math.max((words / wordsPerSecond) * 1000, minDelay), maxDelay);

    console.log('Processing chunk:', {
      chunkLength: chunk.length,
      words,
      calculatedDelay: delay,
      remainingInQueue: queueRef.current.length,
    });

    setThrottledMessages([
      ...currentMessages,
      { 
        ...streamingMessage, 
        content: lastProcessedContentRef.current 
      }
    ]);

    timeoutRef.current = setTimeout(() => {
      processQueue(currentMessages, streamingMessage);
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [throttledMessages, resetThrottled];
}