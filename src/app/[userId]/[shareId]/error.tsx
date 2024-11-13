// src/app/[userId]/[shareId]/error.tsx
'use client';

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Share page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Something went wrong</h1>
        <p className="text-gray-600">
          We encountered an error while loading this share.
        </p>
        <div className="space-x-4">
          <Button onClick={reset}>
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <a href="/">Return Home</a>
          </Button>
        </div>
      </div>
    </div>
  );
}