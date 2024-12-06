// src/components/MessageControls.tsx
import type { UserState } from '@/types';
import type { ChatMessage } from '@/types';

interface MessageControlsProps {
  activeChat: 'bot' | 'human';
  setActiveChat: (chat: 'bot' | 'human') => void;
  botName: string;
  botAvatar: string;
  userState: UserState;
  recipientName: string;
  senderName: string;
  footer: React.ReactNode;
  humanMessages: ChatMessage[]; // Add this to get access to messages
}

export function MessageControls({
  activeChat,
  setActiveChat,
  botName,
  botAvatar,
  userState,
  recipientName,
  senderName,
  footer,
  humanMessages
}: MessageControlsProps) {
  const lastAdminMessage = humanMessages
    .filter(msg => msg.sender === 'admin')
    .slice(-1)[0];

  const humanAvatar = lastAdminMessage?.photoURL;

  return (
    <div className="flex items-center justify-between p-2 border-b bg-muted/30">
      <div className="flex items-center gap-2 px-2 border rounded-full bg-muted/50">
        <button
          onClick={() => setActiveChat('bot')}
          className={`flex items-center gap-2 px-2 py-1 rounded-full transition-colors ${
            activeChat === 'bot' 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-muted'
          }`}
        >
          <img 
            src={botAvatar} 
            alt="Bot" 
            className="w-6 h-6 rounded-full"
          />
          <span className="text-xs">{botName}</span>
        </button>
        <div className="w-px h-4 bg-border" />
        <button
          onClick={() => setActiveChat('human')}
          className={`flex items-center gap-2 px-2 py-1 rounded-full transition-colors ${
            activeChat === 'human' 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-muted'
          }`}
        >
          {humanAvatar ? (
            <img 
              src={humanAvatar}
              alt={userState === 'admin' ? recipientName : senderName}
              className="w-6 h-6 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
              {userState === 'admin' ? 'R' : 'S'}
            </div>
          )}
          <span className="text-xs">
            {userState === 'admin' ? recipientName : senderName}
          </span>
        </button>
      </div>
      {footer}
    </div>
  );
}
