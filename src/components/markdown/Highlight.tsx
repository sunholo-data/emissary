// components/markdown/Highlight.tsx
import React from 'react';
import { twMerge } from 'tailwind-merge';
import type { BaseCustomProps } from './types';

export const Highlight: React.FC<BaseCustomProps> = ({ 
  children, 
  color = '#ffeb3b', 
  className 
}) => (
  <span
    className={twMerge('rounded px-1 py-0.5 font-medium', className)}
    style={{
      backgroundColor: color,
      color: color === '#ffeb3b' ? '#000' : '#fff',
    }}
  >
    {children}
  </span>
);
