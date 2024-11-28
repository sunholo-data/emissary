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

  // Carefully split content while preserving markdown and whitespace
  const splitContentIntoChunks = (content: string): string[] => {
    // Find markdown sequences and their positions
    const markdownPositions: Array<{start: number; end: number}> = [];
    const markdownRegex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|__.*?__|_.*?_|\[.*?\]\(.*?\)|\n\s*[-*+]\s.*$)/gm;
    
    let match;
    while ((match = markdownRegex.exec(content)) !== null) {
      markdownPositions.push({
        start: match.index,
        end: match.index + match[0].length
      });
    }

    // Initialize chunks array
    const chunks: string[] = [];
    let currentPos = 0;
    const targetChunkSize = 20;

    while (currentPos < content.length) {
      // Find the next safe split point
      let chunkEnd = currentPos + targetChunkSize;
      
      // Check if this chunk would split a markdown sequence
      const conflictingMd = markdownPositions.find(
        pos => pos.start < chunkEnd && pos.end > currentPos
      );

      if (conflictingMd) {
        // If we're inside a markdown sequence, extend the chunk to include it
        if (currentPos >= conflictingMd.start) {
          chunkEnd = conflictingMd.end;
        } else {
          // If we haven't started the markdown sequence yet, end before it
          chunkEnd = conflictingMd.start;
        }
      }

      // Adjust chunk end to not split words
      if (chunkEnd < content.length) {
        // Look for a space or newline to split on
        const nextSpace = content.indexOf(' ', chunkEnd);
        const nextNewline = content.indexOf('\n', chunkEnd);
        const nextSplit = Math.min(
          nextSpace !== -1 ? nextSpace : content.length,
          nextNewline !== -1 ? nextNewline : content.length
        );
        chunkEnd = nextSplit;
      }

      // Add the chunk
      chunks.push(content.slice(currentPos, chunkEnd));
      currentPos = chunkEnd;
    }

    return chunks;
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

    // Only process new content
    const newContent = fullContent.slice(lastProcessedContentRef.current.length);
    
    if (newContent) {
      const chunks = splitContentIntoChunks(newContent);
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
    
    // Preserve trailing whitespace when accumulating content
    lastProcessedContentRef.current += chunk;

    // Calculate delay based on visible characters rather than whitespace
    const visibleChars = chunk.trim().length;
    const delay = Math.min(
      Math.max((visibleChars / (wordsPerSecond * 5)) * 1000, minDelay),
      maxDelay
    );
    
    /*
    console.log('Processing chunk:', {
      chunkLength: chunk.length,
      visibleChars,
      calculatedDelay: delay,
      remainingInQueue: queueRef.current.length,
    });
    */

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