// components/hooks/use-alert-dialog.tsx
"use client";

import { createContext, useContext, useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface AlertDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface AlertDialogContextType {
  show: (options: AlertDialogOptions) => void;
}

const AlertDialogContext = createContext<AlertDialogContextType | undefined>(undefined);

export function AlertDialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AlertDialogOptions | null>(null);

  const show = useCallback((dialogOptions: AlertDialogOptions) => {
    setOptions(dialogOptions);
    setIsOpen(true);
  }, []);

  const hide = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleConfirm = () => {
    options?.onConfirm?.();
    hide();
  };

  const handleCancel = () => {
    options?.onCancel?.();
    hide();
  };

  return (
    <AlertDialogContext.Provider value={{ show }}>
      {children}
      {options && (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              {options.title && <AlertDialogTitle>{options.title}</AlertDialogTitle>}
              <AlertDialogDescription>{options.message}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {options.cancelText !== null && (
                <AlertDialogCancel onClick={handleCancel}>
                  {options.cancelText || 'Cancel'}
                </AlertDialogCancel>
              )}
              <AlertDialogAction onClick={handleConfirm}>
                {options.confirmText || 'OK'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AlertDialogContext.Provider>
  );
}

export const useAlertDialog = () => {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error('useAlertDialog must be used within an AlertDialogProvider');
  }
  return context;
};