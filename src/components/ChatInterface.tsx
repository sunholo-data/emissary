import { useState, useRef, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, LogIn } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { vacChat } from '@/utils/vacChat';
import MessageContent from '@/components/MessageContent';
import type { Message, Document, ChatInterfaceProps, ChatMessage } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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
}: ChatInterfaceProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const botScrollAreaRef = useRef<HTMLDivElement>(null);
  const humanScrollAreaRef = useRef<HTMLDivElement>(null);
  const currentMessageRef = useRef<string>('');
  const lastUserMessageRef = useRef<string | null>(null);

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

  // Memoize the chat history formatters
const formatBotHistory = useCallback((messages: Message[]) => {
  return messages.map((msg) => ({
    name: msg.sender === 'user' ? 'Human' : 'AI',
    content: msg.content,
  }));
}, []);

const formatHumanHistory = useCallback((messages: Message[]) => {
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
                      content: currentMessageRef.current
                  };
              }
              return newMessages;
          });
      },
      apiEndpoint,
      instructions,
      documents
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

const renderMessages = useCallback((messages: Message[], currentTab: 'bot' | 'human') => {
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
            <span className="text-xs text-muted-foreground">
              {name}
            </span>
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

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeChat} onValueChange={(value) => setActiveChat(value as 'bot' | 'human')} className="flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bot">{botName}</TabsTrigger>
          <TabsTrigger value="human">
            Reply to {userState === 'admin' ? recipientName : senderName}
          </TabsTrigger>
        </TabsList>

        <div className="flex-grow flex flex-col min-h-0 overflow-hidden">
          <TabsContent value="bot" className="flex-grow flex flex-col data-[state=active]:flex overflow-hidden">
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

          <TabsContent value="human" className="flex-grow flex flex-col data-[state=active]:flex overflow-hidden">
            <ScrollArea className="flex-grow">
              <div className="p-4 space-y-4" ref={humanScrollAreaRef}>
                {renderMessages(humanMessages, "human")}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>

        <div className="flex space-x-2 p-4 border-t">
        {activeChat === 'bot' ? (
          // Always show input for bot chat
          <>
            <Input
              placeholder={`Ask a question to ${botName}...`}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
            />
            <Button 
              onClick={onSendMessage}
              disabled={isStreaming || !input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </>
        ) : userState === 'not-logged-in' ? (
          // Show login button for human chat when not logged in
          <Button onClick={onLogin} className="w-full">
            <LogIn className="w-4 h-4 mr-2" /> Log in to reply to {senderName}
          </Button>
        ) : (
          // Show input for human chat when logged in
          <>
            <Input
              placeholder={`Reply to ${userState === 'admin' ? recipientName : senderName}...`}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
            />
            <Button 
              onClick={onSendMessage}
              disabled={isStreaming || !input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
      </Tabs>
    </div>
  );
}