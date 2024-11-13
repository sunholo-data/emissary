"use client";

import React, { useEffect, useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const SessionTimeout = ({ timeoutMinutes = 30, warningMinutes = 1 }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const resetTimer = () => {
    setLastActivity(Date.now());
    setShowWarning(false);
  };

  useEffect(() => {
    // Convert minutes to milliseconds
    const timeoutDuration = timeoutMinutes * 60 * 1000;
    const warningDuration = warningMinutes * 60 * 1000;
    
    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners for user activity
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Check session status periodically
    const intervalId = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity;
      
      if (timeSinceLastActivity >= timeoutDuration) {
        // Force refresh
        window.location.reload();
      } else if (timeSinceLastActivity >= (timeoutDuration - warningDuration)) {
        setShowWarning(true);
      }
    }, 10000); // Check every 10 seconds

    return () => {
      // Cleanup
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(intervalId);
    };
  }, [lastActivity, timeoutMinutes, warningMinutes]);

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