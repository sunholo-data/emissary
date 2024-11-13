// src/components/Emissary.tsx
"use client"
import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import ChatInterface from "@/components/ChatInterface";
import LoginDialog from "@/components/LoginDialog";
import type { Message, Document, Role, ChatMessage, EmissaryConfigState } from '@/types';
import FirebaseService from '@/lib/firebase';
import { useToast } from "@/components/hooks/use-toast";

type UserState = 'not-logged-in' | 'receiver' | 'admin';

export type EmissaryProps = {
  senderName?: string;
  recipientName?: string;
  botName?: string;
  botAvatar?: string;
  initialMessage?: string;
  initialDocuments?: Document[];
  initialInstructions?: string;
  adminEmail?: string;
  shareId: string;  // Added this
  userState: UserState;
  currentUser: User | null;
  showLoginDialog: boolean;
  setShowLoginDialog: (show: boolean) => void;
  handleLogout: () => Promise<void>;
};

export default function Emissary({
  senderName = "John Doe",
  recipientName = "Jane Smith",
  botName = "Hermes",
  botAvatar = "/placeholder.svg?height=40&width=40",
  initialMessage = "Hello! I have an important message for you.",
  initialDocuments = [],
  initialInstructions = "Default instructions for the Emissary.",
  shareId,  // Required in props but might be empty in config initially
  userState,
  currentUser,
  showLoginDialog,
  setShowLoginDialog
}: EmissaryProps) {
  const [botMessages, setBotMessages] = useState<Message[]>([{ sender: 'bot', content: initialMessage }]);
  const [humanMessages, setHumanMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [activeChat, setActiveChat] = useState<'bot' | 'human'>('bot');
  const [userMessage, setUserMessage] = useState<string | null>(null);
  const [config, setConfig] = useState<EmissaryConfigState>({
    botId: '',
    botName,
    botAvatar,
    senderName,
    recipientName,
    initialDocuments,
    adminEmail: '',
    initialMessage,
    initialInstructions
  });
  const { toast } = useToast();

  // Update config when shareId prop changes
  useEffect(() => {
    if (shareId) {
      setConfig(prev => ({
        ...prev,
        shareId
      }));
    }
  }, [shareId]);

    // Update config when user state changes
    useEffect(() => {
      if (currentUser) {
        setConfig(prev => ({
          ...prev,
          adminEmail: currentUser.email || '',
          senderName: currentUser.displayName || 'Anonymous'
        }));
      }
    }, [currentUser]);

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
            const formattedMessages: Message[] = messages.map(msg => ({
              sender: msg.sender,
              content: msg.content,
              timestamp: new Date(msg.timestamp).toISOString(),
              userName: msg.userName,
              userEmail: msg.userEmail,
              photoURL: msg.photoURL  // Use the photoURL from the message itself
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

    const handleSendMessage = async () => {
      if (!input.trim()) return;
    
      if (activeChat === 'bot') {
        // Bot chat - allow anyone to send messages
        setBotMessages(prev => [
          ...prev, 
          { 
            sender: 'user', 
            content: input,
            timestamp: new Date().toISOString(),
            // For bot chat, we can still use current user's info if available
            userName: currentUser?.displayName || 'Anonymous',
            photoURL: currentUser?.photoURL || undefined
          },
          { 
            sender: 'bot', 
            content: '',
            timestamp: new Date().toISOString(),
            userName: botName,
            photoURL: botAvatar
          }
        ]);
        setUserMessage(input);
      } else if (config.shareId) {
        // Human chat - require login
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
        } catch (error) {
          console.error('Error sending message:', error);
          toast({
            title: "Error",
            description: "Failed to send message",
            variant: "destructive"
          });
        }
      }
      
      setInput('');
    };

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

  const renderHumanMessages = () => {
    return humanMessages.map(message => ({
      ...message,
      sender: message.sender as Role 
    }));
  };

  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="absolute inset-0">
        <ChatInterface
          botMessages={botMessages}
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
          setBotMessages={setBotMessages}
          apiEndpoint="/vac/streaming/emissary"
          userMessage={activeChat === 'bot' ? userMessage : null}
          instructions={initialInstructions}
          documents={initialDocuments}
        />
      </div>

      <LoginDialog 
        open={showLoginDialog} 
        onOpenChange={setShowLoginDialog} 
      />
    </div>
  );
}