// src/components/ChatInput.tsx
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, LogIn } from 'lucide-react';
import type { UserState } from '@/types';

interface ChatInputProps {
  input: string;
  activeChat: 'bot' | 'human';
  botName: string;
  recipientName: string;
  senderName: string;
  userState: UserState;
  isStreaming: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onLogin: () => void;
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
  onLogin
}: ChatInputProps) {
  // Prevent default zoom behavior on input focus for iOS
  const preventZoom = (e: React.FocusEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    target.style.fontSize = '16px';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
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
    <div className="flex space-x-2 p-4">
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
        onClick={onSendMessage}
        disabled={isStreaming || !input.trim()}
        className="min-w-[44px] min-h-[44px]"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}