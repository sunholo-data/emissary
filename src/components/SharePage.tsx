// src/components/SharePage.tsx
"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Emissary from "@/components/Emissary";
import WelcomeMessage from "@/components/WelcomeMessage";
import { User } from 'firebase/auth';
import FirebaseService from '@/lib/firebase';
import LoginDialog from "@/components/LoginDialog";
import type { ConfigProps, Document } from '@/types';

interface SharePageProps {
  config: ConfigProps;
}

export default function SharePage({ config }: SharePageProps) {
  const [accepted, setAccepted] = useState(false);
  const [userState, setUserState] = useState<'not-logged-in' | 'receiver' | 'admin'>('not-logged-in');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  
  // Memoize static config values
  const {
    botName,
    botAvatar,
    senderName,
    recipientName,
    initialMessage,
    initialInstructions,
    adminEmail,
    initialDocuments,
    shareId  // Add this
  } = useMemo(() => config, [config]);

  useEffect(() => {
    const unsubscribe = FirebaseService.onAuthStateChange((user) => {
      setCurrentUser(user);
      if (user) {
        setUserState(user.email === adminEmail ? 'admin' : 'receiver');
      } else {
        setUserState('not-logged-in');
      }
    });

    return () => unsubscribe();
  }, [adminEmail]);

  const handleLogout = useCallback(async () => {
    try {
      await FirebaseService.logout();
      setUserState('not-logged-in');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  // Memoize shared props
  const sharedProps = useMemo(() => ({
    userState,
    currentUser,
    showLoginDialog,
    setShowLoginDialog,
    handleLogout,
    adminEmail,
    initialDocuments,
    botName,
    botAvatar,
    senderName,
    recipientName,
    initialMessage,
    initialInstructions,
    shareId  // Add this
  }), [
    userState, 
    currentUser, 
    showLoginDialog, 
    handleLogout, 
    adminEmail,
    initialDocuments,
    botName,
    botAvatar,
    senderName,
    recipientName,
    initialMessage,
    initialInstructions,
    shareId  // Add this
  ]);

  if (!accepted) {
    return (
      <main className="flex-1">
        <WelcomeMessage
          botName={botName || "Emissary"}
          botAvatar={botAvatar || "/images/avatars/emissary.png"}
          senderName={senderName || "Multivac"}
          recipientName={recipientName || "User"}
          initialMessage={initialMessage}
          onAccept={() => setAccepted(true)}
        />
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProvider>
        <div className="flex flex-1">
          <AppSidebar
            botName={botName}
            currentBotAvatar={botAvatar}
            senderName={senderName}
            recipientName={recipientName}
            userState={userState}
            currentUser={currentUser}
            documents={initialDocuments}
            onShowLogin={() => setShowLoginDialog(true)}
            onLogout={handleLogout}
          />
          
          <div className="flex-1 flex flex-col">
            <div className="flex items-center p-4 border-b bg-white">
              <SidebarTrigger className="mr-4" />
              <h1 className="text-xl font-semibold">Messages</h1>
              <div className="ml-auto text-sm text-gray-500">
                Initiated by {senderName}
              </div>
            </div>
            
            <main className="flex-1 p-6 overflow-hidden">
              <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 h-full overflow-hidden flex flex-col">
                <Emissary {...sharedProps} />
              </div>
            </main>
          </div>
        </div>

        <LoginDialog 
          open={showLoginDialog} 
          onOpenChange={setShowLoginDialog} 
        />
      </SidebarProvider>
    </div>
  );
}