// src/components/ChatInput.tsx
import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, LogIn } from 'lucide-react';
import type { UserState } from '@/types';
import type { SelectedItem } from '@/types/file-browser';
import type { MessageContext } from '@/types/chat';
import { FileBrowserButton } from '@/components/FileBrowserButton';
import { Badge } from '@/components/ui/badge';
import { Folder, File } from 'lucide-react';

interface ChatInputProps {
  input: string;
  activeChat: 'bot' | 'human';
  botName: string;
  recipientName: string;
  senderName: string;
  userState: UserState;
  isStreaming: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: (messageContext: MessageContext) => void;
  onLogin: () => void;
  tools?: string[];  
}

export function ChatInput({
  input,
  activeChat,
  botName,
  recipientName,
  senderName,
  userState,
  isStreaming,
  onInputChange,
  onSendMessage,
  onLogin,
  tools = []
}: ChatInputProps) {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const showFileBrowser = tools.includes('file-browser');

  const handleSend = () => {
    onSendMessage({
      text: input,
      selectedItems: selectedItems
    });
    setSelectedItems([]); // Clear selections after sending
  };

  // Prevent default zoom behavior on input focus for iOS
  const preventZoom = (e: React.FocusEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    target.style.fontSize = '16px';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Show login button only for human chat when not logged in
  if (activeChat === 'human' && userState === 'not-logged-in') {
    return (
      <div className="p-4">
        <Button onClick={onLogin} className="w-full min-h-[44px]">
          <LogIn className="w-4 h-4 mr-2" /> Log in to continue the conversation
        </Button>
      </div>
    );
  }

  const placeholderText = activeChat === 'bot'
    ? `Send message to ${botName}...`
    : `Send message to ${userState === 'admin' ? recipientName : senderName}...`;


  return (
    <div className="p-4">
      {/* Selected Items Display */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedItems.map(item => (
            <Badge 
              key={`${item.type}-${item.path}`}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {item.type === 'folder' ? (
                <Folder className="h-3 w-3" />
              ) : (
                <File className="h-3 w-3" />
              )}
              {item.name}
              <span 
                className="ml-1 cursor-pointer hover:text-gray-700"
                onClick={() => setSelectedItems(prev => 
                  prev.filter(i => i.path !== item.path)
                )}
              >
                ×
              </span>
            </Badge>
          ))}
        </div>
      )}
      
      <div className="flex space-x-2">
        {showFileBrowser && (
          <FileBrowserButton
            onItemsSelected={setSelectedItems}
            selectedItems={selectedItems}
          />
        )}
        <Input
          className="text-base"
          placeholder={placeholderText}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={preventZoom}
          disabled={isStreaming}
          style={{
            fontSize: '16px',
            WebkitAppearance: 'none',
            borderRadius: '8px'
          }}
        />
        <Button 
          onClick={handleSend}
          disabled={isStreaming || (!input.trim() && selectedItems.length === 0)}
          className="min-w-[44px] min-h-[44px]"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}