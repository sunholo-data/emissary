import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { type ClassNameValue, twMerge } from 'tailwind-merge';
import {
  type ComponentRegistry,
  markdownComponents,
  Plot,
  Alert,
  PreviewComponent,
  Pre
} from './markdown';
import { type Role } from '@/types';

interface MessageContentProps {
  content: string;
  isUser: boolean;
  role: Role;
  className?: ClassNameValue;
  additionalComponents?: ComponentRegistry;
}

// Role-based styling configurations using CSS variables
const roleStyles: Record<Role, { container: string }> = {
  bot: {
    container: 'bg-[var(--chat-bot-bg)] border-[var(--chat-bot)]'
  },
  admin: {
    container: 'bg-[var(--chat-admin-bg)] border-[var(--chat-admin)]'
  },
  receiver: {
    container: 'bg-[var(--chat-receiver-bg)] border-[var(--chat-receiver)]'
  },
  user: {
    container: 'bg-primary text-primary-foreground'
  },
  other: {
    container: 'bg-muted text-muted-foreground'
  }
};

// Individual chunk error boundary component
const ChunkErrorBoundary: React.FC<{
  children: React.ReactNode;
  index: number;
}> = ({ children, index }) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const target = event.target as Node;
      const boundary = document.getElementById(`chunk-boundary-${index}`);
      if (boundary?.contains(target)) {
        event.preventDefault();
        setHasError(true);
        setError(event.error);
      }
    };

    window.addEventListener('error', handleError, true);
    return () => window.removeEventListener('error', handleError, true);
  }, [index]);

  if (hasError) {
    return (
      <div className="p-2 my-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded">
        Error in chunk {index + 1}: {error?.message || 'Failed to render content'}
      </div>
    );
  }

  return <div id={`chunk-boundary-${index}`}>{children}</div>;
};

// Map of components that should be treated as block elements
const BLOCK_COMPONENTS = new Set([
  Plot,
  Alert,
  PreviewComponent,
  Pre
]);

interface Chunk {
  content: string;
  type: 'text' | 'code' | 'plot' | 'alert';
}

// Improved content splitting function with duplicate prevention
const splitContent = (content: string): Chunk[] => {
  const chunks: Chunk[] = [];
  let currentText = '';
  let isInCodeBlock = false;
  let codeBlockContent = '';
  let codeBlockLanguage = '';
  
  const lines = content.split('\n');
  
  const flushText = () => {
    if (currentText.trim()) {
      chunks.push({
        content: currentText.trim(),
        type: 'text'
      });
      currentText = '';
    }
  };

  const flushCodeBlock = () => {
    if (codeBlockContent.trim()) {
      chunks.push({
        content: '```' + codeBlockLanguage + '\n' + codeBlockContent.trim() + '\n```',
        type: 'code'
      });
      codeBlockContent = '';
      codeBlockLanguage = '';
    }
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Handle code blocks
    if (line.startsWith('```')) {
      if (!isInCodeBlock) {
        flushText();
        isInCodeBlock = true;
        codeBlockLanguage = line.slice(3).trim();
      } else {
        isInCodeBlock = false;
        flushCodeBlock();
        continue;
      }
    }
    else if (isInCodeBlock) {
      codeBlockContent += line + '\n';
      continue;
    }
    
    // Handle plot components
    else if (line.includes('<plot')) {
      flushText();
      let plotContent = line;
      while (i + 1 < lines.length && !lines[i].includes('/>')) {
        i++;
        plotContent += '\n' + lines[i];
      }
      chunks.push({
        content: plotContent.trim(),
        type: 'plot'
      });
    }
    
    // Handle alert components
    else if (line.includes('<alert')) {
      flushText();
      let alertContent = line;
      while (i + 1 < lines.length && !lines[i].includes('</alert>')) {
        i++;
        alertContent += '\n' + lines[i];
      }
      chunks.push({
        content: alertContent.trim(),
        type: 'alert'
      });
    }
    
    // Regular text
    else {
      currentText += line + '\n';
    }
  }
  
  // Flush any remaining content
  flushText();
  if (isInCodeBlock) {
    flushCodeBlock();
  }
  
  return chunks;
};

// Wrap component with error handling
const wrapComponent = (Component: React.ComponentType<any>) => {
  const WrappedComponent = (props: any) => {
    const isBlock = BLOCK_COMPONENTS.has(Component);
    const content = (
      <Component {...props} />
    );

    if (isBlock) {
      return (
        <div className="my-4">
          {content}
        </div>
      );
    }

    return content;
  };

  WrappedComponent.displayName = `WrappedComponent(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
};

const wrapComponents = (components: ComponentRegistry): ComponentRegistry => {
  return Object.entries(components).reduce((acc, [key, Component]) => {
    acc[key] = wrapComponent(Component);
    return acc;
  }, {} as ComponentRegistry);
};

// Memoize the role components
const roleComponents = {
  user: wrapComponents(markdownComponents),
  bot: wrapComponents(markdownComponents),
  other: wrapComponents(markdownComponents),
  receiver: wrapComponents(markdownComponents),
  admin: wrapComponents(markdownComponents)
};

export const MessageContent: React.FC<MessageContentProps> = ({
  content,
  isUser,
  role,
  className,
  additionalComponents = {}
}) => {
  // Split content into chunks
  const contentChunks = React.useMemo(() => splitContent(content), [content]);

  // Memoize the combined components
  const components = React.useMemo(() => ({
    ...roleComponents[role],
    ...wrapComponents(additionalComponents),
  }), [role, additionalComponents]);

  // Get styles for current role
  const styles = roleStyles[role];

  return (
    <div
      className={twMerge(
        'prose prose-sm max-w-none dark:prose-invert',
        'rounded-lg border p-3',
        styles.container,
        !isUser && 'dark:prose-invert',
        className
      )}
    >
      {contentChunks.map((chunk, index) => (
        <ChunkErrorBoundary key={`chunk-${index}`} index={index}>
          <Markdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={components}
            skipHtml={false}
          >
            {chunk.content}
          </Markdown>
        </ChunkErrorBoundary>
      ))}
    </div>
  );
};


export default MessageContent;