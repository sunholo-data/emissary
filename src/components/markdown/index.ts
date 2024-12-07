// components/markdown/index.ts
import { Highlight } from './Highlight';
import { Plot } from './Plot';
import { Alert } from './Alert';
import { PreviewComponent } from './Preview';
import { Tooltip } from './Tooltip';
import type { CustomComponent } from './types';
import { Pre } from './Pre';
import { GoogleSearch } from './GoogleSearch';
import NetworkGraph from './Network';


// Re-export the components and types
export * from './Highlight';
export * from './Plot';
export * from './types';
export * from './Alert';
export * from './Preview';
export * from './Tooltip';
export * from './Pre';
export * from './GoogleSearch';
export * from './Network';

// Register all components with both cases supported
// don't use <div> in components 
export const markdownComponents: Record<string, CustomComponent> = {
  // Regular lowercase versions
  highlight: Highlight,
  plot: Plot,
  alert: Alert,
  preview: PreviewComponent,
  tooltip: Tooltip,
  pre: Pre,
  googlesearch: GoogleSearch,
  networkgraph: NetworkGraph,

  // Optional: PascalCase versions if you want to support both casings
  Highlight: Highlight,
  Plot: Plot,
  Alert: Alert,
  Preview: PreviewComponent,
  Tooltip: Tooltip,
  Pre: Pre,
  NetworkGraph: NetworkGraph
};

export default markdownComponents;
