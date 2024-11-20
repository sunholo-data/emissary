// src/components/markdown/Pre.tsx
import React, { useState } from 'react';
import type { CustomComponent } from './types';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const Pre: CustomComponent = ({ node, children, ...props }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  return (
    <span className="relative my-4 block">
      <pre 
        {...props}
        className={`${props.className || ''} relative overflow-hidden transition-[max-height] duration-300 ${
          isCollapsed ? 'max-h-40' : 'max-h-[1000px]'
        }`}
      >
        {children}
      </pre>
      
      {/* Gradient overlay and button */}
      <span className="absolute bottom-0 left-0 right-0 flex justify-center">
        <span className={`absolute inset-0 bg-gradient-to-t from-slate-100 dark:from-slate-800 to-transparent ${
          isCollapsed ? 'visible' : 'hidden'
        }`} />
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="relative px-4 py-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-t-md"
        >
          <span className="flex items-center gap-1">
            {isCollapsed ? (
              <>Show more <ChevronDown className="w-3 h-3" /></>
            ) : (
              <>Show less <ChevronUp className="w-3 h-3" /></>
            )}
          </span>
        </button>
      </span>
    </span>
  );
};

export default Pre;