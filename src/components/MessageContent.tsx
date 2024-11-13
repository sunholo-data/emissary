// src/components/MessageContent.tsx
import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { type ClassNameValue, twMerge } from 'tailwind-merge';
import { type ComponentRegistry, markdownComponents } from './markdown';
import { type Role } from '@/types';

interface MessageContentProps {
  content: string;
  isUser: boolean;
  role: Role;
  className?: ClassNameValue;
  additionalComponents?: ComponentRegistry;
}

const roleComponents = {
  user: {
    ...markdownComponents,
  },
  bot: {
    ...markdownComponents,
  },
  other: {
    ...markdownComponents,
  },
  receiver: {
    ...markdownComponents,
  },
  admin: {
    ...markdownComponents,
  }
};

export const MessageContent: React.FC<MessageContentProps> = ({
  content,
  isUser,
  role,
  className,
  additionalComponents = {}
}) => {
  const components = React.useMemo(() => ({
    ...roleComponents[role],
    ...additionalComponents,
  }), [role, additionalComponents]);

  return (
    <div className={twMerge(
      'prose prose-sm max-w-none dark:prose-invert',
      isUser ? 'text-primary-foreground' : '',
      className
    )}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={components}
        skipHtml={false}
      >
        {content}
      </Markdown>
    </div>
  );
};

export default MessageContent;
