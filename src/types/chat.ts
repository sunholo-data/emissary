// src/types/chat.ts
import type { ChatMessage, Document, EmissaryConfigState, UserState } from '@/types';

export interface BaseChatProps {
  botMessages: ChatMessage[];
  humanMessages: ChatMessage[];
  input: string;
  botName: string;
  botAvatar: string;
  recipientName: string;
  senderName: string;
  userState: UserState;  // Updated to use specific type
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onLogin: () => void;
  isStreaming: boolean;
  error: string | null;
  footer?: React.ReactNode;
}

// Both interfaces now include activeChat controls
interface ChatControlProps {
  activeChat: 'bot' | 'human';
  setActiveChat: (chat: 'bot' | 'human') => void;
}

export interface SplitChatProps extends BaseChatProps, ChatControlProps {}

// UnifiedChatProps now also includes the chat controls
export interface UnifiedChatProps extends BaseChatProps, ChatControlProps {}

// If you need a way to distinguish between them in code:
export type ChatInterfaceType = 'unified' | 'split';