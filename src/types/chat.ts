// src/types/chat.ts
import type { ChatMessage, Document, EmissaryConfigState, UserState } from '@/types';
import type { SelectedItem, FileBrowserButtonProps } from '@/types/file-browser';

// Define the MessageContext type separately for reuse
export interface MessageContext {
  text: string;
  selectedItems?: SelectedItem[];
}

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
  onSendMessage: (messageContext: MessageContext) => void; 
  onLogin: () => void;
  isStreaming: boolean;
  error: string | null;
  footer?: React.ReactNode;
}

// Both interfaces now include activeChat controls
interface ChatControlProps {
  activeChat: 'bot' | 'human';
  setActiveChat: (chat: 'bot' | 'human') => void;
  tools?: string[];
}

export interface SplitChatProps extends BaseChatProps, ChatControlProps {
  selectedItems: SelectedItem[];
  onFileSelection: (items: SelectedItem[]) => void;
}
// UnifiedChatProps now also includes the chat controls
export interface UnifiedChatProps extends BaseChatProps, ChatControlProps {
  selectedItems: SelectedItem[];
  onFileSelection: (items: SelectedItem[]) => void;
}
// If you need a way to distinguish between them in code:
export type ChatInterfaceType = 'unified' | 'split';