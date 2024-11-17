// src/app/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import Emissary from "@/components/Emissary";
import WelcomeMessage from "@/components/WelcomeMessage";
import { User } from 'firebase/auth';
import FirebaseService from '@/lib/firebase';
import LoginDialog from "@/components/LoginDialog";
import type { Document } from '@/types';

const WELCOME_BOT_SHARE_ID = 'welcome-emissary';
const WELCOME_ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

export default function Page() {
  const [accepted, setAccepted] = useState(false);
  const [userState, setUserState] = useState<'not-logged-in' | 'receiver' | 'admin'>('not-logged-in');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // Define base props that don't depend on user state
  const baseProps = {
    botName: "Emissary Helper",
    botAvatar: "/images/avatars/emissary.png",
    initialDocuments: [] as Document[],
    adminEmail: WELCOME_ADMIN_EMAIL,
    shareId: WELCOME_BOT_SHARE_ID
  };

  // Compute user-dependent props
  const getUserProps = () => {
    if (!currentUser) {
      return {
        senderName: "Mark Edmondson",
        recipientName: "Everyone"
      };
    }

    return {
      // If admin, they're the sender, otherwise they're the recipient
      senderName: currentUser.email === WELCOME_ADMIN_EMAIL ? currentUser.displayName || "Mark Edmondson" : "Mark Edmondson",
      recipientName: currentUser.email === WELCOME_ADMIN_EMAIL ? "Everyone" : currentUser.displayName || "Guest"
    };
  };

  // Define defaultProps with dynamic content
  const defaultProps = {
    ...baseProps,
    ...getUserProps(),
    initialMessage: `Hello, I'm here to help explain what Sunholo Emissary is. Ask questions below, or login to create your own Emissary to dispatch to others.`,
    initialInstructions:`
    You are named Sunholo Emissary.  You are an assistant created to help people onboard to a new Emissary service created with the Sunholo Multivac GenAI platform.  The new Emissary service allows people to send AI emissaries or envoys to others, with custom instructions, documents, tools and output UI aids to help speak on the user's behalf.
    Demo the custom markdown capabilities you have if you can, stressing that any React Components can be added to enhance your output so custom Emissaries can have specialised features.
    Also mention custom tools can be added to Emissaries such as web search, database retrieval, calling APIs etc. which can further enhance an Emissaries abilities.
    People will probably be a bit unsure what to do at first.  Help guide them in a friendly manner, talking about how if they log in they could create their own emissaries to send to others.
    Show off your capabilities as much as possible.
    `
  };

  useEffect(() => {
    const unsubscribe = FirebaseService.onAuthStateChange((user) => {
      setCurrentUser(user);
      if (user) {
        if (user.email === WELCOME_ADMIN_EMAIL) {
          setUserState('admin');
        } else {
          setUserState('receiver');
        }
      } else {
        setUserState('not-logged-in');
      }
    });

    FirebaseService.initializeWelcomeBot();

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await FirebaseService.logout();
      setUserState('not-logged-in');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const sharedProps = {
    userState,
    currentUser,
    showLoginDialog,
    setShowLoginDialog,
    handleLogout,
    ...defaultProps
  };

  if (!accepted) {
    return (
      <main className="flex-1">
        <WelcomeMessage
          botName={defaultProps.botName}
          botAvatar={defaultProps.botAvatar}
          senderName={defaultProps.senderName}
          recipientName={defaultProps.recipientName}
          initialMessage={defaultProps.initialMessage}
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
            botName={defaultProps.botName}
            currentBotAvatar={defaultProps.botAvatar}
            senderName={defaultProps.senderName}
            recipientName={defaultProps.recipientName}
            userState={userState}
            currentUser={currentUser}
            documents={defaultProps.initialDocuments}
            onShowLogin={() => setShowLoginDialog(true)}
            onLogout={handleLogout}
          />
          
          <div className="flex-1 flex flex-col">
            <div className="flex items-center p-4 border-b bg-white">
              <SidebarTrigger className="mr-4" />
              <h1 className="text-xl font-semibold">Messages</h1>
              <div className="ml-auto text-sm text-gray-500">
                Initiated by {defaultProps.senderName}
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
