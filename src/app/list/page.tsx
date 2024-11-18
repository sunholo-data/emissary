"use client";

import { useState, useEffect, useRef } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmissaryList } from '@/components/EmissaryList';
import FirebaseService from '@/lib/firebase';
import LoginDialog from "@/components/LoginDialog";
import { Button } from "@/components/ui/button";
import type { User } from 'firebase/auth';
import type { UserBot } from '@/lib/firebase';
import type { UserState } from '@/types';

export default function EmissaryListPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userBots, setUserBots] = useState<UserBot[]>([]);
  const [userState, setUserState] = useState<UserState>('not-logged-in');
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = FirebaseService.onAuthStateChange((user) => {
      setCurrentUser(user);
      if (user) {
        setUserState(user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'admin' : 'receiver');
      } else {
        setUserState('not-logged-in');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadUserBots = async () => {
      if (!currentUser) return;
      try {
        const bots = await FirebaseService.getUserBots(currentUser.uid);
        
        // If user is admin, fetch and add the welcome bot
        if (currentUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
          try {
            const welcomeBot = await FirebaseService.getWelcomeBot();
            if (welcomeBot) {
              const welcomeBotExists = bots.some(bot => bot.shareId === 'welcome-emissary');
              if (!welcomeBotExists) {
                bots.unshift({
                  ...welcomeBot,
                  shareId: 'welcome-emissary',
                  botId: 'welcome-emissary',
                  botName: 'Emissary Helper',
                  botAvatar: '/images/avatars/emissary.png',
                  recipientName: 'Everyone',
                  adminEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
                  updatedAt: new Date(),
                  lastAccessedAt: new Date(),
                  shareUrl: `${window.location.origin}`,
                  createdAt: new Date(),
                  usageCount: 0,
                  initialDocuments: welcomeBot.initialDocuments || []
                });
              }
            }
          } catch (error) {
            console.error('Error loading welcome bot:', error);
          }
        }
        
        setUserBots(bots);
      } catch (error) {
        console.error('Error loading user bots:', error);
      }
    };

    loadUserBots();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await FirebaseService.logout();
      setUserState('not-logged-in');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleViewBot = (bot: UserBot) => {
    window.open(bot.shareUrl, '_blank');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarProvider>
        <AppSidebar
          botName=""
          currentBotAvatar=""
          senderName={currentUser?.displayName || ''}
          recipientName=""
          userState={userState}
          currentUser={currentUser}
          documents={[]}
          onShowLogin={() => setShowLoginDialog(true)}
          onLogout={handleLogout}
          isAdminPage={false}
          onFileUpload={() => {}}
          onDeleteDocument={() => {}}
          isUploading={false}
          fileInputRef={fileInputRef}
        />

        <div className="flex-1 p-6">
          {!currentUser ? (
            <Card>
              <CardHeader>
                <CardTitle>Login Access Required</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 mb-4">
                  You need to be logged in to view your emissary dispatches.
                </p>
                <Button onClick={() => setShowLoginDialog(true)}>
                  Login to Continue
                </Button>
              </CardContent>
            </Card>
          ) : (
            <EmissaryList 
              bots={userBots}
              showEditButton={false}
              onView={handleViewBot}
            />
          )}
        </div>

        <LoginDialog 
          open={showLoginDialog} 
          onOpenChange={setShowLoginDialog} 
        />
      </SidebarProvider>
    </div>
  );
}