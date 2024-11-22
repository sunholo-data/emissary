// src/components/demos/NetworkGraphDemo.tsx
import React from 'react';
import NetworkGraph from '@/components/markdown/Network';

const NetworkGraphDemo = () => {
  // Create the network data object
  const networkData = {
    nodes: [
      { id: "1", label: "Start" },
      { id: "2", label: "Process" },
      { id: "3", label: "Decision" },
      { id: "4", label: "End" }
    ],
    edges: [
      { source: "1", target: "2", directed: true },
      { source: "2", target: "3", directed: true },
      { source: "3", target: "4", directed: true, label: "Yes" },
      { source: "3", target: "2", directed: true, label: "No" }
    ],
    title: "Workflow Example",
    width: 300,
    height: 200
  };

  // Convert to JSON string for the value prop
  return (
    <NetworkGraph
      value={JSON.stringify(networkData)}
    />
  );
};

export default NetworkGraphDemo;