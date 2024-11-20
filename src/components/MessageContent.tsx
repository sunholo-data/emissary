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
import { ErrorBoundary } from './ErrorBoundary';

interface MessageContentProps {
  content: string;
  isUser: boolean;
  role: Role;
  className?: ClassNameValue;
  additionalComponents?: ComponentRegistry;
}

// Map of components that should be treated as block elements
const BLOCK_COMPONENTS = new Set([
  Plot,
  Alert,
  PreviewComponent,
  Pre
]);

// Wrap component with both error boundary and block handling if needed
const wrapComponent = (Component: React.ComponentType<any>) => {
  const WrappedComponent = (props: any) => {
    const isBlock = BLOCK_COMPONENTS.has(Component);
    const content = (
      <ErrorBoundary
        fallback={
          <div className="p-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded">
            Failed to render {Component.displayName || Component.name || 'component'}
          </div>
        }
      >
        <Component {...props} />
      </ErrorBoundary>
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

  // Preserve the display name for debugging
  WrappedComponent.displayName = `WrappedComponent(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
};

const wrapComponents = (components: ComponentRegistry): ComponentRegistry => {
  return Object.entries(components).reduce((acc, [key, Component]) => {
    acc[key] = wrapComponent(Component);
    return acc;
  }, {} as ComponentRegistry);
};

// Memoize the role components to prevent unnecessary re-wrapping
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
  // Memoize the combined components
  const components = React.useMemo(() => ({
    ...roleComponents[role],
    ...wrapComponents(additionalComponents),
  }), [role, additionalComponents]);

  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 text-red-500 bg-red-50 dark:bg-red-900/20 rounded">
          Failed to render message content
        </div>
      }
    >
      <div className={twMerge(
        'prose prose-sm max-w-none dark:prose-invert',
        isUser ? 'text-primary-foreground' : '',
        className
      )}>
        <Markdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={components}
          skipHtml={false}
        >
          {content}
        </Markdown>
      </div>
    </ErrorBoundary>
  );
};

export default MessageContent;
