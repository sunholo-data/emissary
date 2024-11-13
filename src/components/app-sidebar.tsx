// src/components/app-sidebar.tsx

import { User } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import DocumentSidebar from "@/components/Documents";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Mail, User as UserIcon, Settings } from 'lucide-react';
import type { Document, UserState } from '@/types';
import Image from 'next/image';
import MultivacLogo from './MultivacLogo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AppSidebarProps {
  botName: string;
  currentBotAvatar: string;
  senderName: string;
  recipientName: string;
  userState: UserState;
  currentUser: User | null;
  documents: Document[];
  onShowLogin: () => void;
  onLogout: () => void;
  // Admin-specific props
  editingBotId?: string;              // Added to track which bot is being edited
  isAdminPage?: boolean;              // Flag to indicate if we're in admin context
  fileInputRef?: React.RefObject<HTMLInputElement>;
  onFileUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteDocument?: (index: number) => void;
  isUploading?: boolean; // Add this prop
}

function getUserDisplayName(user: User | null): string {
  if (!user) return 'User';
  return user.displayName || user.email?.split('@')[0] || 'User';
}

function getUserInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function AppSidebar({
  botName,
  currentBotAvatar,
  senderName,
  recipientName,
  userState,
  currentUser,
  documents,
  fileInputRef,
  onShowLogin,
  onLogout,
  onFileUpload,
  onDeleteDocument,
  editingBotId,
  isAdminPage = false,
  isUploading = false 
}: AppSidebarProps) {
  const pathname = usePathname();
  const displayName = getUserDisplayName(currentUser);
  const initials = getUserInitials(displayName);
  
  return (
    <Sidebar>
      <SidebarHeader>
        <a href="/">
          <Image 
            src="/images/logo/emissary.png" 
            alt="Sunholo Emissary" 
            width={200}
            height={50} 
            className="mb-4"
          />
        </a>
        <div className="flex items-center space-x-4 mb-4">
          <Avatar>
            <AvatarImage src={currentBotAvatar} alt={botName} />
            <AvatarFallback>{botName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{botName}</h3>
            <p className="text-sm text-muted-foreground">Your personal Emissary</p>
          </div>
        </div>
        {!isAdminPage && (
          userState !== 'not-logged-in' ? (
            <Link href="/admin" className="block w-full">
              <Button 
                variant="default" 
                className="w-full flex items-center justify-center gap-2 py-5"
              >
                <Settings size={16} />
                Create Emissary
              </Button>
            </Link>
          ) : (
            <Button 
              variant="default" 
              className="w-full flex items-center justify-center gap-2 py-5"
              onClick={onShowLogin}
            >
              <Settings size={16} />
              Log in to Create Emissary
            </Button>
          )
        )}
      </SidebarHeader>

      <SidebarContent className="mt-6">
        <SidebarGroup>
          <SidebarGroupLabel>Message Details</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Mail className="shrink-0" />
                  <span className="truncate">
                    <span className="font-medium">From:</span> {senderName}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <UserIcon className="shrink-0" />
                  <span className="truncate">
                    <span className="font-medium">To:</span> {recipientName}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Only show documents in non-admin mode */}
        {!isAdminPage && (
          <DocumentSidebar 
            documents={documents}
            userState={userState}
          />
        )}

      </SidebarContent>

      <SidebarFooter>
        {userState === 'not-logged-in' ? (
          <Button 
            variant="outline" 
            className="w-full mb-4" 
            onClick={onShowLogin}
          >
            Log In
          </Button>
        ) : (
          <div className="flex flex-col gap-2 p-4 border-t">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                {currentUser?.photoURL ? (
                  <AvatarImage 
                    src={currentUser.photoURL} 
                    alt={displayName}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <AvatarFallback>
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate">
                  {displayName}
                </span>
                <span className="text-sm text-muted-foreground truncate">
                  {currentUser?.email || ''}
                </span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onLogout}
              className="w-full"
            >
              Log Out
            </Button>
          </div>
        )}
        <MultivacLogo />
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
