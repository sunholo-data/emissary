// src/types/index.ts
export type UserState = 'not-logged-in' | 'receiver' | 'admin';

export type Role = 'user' | 'bot' | 'other' | 'receiver' | 'admin';

export type Plan = 'free' | 'basic' | 'premium';

export interface Document {
  type: string;
  name: string;
  url: string;
  storagePath?: string;
  contentType?: string;
  size?: number;  
  uploadedAt?: Date; 
}

export type Message = {
  sender: Role;
  content: string;
  timestamp?: string;
  userName?: string;
  userEmail?: string;
  photoURL?: string;
};

export type VacChatParams = {
  userMessage: string;
  chatHistory: { name: string; content: string }[];
  humanChatHistory: { name: string; content: string }[];
  onBotMessage: (message: Message) => void;
  apiEndpoint: string;
  instructions?: string;
  documents?: Document[];
};

export type ChatInterfaceProps = {
    botMessages: Message[];
    humanMessages: Message[];
    input: string;
    activeChat: 'bot' | 'human';
    botName: string;
    botAvatar: string;
    recipientName: string;
    senderName: string;
    userState: string;
    onInputChange: (value: string) => void;
    onSendMessage: () => void;
    onLogin: () => void;
    setActiveChat: (value: 'bot' | 'human') => void;
    setBotMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    apiEndpoint: string;
    userMessage: string | null;
    instructions?: string;
    documents?: Document[];
  };

export type DocumentSidebarProps = {
    documents: Document[];
    userState: string;
    fileInputRef: React.RefObject<HTMLInputElement>;
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onDeleteDocument: (index: number) => void;
  };

// Base config type with all the common properties
export interface BaseConfigProps {
  botId: string;
  botName: string;
  botAvatar: string;
  senderName: string;
  recipientName: string;
  initialDocuments: Document[];
  adminEmail: string;
  initialMessage?: string;
  initialInstructions?: string;
}

// Full config type that includes shareId - used for the final/complete config
export interface ConfigProps extends BaseConfigProps {
  shareId: string;
}

// Internal config state type for Emissary - shareId is optional
export interface EmissaryConfigState extends BaseConfigProps {
  shareId?: string;
}
  
export interface ShareMetadata {
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  planTier: Plan;
  usageCount: number;
  lastAccessedAt: number;
}

export interface ChatMessage {
  sender: 'admin' | 'receiver';
  content: string;
  timestamp: number;
  userName: string;
  userEmail: string;
  read: boolean;
  photoURL?: string; 
  id?: string;  // Optional as it's added after fetching from Firestore

}

export interface ShareConfig {
  shareId: string;
  botId: string;
  botName: string;
  senderName: string;
  recipientName: string;
  initialDocuments: Document[];
  adminEmail: string;
  initialMessage?: string;
  initialInstructions?: string;
  metadata: ShareMetadata;
}

import { FileText, Image as ImageIcon, FileSpreadsheet, FileCode, Video, Music, File } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const IconMap = {
  FileText,
  Image: ImageIcon,
  FileSpreadsheet,
  FileCode,
  Video,
  Music,
  File,
} as const;

// Create a type from the IconMap keys
export type FileIconType = keyof typeof IconMap;