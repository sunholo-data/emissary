'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const SessionTimeout = ({ timeoutMinutes = 30, warningMinutes = 1 }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [lastActivity, setLastActivity] = useState(0);

  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
    setShowWarning(false);
  }, []);

  useEffect(() => {
    // Initialize lastActivity on mount
    setLastActivity(Date.now());

    // Only run client-side
    if (typeof window === 'undefined') return;

    const timeoutDuration = timeoutMinutes * 60 * 1000;
    const warningDuration = warningMinutes * 60 * 1000;
    
    const handleActivity = () => {
      resetTimer();
    };

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    // Add event listeners
    const cleanup = activityEvents.map(event => {
      window.addEventListener(event, handleActivity, { passive: true });
      return () => window.removeEventListener(event, handleActivity);
    });

    // Session check interval
    const intervalId = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity;
      
      if (timeSinceLastActivity >= timeoutDuration) {
        window.location.reload();
      } else if (timeSinceLastActivity >= (timeoutDuration - warningDuration)) {
        setShowWarning(true);
      }
    }, 10000);

    // Cleanup function
    return () => {
      cleanup.forEach(cleanupFn => cleanupFn());
      clearInterval(intervalId);
    };
  }, [lastActivity, timeoutMinutes, warningMinutes, resetTimer]);

  // Only render on client
  if (typeof window === 'undefined') return null;

  return (
    <AlertDialog open={showWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Timeout Warning</AlertDialogTitle>
          <AlertDialogDescription>
            Your session will timeout in {warningMinutes} minute{warningMinutes > 1 ? 's' : ''}. 
            Click continue to stay active or wait for automatic page refresh.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={resetTimer}>Continue Session</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SessionTimeout;