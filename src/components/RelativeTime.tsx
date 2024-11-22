import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const RelativeTime = ({ timestamp }: { timestamp: number }) => {
  const [relativeTime, setRelativeTime] = useState(() => 
    formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  );

  useEffect(() => {
    // Update immediately if timestamp changes
    setRelativeTime(formatDistanceToNow(new Date(timestamp), { addSuffix: true }));

    // Determine update interval based on how old the timestamp is
    const age = Date.now() - timestamp;
    let interval = 60000; // Default to 1 minute

    if (age < 60000) { // Less than 1 minute old
      interval = 10000; // Update every 10 seconds
    } else if (age < 3600000) { // Less than 1 hour old
      interval = 60000; // Update every minute
    } else if (age < 86400000) { // Less than 1 day old
      interval = 300000; // Update every 5 minutes
    } else {
      interval = 3600000; // Update every hour for older messages
    }

    const timer = setInterval(() => {
      setRelativeTime(formatDistanceToNow(new Date(timestamp), { addSuffix: true }));
    }, interval);

    return () => clearInterval(timer);
  }, [timestamp]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span className="text-xs text-muted-foreground/60">
            {relativeTime}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {new Date(timestamp).toLocaleString()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RelativeTime;