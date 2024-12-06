import { useRef, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from '@/components/LoadingSpinner';
import MessageContent from '@/components/MessageContent';
import type { ChatMessage } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import RelativeTime from '@/components/RelativeTime';
import type { SplitChatProps } from '@/types/chat';
import { MessageControls } from '@/components/MessageControls';
import { ChatInput } from '@/components/ChatInput';

export default function ChatInterfaceSplit({
  botMessages,
  humanMessages,
  input,
  activeChat,
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
  footer
}: SplitChatProps) {
  const botScrollAreaRef = useRef<HTMLDivElement>(null);
  const humanScrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView(false);
    }
  };

  useEffect(() => {
    scrollToBottom(botScrollAreaRef);
  }, [botMessages]);

  useEffect(() => {
    scrollToBottom(humanScrollAreaRef);
  }, [humanMessages]);

  useEffect(() => {
    // Small delay to allow tab content to mount
    const timer = setTimeout(() => {
      if (activeChat === 'bot' && botScrollAreaRef.current) {
        scrollToBottom(botScrollAreaRef);
      } else if (activeChat === 'human' && humanScrollAreaRef.current) {
        scrollToBottom(humanScrollAreaRef);
      }
    }, 100);
  
    return () => clearTimeout(timer);
  }, [activeChat]);

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


  const renderMessages = useCallback((messages: ChatMessage[], currentTab: 'bot' | 'human') => {
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


  return (
    <div className="flex flex-col h-full">
      <Tabs 
        value={activeChat} 
        onValueChange={(value) => setActiveChat(value as 'bot' | 'human')} 
        className="flex flex-col h-full"
      >
        <div className="flex-grow flex flex-col min-h-0 overflow-hidden bg-white">
          <TabsContent 
            value="bot" 
            className="flex-grow flex flex-col data-[state=active]:flex overflow-hidden m-0 border-0 p-0"
          >
            <ScrollArea className="flex-grow">
              <div className="p-4 space-y-4" ref={botScrollAreaRef}>
                {renderMessages(botMessages, "bot")}
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
          </TabsContent>
  
          <TabsContent 
            value="human" 
            className="flex-grow flex flex-col data-[state=active]:flex overflow-hidden m-0 border-0 p-0"
          >
            <ScrollArea className="flex-grow">
              <div className="p-4 space-y-4" ref={humanScrollAreaRef}>
                {renderMessages(humanMessages, "human")}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
  
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
          onSendMessage={onSendMessage}
          onLogin={onLogin}
        />
      </div>
    </Tabs>
  </div>
  );
}