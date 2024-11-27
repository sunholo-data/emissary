// src/components/Emissary.tsx
"use client"
import { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import ChatInterfaceSplit from '@/components/ChatInterfaceSplit';
import UnifiedChatInterface from "@/components/ChatInterfaceUnified";
import LoginDialog from "@/components/LoginDialog";
import type { Document, Role, ChatMessage, EmissaryConfigState } from '@/types';
import FirebaseService from '@/lib/firebase';
import { useToast } from "@/components/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { vacChat } from '@/utils/vacChat';
import { useThrottledMessages } from '@/utils/throttle';
import { UserState } from '@/types';
import type { ChatInterfaceType } from '@/types/chat';

export type EmissaryProps = {
  senderName?: string;
  recipientName?: string;
  botName?: string;
  botAvatar?: string;
  initialMessage?: string;
  initialDocuments?: Document[];
  initialInstructions?: string;
  adminEmail?: string;
  shareId: string;
  userState: UserState;
  currentUser: User | null;
  showLoginDialog: boolean;
  setShowLoginDialog: (show: boolean) => void;
  handleLogout: () => Promise<void>;
  tools?: string[];
};

export default function Emissary({
  senderName = "John Doe",
  recipientName = "Jane Smith",
  botName = "Hermes",
  botAvatar = "/placeholder.svg?height=40&width=40",
  initialMessage = "Hello! I have an important message for you.",
  initialDocuments = [],
  initialInstructions = "Default instructions for the Emissary.",
  shareId,
  userState,
  currentUser,
  showLoginDialog,
  setShowLoginDialog,
  tools = []
}: EmissaryProps) {
  const [viewType, setViewType] = useState<ChatInterfaceType>('unified');
  const [botMessages, setBotMessages] = useState<ChatMessage[]>([{ 
    sender: 'bot', 
    content: initialMessage,
    timestamp: Date.now(),
    userName: botName,
    photoURL: botAvatar
  }]);
  const [humanMessages, setHumanMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [activeChat, setActiveChat] = useState<'bot' | 'human'>('bot');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentMessageRef = useRef<string>('');
  const lastProcessedMessageRef = useRef<string | null>(null);

  const [config, setConfig] = useState<EmissaryConfigState>({
    botId: '',
    botName,
    botAvatar,
    senderName,
    recipientName,
    initialDocuments,
    adminEmail: '',
    initialMessage,
    initialInstructions,
    tools
  });

  const { toast } = useToast();

  const handleViewChange = (checked: boolean) => {
    setViewType(checked ? 'unified' : 'split');
  };

  // Update config when shareId or user changes
  useEffect(() => {
    if (shareId) {
      setConfig(prev => ({ ...prev, shareId }));
    }
  }, [shareId]);

  useEffect(() => {
    if (currentUser) {
      setConfig(prev => ({
        ...prev,
        adminEmail: currentUser.email || '',
        senderName: currentUser.displayName || 'Anonymous'
      }));
    }
  }, [currentUser]);

  // Firebase subscription for human messages
  useEffect(() => {
    let unsubscribe: () => void;
    
    const loadChatMessages = async () => {
      if (!config.shareId) return;
    
      const isAdmin = userState === 'admin';
      const userEmail = currentUser?.email || null;
      
      unsubscribe = FirebaseService.onChatMessages(
        config.shareId,
        userEmail,
        isAdmin,
        (messages) => {
          const formattedMessages: ChatMessage[] = messages.map(msg => ({
            sender: msg.sender,
            content: msg.content,
            timestamp: msg.timestamp,
            userName: msg.userName,
            userEmail: msg.userEmail,
            photoURL: msg.photoURL
          }));
    
          setHumanMessages(formattedMessages);
        }
      );
    };
    
    loadChatMessages();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser?.email, config.shareId, userState]);

  // Mark messages as read when viewing chat
  useEffect(() => {
    const markMessagesRead = async () => {
      if (
        activeChat === 'human' && 
        currentUser?.email && 
        config.shareId
      ) {
        await FirebaseService.markMessagesAsRead(config.shareId, currentUser.email);
      }
    };

    markMessagesRead();
  }, [activeChat, currentUser, config.shareId, humanMessages]);

  const handleBotMessage = async (message: string) => {
    // Don't process if it's the same message
    if (message === lastProcessedMessageRef.current) return;
    
    setIsStreaming(true);
    setError(null);
    lastProcessedMessageRef.current = message;
  
    try {
      let messageStarted = false;
  
      await vacChat({
        userMessage: message,
        chatHistory: botMessages.map(msg => ({
          name: msg.sender === 'user' ? 'Human' : 'AI',
          content: msg.content,
        })),
        humanChatHistory: humanMessages.map(msg => ({
          name: msg.sender === 'admin' ? 'Admin' : 'Receiver',
          content: msg.content,
        })),
        onBotMessage: (response) => {
          messageStarted = true;
          // Append new content to current message instead of replacing
          currentMessageRef.current += response.content;
          
          setBotMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length > 0) {
              // Update the last message with accumulated content
              newMessages[newMessages.length - 1] = {
                ...newMessages[newMessages.length - 1],
                content: currentMessageRef.current
              };
            }
            return newMessages;
          });
        },
        apiEndpoint: '/vac/streaming/emissary',
        instructions: initialInstructions,
        documents: initialDocuments,
        emissaryConfig: config
      });
  
      setIsStreaming(false);
    } catch (err) {
      console.error('Error in VacChat:', err);
      setError('Error fetching response from bot');
      setBotMessages(prev => prev.slice(0, -1));
      setIsStreaming(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
  
    if (activeChat === 'bot' && !isStreaming) {
      const userMessage: ChatMessage = {
        sender: 'user',
        content: input,
        timestamp: Date.now(),
        userName: currentUser?.displayName || 'Anonymous',
        photoURL: currentUser?.photoURL || undefined
      };
      
      setBotMessages(prev => [...prev, userMessage]);
      setInput('');
      
      // Start streaming with slight delay to ensure user message renders
      setTimeout(async () => {
        setBotMessages(prev => [...prev, {
          sender: 'bot',
          content: '',
          timestamp: Date.now(),
          userName: botName,
          photoURL: botAvatar
        }]);
        
        await handleBotMessage(userMessage.content);
      }, 50);
      
    } else if (config.shareId) {
      if (!currentUser?.email) {
        toast({
          title: "Error",
          description: "Please log in to send messages",
          variant: "destructive"
        });
        return;
      }
  
      try {
        const chatMessage: Omit<ChatMessage, 'timestamp'> = {
          sender: userState === 'admin' ? 'admin' : 'receiver',
          content: input,
          userName: currentUser.displayName || 'Anonymous',
          userEmail: currentUser.email,
          photoURL: currentUser.photoURL || undefined,
          read: false
        };
  
        await FirebaseService.addChatMessage(config.shareId, chatMessage);
        setInput('');
      } catch (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive"
        });
      }
    }
  };

  const renderHumanMessages = () => {
    return humanMessages.map(message => ({
      ...message,
      sender: message.sender as Role
    }));
  };

  const [throttledBotMessages, resetThrottledMessages] = useThrottledMessages(
    botMessages,
    isStreaming,
    {
      wordsPerSecond: 20, // Adjust this value to control speed
      minDelay: 10,      // Minimum delay between chunks in ms
      maxDelay: 150      // Maximum delay between chunks in ms
    }
  );

return (
  <div className="relative flex-1 overflow-hidden">
    <div className="absolute inset-0">
      {(() => {
        const view = viewType as ChatInterfaceType;
        return view === 'unified' ? (
          <UnifiedChatInterface
          botMessages={throttledBotMessages}
          humanMessages={humanMessages}
          input={input}
          botName={botName}
          botAvatar={botAvatar}
          recipientName={recipientName}
          senderName={senderName}
          userState={userState}
          onInputChange={setInput}
          onSendMessage={handleSendMessage}
          onLogin={() => setShowLoginDialog(true)}
          isStreaming={isStreaming}
          error={error}
          activeChat={activeChat}
          setActiveChat={setActiveChat}
          footer={
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
              <span>Split</span>
              <Switch
                checked={viewType === 'unified'}
                onCheckedChange={handleViewChange}
                className="scale-75"
              />
              <span>Unified</span>
            </div>
          }
          />
        ) : (
          <ChatInterfaceSplit
            botMessages={throttledBotMessages}
            humanMessages={renderHumanMessages()}
            input={input}
            activeChat={activeChat}
            botName={botName}
            botAvatar={botAvatar}
            recipientName={recipientName}
            senderName={senderName}
            userState={userState}
            onInputChange={setInput}
            onSendMessage={handleSendMessage}
            onLogin={() => setShowLoginDialog(true)}
            setActiveChat={setActiveChat}
            isStreaming={isStreaming}
            error={error}
            footer={
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                <span>Split</span>
                <Switch
                  checked={viewType === 'unified'}
                  onCheckedChange={handleViewChange}
                  className="scale-75"
                />
                <span>Unified</span>
              </div>
            }
          />
        );
      })()}
    </div>

    <LoginDialog 
      open={showLoginDialog} 
      onOpenChange={setShowLoginDialog} 
    />
  </div>
);
}