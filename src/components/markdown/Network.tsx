// src/components/markdown/Network.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BaseCustomProps } from './types';

// Create a custom props type that extends BaseCustomProps
interface NetworkProps extends BaseCustomProps {
  value?: string; // This will contain the JSON string of nodes and edges
}

const NetworkGraph: React.FC<NetworkProps> = ({ value = '', className }) => {
  // Return null if no value is provided
  if (!value) {
    return "<NetworkGraph />";
  }

  // Parse the input string to get nodes and edges
  const parseNetworkData = (input: string) => {
    try {
      const data = JSON.parse(input);

      return {
        nodes: data.nodes || [],
        edges: data.edges || [],
        title: data.title,
        width: data.width || 400,
        height: data.height || 300
      };
    } catch (e) {
      console.error('Error parsing network data:', e);
      return {
        nodes: [],
        edges: [],
        title: 'Error parsing network data',
        width: 400,
        height: 300
      };
    }
  };

  const { nodes, edges, title, width, height } = parseNetworkData(value);

  // Calculate node positions in a circle if not provided
  const nodesWithPositions = nodes.map((node: any, index: number) => {
    if (node.x !== undefined && node.y !== undefined) {
      return node;
    }
    const angle = (2 * Math.PI * index) / nodes.length;
    const radius = Math.min(width, height) * 0.35;
    return {
      ...node,
      x: width / 2 + radius * Math.cos(angle),
      y: height / 2 + radius * Math.sin(angle),
    };
  });

  // Create a map for quick node lookup
  const nodeMap = nodesWithPositions.reduce((acc: Record<string, any>, node: any) => {
    acc[node.id] = node;
    return acc;
  }, {});

  const renderEdge = (edge: any, index: number) => {
    const source = nodeMap[edge.source];
    const target = nodeMap[edge.target];
    
    if (!source || !target) return null;

    const sourceX = source.x || 0;
    const sourceY = source.y || 0;
    const targetX = target.x || 0;
    const targetY = target.y || 0;

    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const angle = Math.atan2(dy, dx);
    
    const nodeRadius = 20;
    const startX = sourceX + nodeRadius * Math.cos(angle);
    const startY = sourceY + nodeRadius * Math.sin(angle);
    const endX = targetX - nodeRadius * Math.cos(angle);
    const endY = targetY - nodeRadius * Math.sin(angle);

    return (
      <g key={`edge-${index}`} className="text-muted-foreground/50">
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          className="stroke-current"
          strokeWidth={1.5}
        />
        {edge.directed && (
          <path
            d={`M ${endX} ${endY} l ${-8} ${-4} l 0 8 z`}
            transform={`rotate(${(angle * 180) / Math.PI + 180} ${endX} ${endY})`}
            className="fill-current stroke-current"
          />
        )}
        {edge.label && (
          <text
            x={(sourceX + targetX) / 2}
            y={(sourceY + targetY) / 2}
            dy={-4}
            textAnchor="middle"
            className="fill-current text-xs"
          >
            {edge.label}
          </text>
        )}
      </g>
    );
  };

  const renderNode = (node: any) => {
    return (
      <g key={node.id} transform={`translate(${node.x},${node.y})`}>
        <circle
          r={20}
          className="fill-card stroke-border"
          strokeWidth={1.5}
        />
        <text
          dy=".3em"
          textAnchor="middle"
          className="fill-foreground text-sm font-medium"
        >
          {node.label || node.id}
        </text>
      </g>
    );
  };

  return (
    <Card className={cn("w-full max-w-lg mx-auto", className)}>
      {title && (
        <CardHeader className="p-2 sm:p-4">
          <CardTitle className="text-sm sm:text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-2 sm:p-4">
        <div className="w-full">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto"
            style={{ maxHeight: '70vh' }}
          >
            <g>
              {edges.map(renderEdge)}
              {nodesWithPositions.map(renderNode)}
            </g>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkGraph;