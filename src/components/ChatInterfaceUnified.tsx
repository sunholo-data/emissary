import { useRef, useEffect, useCallback } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from '@/components/LoadingSpinner';
import MessageContent from '@/components/MessageContent';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import RelativeTime from '@/components/RelativeTime';
import type { ChatMessage } from '@/types';
import type { UnifiedChatProps, MessageContext } from '@/types/chat';
import { MessageControls } from '@/components/MessageControls';
import { ChatInput } from '@/components/ChatInput';


export default function UnifiedChatInterface({
  botMessages,
  humanMessages,
  input,
  botName,
  botAvatar,
  recipientName,
  senderName,
  userState,
  onInputChange,
  onSendMessage,
  onLogin,
  setActiveChat,
  isStreaming,
  error,
  activeChat,
  tools,
  footer
}: UnifiedChatProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView(false);
    }
  };

  useEffect(() => {
    scrollToBottom(scrollAreaRef);
  }, [botMessages, humanMessages]);

  // Add meta viewport tag management
  useEffect(() => {
    const originalViewport = document.querySelector('meta[name="viewport"]')?.getAttribute('content');
    
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1');
    } else {
      const newViewportMeta = document.createElement('meta');
      newViewportMeta.name = 'viewport';
      newViewportMeta.content = 'width=device-width, initial-scale=1, maximum-scale=1';
      document.head.appendChild(newViewportMeta);
    }

    return () => {
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta && originalViewport) {
        viewportMeta.setAttribute('content', originalViewport);
      }
    };
  }, []);

  const allMessages = [...botMessages, ...humanMessages].sort((a, b) => 
    (a.timestamp || 0) - (b.timestamp || 0)
  );

  const renderMessages = useCallback((messages:ChatMessage[]) => {
    return messages.map((message, index) => {
      const isUserMessage = message.sender === 'user' || 
        (userState === 'admin' && message.sender === 'admin') ||
        (userState === 'receiver' && message.sender === 'receiver');

      const getAvatarAndName = () => {
        if (message.sender === 'bot') {
          return {
            image: botAvatar,
            name: botName,
            initials: botName.substring(0, 2)
          };
        }
        
        if (message.sender === 'admin') {
          return {
            image: message.photoURL,
            name: senderName,
            initials: senderName.substring(0, 2)
          };
        }

        const name = message.userName || recipientName;
        return {
          image: message.photoURL,
          name,
          initials: name.substring(0, 2)
        };
      };

      const { image, name, initials } = getAvatarAndName();

      return (
        <div 
          key={`${message.sender}-${index}-${message.content.substring(0, 20)}`} 
          className="mb-4 last:mb-0"
        >
          <div className={`flex flex-col ${isUserMessage ? 'items-end' : 'items-start'}`}>
            <div className={`flex items-center gap-2 mb-1 ${isUserMessage ? 'flex-row-reverse' : 'flex-row'}`}>
              <Avatar className="h-6 w-6">
                {image ? (
                  <AvatarImage 
                    src={image} 
                    alt={name}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <AvatarFallback className="text-xs">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {name}
                </span>
                <RelativeTime timestamp={message.timestamp || Date.now()} />
              </div>
            </div>

            <div className="max-w-[85%]">
                <MessageContent 
                content={message.content} 
                isUser={isUserMessage} 
                role={message.sender}
                />
            </div>
          </div>
        </div>
      );
    });
  }, [userState, botAvatar, botName, senderName, recipientName]);

  const handleSendMessage = (messageContext: MessageContext) => {
    onSendMessage(messageContext);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-4" ref={scrollAreaRef}>
          {renderMessages(allMessages)}
          {error && (
            <div className="flex justify-center">
              <div className="text-red-500 bg-red-100 p-2 rounded">
                {error}
              </div>
            </div>
          )}
          {isStreaming && <LoadingSpinner />}
        </div>
      </ScrollArea>

      <div className="border-t bg-white">
        <MessageControls
          activeChat={activeChat}
          setActiveChat={setActiveChat}
          botName={botName}
          botAvatar={botAvatar}
          userState={userState}
          recipientName={recipientName}
          senderName={senderName}
          footer={footer}
          humanMessages={humanMessages}
        />
        <ChatInput
          input={input}
          activeChat={activeChat}
          botName={botName}
          recipientName={recipientName}
          senderName={senderName}
          userState={userState}
          isStreaming={isStreaming}
          onInputChange={onInputChange}
          onSendMessage={handleSendMessage}  // Use our new handler
          onLogin={onLogin}
          tools={tools}
        />
      </div>
    </div>
  );
}