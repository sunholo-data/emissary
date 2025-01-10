// src/contexts/ToolContext.tsx
import React, { createContext, useContext } from 'react';

interface ToolContextType {
  toolConfigs: Record<string, Record<string, any>>;
}

const ToolContext = createContext<ToolContextType>({
  toolConfigs: {},
});

export const useToolContext = () => useContext(ToolContext);

export function ToolProvider({ 
  children, 
  toolConfigs 
}: { 
  children: React.ReactNode;
  toolConfigs: Record<string, Record<string, any>>;
}) {
  return (
    <ToolContext.Provider value={{ toolConfigs }}>
      {children}
    </ToolContext.Provider>
  );
}