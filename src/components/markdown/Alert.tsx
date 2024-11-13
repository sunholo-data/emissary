// components/markdown/Alert.tsx
import React from 'react';
import { twMerge } from 'tailwind-merge';
import type { BaseCustomProps } from './types';

export const Alert: React.FC<BaseCustomProps> = ({ 
  children, 
  className,
  type = 'default'
}) => (
  <>
    {/* Add a line break before and after for block-level spacing */}
    <br />
    <span 
      className={twMerge(
        "block", // Make it block-level without using div
        type === 'error' ? "bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-900 dark:text-red-100" :
        type === 'warning' ? "bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100" :
        type === 'success' ? "bg-green-100 border-l-4 border-green-500 text-green-700 dark:bg-green-900 dark:text-green-100" :
        "bg-blue-100 border-l-4 border-blue-500 text-blue-700 dark:bg-blue-900 dark:text-blue-100",
        "px-4 py-2",
        className
      )}
    >
      {children}
    </span>
    <br />
  </>
);