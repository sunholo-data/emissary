// src/components/SuccessDialog.tsx
"use client";

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  shareUrl?: string;
}

export function SuccessDialog({ isOpen, onClose, title, message, shareUrl }: SuccessDialogProps) {
  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  const handleVisit = () => {
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>{message}</p>
            {shareUrl && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Input 
                    value={shareUrl} 
                    readOnly 
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleCopy}
                  >
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleVisit}
                  >
                    Visit
                  </Button>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>
            Close
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}