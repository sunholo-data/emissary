//src/utils/throttle.ts
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
): [ChatMessage[], (messages: ChatMessage[]) => void] {
  const {
    wordsPerSecond = 10,
    minDelay = 50,
    maxDelay = 250
  } = options;

  const [throttledMessages, setThrottledMessages] = useState<ChatMessage[]>([]);
  const queueRef = useRef<string[]>([]);
  const processingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedContentRef = useRef('');
  const forceCompleteRef = useRef(false);

  const resetThrottledMessages = (newMessages: ChatMessage[]) => {
    console.log('Throttle reset called:', {
      hasTimeout: !!timeoutRef.current,
      queueLength: queueRef.current.length,
      isProcessing: processingRef.current,
      accumulatedLength: accumulatedContentRef.current.length
    });

    // If we're currently processing a queue, mark for completion but don't interrupt
    if (processingRef.current && queueRef.current.length > 0) {
      forceCompleteRef.current = true;
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setThrottledMessages(newMessages);
    queueRef.current = [];
    processingRef.current = false;
    accumulatedContentRef.current = '';
    forceCompleteRef.current = false;
  };

  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    
    console.log('Throttle received message update:', {
      isStreaming,
      isBotMessage: lastMessage.sender === 'bot',
      messageLength: lastMessage.content.length,
      accumulatedLength: accumulatedContentRef.current.length,
      queueLength: queueRef.current.length,
      isProcessing: processingRef.current
    });

    // Only do immediate reset if we're not processing anything
    if (!isStreaming || lastMessage.sender !== 'bot') {
      if (!processingRef.current || queueRef.current.length === 0) {
        resetThrottledMessages(messages);
      } else {
        forceCompleteRef.current = true;
      }
      return;
    }

    const currentMessages = messages.slice(0, -1);
    const streamingMessage = lastMessage;
    const fullContent = streamingMessage.content;

    // Only process the new content since last update
    const newContent = fullContent.slice(accumulatedContentRef.current.length);
    
    if (newContent) {
      const chunks = newContent.match(/[\w\s]{1,20}[,.!?]|\s+\w+|\w+|[^\w\s]/g) || [newContent];
      
      console.log('Processing new content:', {
        newContentLength: newContent.length,
        numberOfChunks: chunks.length,
        currentQueueLength: queueRef.current.length,
        isCurrentlyProcessing: processingRef.current
      });

      queueRef.current.push(...chunks);

      if (!processingRef.current) {
        setThrottledMessages([
          ...currentMessages,
          { ...streamingMessage, content: accumulatedContentRef.current }
        ]);
        processQueue(currentMessages, streamingMessage);
      }
    }
  }, [messages, isStreaming]);

  const processQueue = (currentMessages: ChatMessage[], streamingMessage: ChatMessage) => {
    if (queueRef.current.length === 0 || (forceCompleteRef.current && !isStreaming)) {
      console.log('Queue processing complete', {
        forceComplete: forceCompleteRef.current,
        remainingQueue: queueRef.current.length
      });
      processingRef.current = false;
      
      // If we were forced to complete, do final update with full content
      if (forceCompleteRef.current) {
        setThrottledMessages([
          ...currentMessages,
          { ...streamingMessage, content: streamingMessage.content }
        ]);
        forceCompleteRef.current = false;
      }
      return;
    }

    processingRef.current = true;
    const chunk = queueRef.current.shift() || '';
    
    accumulatedContentRef.current += chunk;

    const words = chunk.split(/\s+/).length;
    const delay = Math.min(Math.max((words / wordsPerSecond) * 1000, minDelay), maxDelay);

    console.log('Processing chunk:', {
      chunkLength: chunk.length,
      words,
      calculatedDelay: delay,
      remainingInQueue: queueRef.current.length,
      totalAccumulated: accumulatedContentRef.current.length
    });

    setThrottledMessages([
      ...currentMessages,
      { ...streamingMessage, content: accumulatedContentRef.current }
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

  return [throttledMessages, resetThrottledMessages];
}