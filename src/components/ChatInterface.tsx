//src/components/ChatInterface.tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, LogIn } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { vacChat } from '@/utils/vacChat';
import MessageContent from '@/components/MessageContent';
import type { ChatInterfaceProps, ChatMessage } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import RelativeTime from '@/components/RelativeTime'

export default function ChatInterface({
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
  setBotMessages,
  apiEndpoint,
  userMessage,
  instructions,
  documents,
  emissaryConfig
}: ChatInterfaceProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const botScrollAreaRef = useRef<HTMLDivElement>(null);
  const humanScrollAreaRef = useRef<HTMLDivElement>(null);
  const currentMessageRef = useRef<string>('');
  const lastUserMessageRef = useRef<string | null>(null);

  const formatMessageTime = (date: Date | string | number) => {
    const dateObj = new Date(date);
    return {
      relative: formatDistanceToNow(dateObj, { addSuffix: true }),
      absolute: dateObj.toLocaleString()
    };
  };

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

  // Reset message ref when switching chats
  useEffect(() => {
    return () => {
      currentMessageRef.current = '';
    };
  }, [activeChat]);

  // Add meta viewport tag management
  useEffect(() => {
    // Save the original viewport meta tag content
    const originalViewport = document.querySelector('meta[name="viewport"]')?.getAttribute('content');
    
    // Update viewport meta to prevent zooming
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1');
    } else {
      const newViewportMeta = document.createElement('meta');
      newViewportMeta.name = 'viewport';
      newViewportMeta.content = 'width=device-width, initial-scale=1, maximum-scale=1';
      document.head.appendChild(newViewportMeta);
    }

    // Cleanup function to restore original viewport settings
    return () => {
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta && originalViewport) {
        viewportMeta.setAttribute('content', originalViewport);
      }
    };
  }, []);

  // Prevent default zoom behavior on input focus for iOS
  const preventZoom = (e: React.FocusEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    target.style.fontSize = '16px'; // Minimum font size to prevent zoom on iOS
  };

  // Memoize the chat history formatters
const formatBotHistory = useCallback((messages: ChatMessage[]) => {
  return messages.map((msg) => ({
    name: msg.sender === 'user' ? 'Human' : 'AI',
    content: msg.content,
  }));
}, []);

const formatHumanHistory = useCallback((messages: ChatMessage[]) => {
  return messages.map((msg) => ({
    name: msg.sender === 'admin' ? 'Admin' : 'Receiver',
    content: msg.content,
  }));
}, []);

// Keep full bot conversation history for API
const chatHistory = botMessages.map((msg) => ({
  name: msg.sender === 'user' ? 'Human' : 'AI',
  content: msg.content,
}));

// Format human messages for API if needed
const humanChatHistory = humanMessages.map((msg) => ({
  name: msg.sender === 'admin' ? 'Admin' : 'Receiver',
  content: msg.content,
})); // Ensure this closing brace and parenthesis

// Reset message ref when starting a new message
useEffect(() => {
  if (userMessage) {
    currentMessageRef.current = '';
  }
}, [userMessage]);

// Stream response when userMessage updates
useEffect(() => {
  // Don't proceed if there's no message or it's the same as last time
  if (!userMessage || userMessage === lastUserMessageRef.current) return;

  // Don't proceed if we're not in bot chat
  if (activeChat !== 'bot') return;

  setIsStreaming(true);
  setError(null);
  
  // Update last processed message
  lastUserMessageRef.current = userMessage;
  
  // Format histories at the time of the API call
  const currentBotHistory = formatBotHistory(botMessages);
  const currentHumanHistory = formatHumanHistory(humanMessages);
  
  let isMounted = true;
  let messageStarted = false;

  vacChat({
      userMessage,
      chatHistory: currentBotHistory,
      humanChatHistory: currentHumanHistory, // Include current state of human chat
      onBotMessage: (message) => {
          if (!isMounted) return;
          
          messageStarted = true;
          currentMessageRef.current = message.content;
          
          setBotMessages(prev => {
              const newMessages = [...prev];
              if (newMessages.length > 0) {
                  newMessages[newMessages.length - 1] = {
                      sender: 'bot',
                      content: currentMessageRef.current,
                      timestamp: Date.now() // Add timestamp when creating bot message

                  };
              }
              return newMessages;
          });
      },
      apiEndpoint,
      instructions,
      documents,
      emissaryConfig
  }).then(() => {
      if (!isMounted) return;
      setIsStreaming(false);
  }).catch((err) => {
      if (!isMounted) return;
      console.error('Error in VacChat:', err);
      
      if (!messageStarted) {
          setError('Error fetching response from bot');
          setBotMessages(prev => prev.slice(0, -1));
          currentMessageRef.current = '';
      }
      setIsStreaming(false);
  });

  return () => {
      isMounted = false;
  };
}, [
  userMessage, 
  apiEndpoint, 
  setBotMessages, 
  instructions, 
  documents, 
  activeChat, 
  formatBotHistory, 
  formatHumanHistory
]); 

const renderMessages = useCallback((messages: ChatMessage[], currentTab: 'bot' | 'human') => {
  return messages.map((message, index) => {
    const isUserMessage = message.sender === 'user' || 
      (userState === 'admin' && message.sender === 'admin') ||
      (userState === 'receiver' && message.sender === 'receiver');

    // Determine avatar and name based on sender
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
    const timeInfo = formatMessageTime(message.timestamp || Date.now());

    return (
      <div 
        key={`${message.sender}-${index}-${message.content.substring(0, 20)}`} 
        className="mb-4 last:mb-0"
      >
        <div className={`flex flex-col ${isUserMessage ? 'items-end' : 'items-start'}`}>
          {/* Avatar and name header */}
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

          {/* Message content */}
          <div 
            className={`rounded-lg p-3 break-words ${
              isUserMessage
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            } max-w-[85%]`}
          >
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  // Modified input wrapper with improved mobile handling
  const renderInputArea = () => {
    if (activeChat === 'bot') {
      return (
        <>
          <Input
            className="text-base" // Ensure readable font size on mobile
            placeholder={`Ask a question to ${botName}...`}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={preventZoom}
            disabled={isStreaming}
            style={{
              fontSize: '16px', // Prevent zoom on iOS
              WebkitAppearance: 'none', // Prevent iOS styling
              borderRadius: '8px' // Ensure consistent styling
            }}
          />
          <Button 
            onClick={onSendMessage}
            disabled={isStreaming || !input.trim()}
            className="min-w-[44px] min-h-[44px]" // Ensure touchable size
          >
            <Send className="w-4 h-4" />
          </Button>
        </>
      );
    } else if (userState === 'not-logged-in') {
      return (
        <Button 
          onClick={onLogin} 
          className="w-full min-h-[44px]" // Ensure touchable size
        >
          <LogIn className="w-4 h-4 mr-2" /> Log in to reply to {senderName}
        </Button>
      );
    } else {
      return (
        <>
          <Input
            className="text-base" // Ensure readable font size on mobile
            placeholder={`Reply to ${userState === 'admin' ? recipientName : senderName}...`}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={preventZoom}
            disabled={isStreaming}
            style={{
              fontSize: '16px', // Prevent zoom on iOS
              WebkitAppearance: 'none', // Prevent iOS styling
              borderRadius: '8px' // Ensure consistent styling
            }}
          />
          <Button 
            onClick={onSendMessage}
            disabled={isStreaming || !input.trim()}
            className="min-w-[44px] min-h-[44px]" // Ensure touchable size
          >
            <Send className="w-4 h-4" />
          </Button>
        </>
      );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Tabs 
        value={activeChat} 
        onValueChange={(value) => setActiveChat(value as 'bot' | 'human')} 
        className="flex flex-col h-full"
      >
    <div className="w-full border-b bg-muted">
      <TabsList className="w-full grid grid-cols-2 rounded-none border-0 bg-transparent p-0">
            <TabsTrigger 
              value="bot"
              className="min-h-[44px] rounded-none border-0 data-[state=active]:bg-white data-[state=active]:shadow-none px-4"
              >
              {botName}
            </TabsTrigger>
            <TabsTrigger 
              value="human"
              className="min-h-[44px] rounded-none border-0 data-[state=active]:bg-white data-[state=active]:shadow-none px-4"
              >
              Reply to {userState === 'admin' ? recipientName : senderName}
            </TabsTrigger>
          </TabsList>
        </div>
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

        <div className="flex space-x-2 p-4 border-t bg-white">
        {renderInputArea()}
      </div>
      </Tabs>
    </div>
  );
}