// src/types/index.ts
import { FileText, Image as ImageIcon, FileSpreadsheet, FileCode, Video, Music, File } from 'lucide-react';
import type { SelectedItem, FileBrowserButtonProps } from '@/types/file-browser';

export type UserState = 'not-logged-in' | 'receiver' | 'admin';

export type Role = 'user' | 'bot' | 'other' | 'receiver' | 'admin';

export type planTier = 'free' | 'basic' | 'premium';

export interface Document {
  type: string;
  name: string;
  url: string;
  storagePath?: string;
  contentType?: string;
  size?: number;  
  uploadedAt?: Date; 
}

export interface BaseVacChatParams {
  userMessage: string;
  chatHistory: Array<{ name: string; content: string }>;
  humanChatHistory: Array<{ name: string; content: string }>;
  onBotMessage: (message: { sender: string; content: string }) => void;
  apiEndpoint: string;
}

// Allow any additional properties while maintaining type safety for required ones
export interface VacChatParams extends BaseVacChatParams {
  [key: string]: any;
}

interface UserConfig {
  state: UserState
  sender: string;
  recipient: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  planTier?: planTier
  // Add any other user-related config fields
}

export type ChatInterfaceProps = {
    botMessages: ChatMessage[];
    humanMessages: ChatMessage[];
    input: string;
    activeChat: 'bot' | 'human';
    botName: string;
    botAvatar: string;
    recipientName: string;
    senderName: string;
    userState: UserState;
    onInputChange: (value: string) => void;
    onSendMessage: () => void;
    onLogin: () => void;
    setActiveChat: (value: 'bot' | 'human') => void;
    setBotMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    apiEndpoint: string;
    userMessage: string | null;
    instructions?: string;
    documents?: Document[];
    emissaryConfig?: EmissaryConfigState | undefined;
    voiceConfig?: {
      languageCode: string;
      name: string;
      ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';
    };
  };

export type DocumentSidebarProps = {
    documents: Document[];
    userState: UserState;
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
  tools?: string[]; 
  toolConfigs?: Record<string, Record<string, any>>;
  selectedItems?: SelectedItem[];
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
  planTier: planTier;
  usageCount: number;
  lastAccessedAt: number;
}

export interface ChatMessage {
  sender: Role;
  content: string;
  timestamp?: number;
  userName?: string;
  userEmail?: string;
  read?: boolean;
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
  tools?: string[]; 
  toolConfigs?: Record<string, Record<string, any>>;
}


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

// all bots a user has access to
export interface UserBot {
    shareId: string;
    botId: string;
    botName: string;
    botAvatar: string;
    recipientName: string;
    adminEmail: string;
    initialMessage?: string;
    initialInstructions?: string;
    initialDocuments: Document[];
    createdAt?: Date;
    updatedAt?: Date;
    shareUrl?: string;
    usageCount?: number;
    lastAccessedAt?: Date;
    tools?: string[];
  }

export interface EmissaryListProps {
  bots: UserBot[];
  onEdit?: (bot: UserBot) => void;
  showEditButton?: boolean;
}