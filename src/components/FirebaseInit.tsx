"use client";

import { useEffect } from 'react';
import FirebaseService from '@/lib/firebase';

const WARMUP_INTERVAL = 2 * 60 * 1000; // 2 minutes in milliseconds
let warmupIntervalId: NodeJS.Timeout | null = null;

async function warmupBackend() {
  try {
    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: '/health',
        method: 'GET',
        isStreaming: false
      })
    });
    console.debug('Backend warmup status:', response.status);
  } catch (error) {
    console.debug('Backend warmup failed:', error);
  }
}

export function FirebaseInit() {
  useEffect(() => {
    // Initialize Firebase immediately
    FirebaseService.initializeWelcomeBot();

    // Start warmup in the background without blocking
    Promise.resolve().then(() => {
      // Initial warmup (non-blocking)
      warmupBackend();

      // Clear any existing interval
      if (warmupIntervalId) {
        clearInterval(warmupIntervalId);
      }

      // Set up periodic warmup
      warmupIntervalId = setInterval(warmupBackend, WARMUP_INTERVAL);
    });

    // Cleanup
    return () => {
      if (warmupIntervalId) {
        clearInterval(warmupIntervalId);
        warmupIntervalId = null;
      }
    };
  }, []);

  return null;
}