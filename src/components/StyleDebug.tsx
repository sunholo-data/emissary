'use client';

import { useEffect } from 'react';

export function StyleDebug() {
  useEffect(() => {
    const body = document.body;
    const styles = window.getComputedStyle(body);
    console.log('Body computed styles:', {
      backgroundColor: styles.backgroundColor,
      color: styles.color,
      // Log CSS variables
      '--background': styles.getPropertyValue('--background'),
      '--foreground': styles.getPropertyValue('--foreground'),
    });
  }, []);

  return null;
}
