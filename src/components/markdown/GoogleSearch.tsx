import React from 'react';
import { twMerge } from 'tailwind-merge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import type { BaseCustomProps, CustomComponent } from './types';

/*
[//]: # (Component: GoogleSearch)
[//]: # (Description: Displays Gemini API search results with sources and confidence scores)
[//]: # (Usage: <googlesearch searchEntryPoint="string" sources={[]} segments={[]} queries={[]}>)
[//]: # (Props:)
[//]: # (  - searchEntryPoint?: string - Google search UI HTML)
[//]: # (  - sources?: Array<{uri: string, title: string}> - Reference sources)
[//]: # (  - segments?: Array<{text: string, confidence: number, sources: string[]}> - Text segments)
[//]: # (  - queries?: string[] - Search queries used)
[//]: # (  - error?: string - Optional error message)
[//]: # (Example:)
[//]: # (```markdown)
[//]: # (<googlesearch)
[//]: # (  searchEntryPoint="<div>...</div>")
[//]: # (  sources='[{"uri": "https://example.com", "title": "Example"}]')
[//]: # (  segments='[{"text": "Sample text", "confidence": 0.95, "sources": ["..."]}]')
[//]: # (  queries='["search query"]')
[//]: # (/>)
[//]: # (```)
[//]: # (Notes: All props should be JSON stringified when used in markdown)
*/

export const GoogleSearch: CustomComponent = ({ 
  searchEntryPoint = '',
  sources = [], 
  segments = [], 
  queries = [],
  className,
  error
}) => {
  // Type guard for the props
  const typedSources = Array.isArray(sources) ? sources : [];
  const typedSegments = Array.isArray(segments) ? segments : [];
  const typedQueries = Array.isArray(queries) ? queries : [];

  if (error && typeof error === 'string') {
    return (
      <>
        <br />
        <Card className={twMerge("w-full bg-red-50", className)}>
          <CardContent className="pt-6">
            <span className="text-red-600">Error parsing Gemini response: {error}</span>
          </CardContent>
        </Card>
        <br />
      </>
    );
  }

  if (!searchEntryPoint) {
    return null;
  }

  return (
    <>
      <br />
      <span className={twMerge("inline-block w-full space-y-4", className)}>
        {/* Original Google Search UI */}
        <span className="inline-block w-full" dangerouslySetInnerHTML={{ __html: searchEntryPoint }} />
        
        {/* Sources Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="inline-block w-full space-y-2">
              {typedSources.map((source, index) => (
                <a
                  key={index}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>{source.title || 'Unnamed Source'}</span>
                </a>
              ))}
            </span>
          </CardContent>
        </Card>

        {/* Text Segments with Confidence */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supporting Evidence</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="inline-block w-full space-y-4">
              {typedSegments.map((segment, index) => (
                <span key={index} className="inline-block w-full border-l-4 border-blue-500 pl-4">
                  <span className="inline-block mb-2">{segment.text}</span>
                  <span className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                      Confidence: {(segment.confidence * 100).toFixed(1)}%
                    </span>
                    <span>•</span>
                    <span>{segment.sources.length} source{segment.sources.length !== 1 ? 's' : ''}</span>
                  </span>
                </span>
              ))}
            </span>
          </CardContent>
        </Card>

        {/* Search Queries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="inline-flex flex-wrap gap-2">
              {typedQueries.map((query, index) => (
                <span
                  key={index}
                  className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm"
                >
                  {query}
                </span>
              ))}
            </span>
          </CardContent>
        </Card>
      </span>
      <br />
    </>
  );
};

export default GoogleSearch;