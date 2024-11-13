//src/app/admin/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DocumentHandler } from '@/lib/document-handler';
import { AppSidebar } from "@/components/app-sidebar";
import LoginDialog from "@/components/LoginDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ConfigProps, Document, UserState } from '@/types';
import type { User } from 'firebase/auth';
import FirebaseService, { BotConfig, UserBot } from '@/lib/firebase';
import StorageService from '@/lib/storage';
import { useToast } from "@/components/hooks/use-toast";
import { DocumentUpload } from '@/components/DocumentUpload';
import { useAlertDialog } from "@/components/hooks/use-alert-dialog"
import { SuccessDialog } from '@/components/SuccessDialog';
import { formatFileSize, calculateTotalSize } from '@/lib/utils';

export default function AdminPage() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [availableTemplates, setAvailableTemplates] = useState<BotConfig[]>([]);
    const [userBots, setUserBots] = useState<UserBot[]>([]);
    const [config, setConfig] = useState<Partial<ConfigProps & { botId: string }>>({
      initialDocuments: [],
    });
    const [shareUrl, setShareUrl] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [userState, setUserState] = useState<UserState>('not-logged-in');
    const [editingBot, setEditingBot] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [successDialog, setSuccessDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        shareUrl?: string;
      }>({
        isOpen: false,
        title: '',
        message: '',
      });

    const { toast } = useToast();
    const { show } = useAlertDialog(); 

    // Load user's existing bots
    useEffect(() => {
        const loadUserBots = async () => {
            if (!currentUser) return;
            try {
                const bots = await FirebaseService.getUserBots(currentUser.uid);
                setUserBots(bots);
            } catch (error) {
                console.error('Error loading user bots:', error);
            }
        };

        loadUserBots();
    }, [currentUser]);

   // Add effect to load bot templates
    useEffect(() => {
        const loadBotTemplates = async () => {
            try {
                const templates = await FirebaseService.getTemplateBots();
                setAvailableTemplates(templates);
                
                if (templates.length > 0 && !editingBot) {
                    const firstTemplate = templates[0];
                    setSelectedTemplate(firstTemplate.botId);
                    setConfig(prev => ({
                        ...prev,
                        botId: firstTemplate.botId,
                        botName: firstTemplate.name,
                        botAvatar: firstTemplate.avatar,
                        initialMessage: firstTemplate.defaultMessage,
                        initialInstructions: firstTemplate.defaultInstructions
                    }));
                }
            } catch (error) {
                console.error('Error loading bot templates:', error);
            }
        };

        loadBotTemplates();
    }, [editingBot]);

  useEffect(() => {
    const unsubscribe = FirebaseService.onAuthStateChange((user) => {
      setCurrentUser(user);
      if (user) {
        setUserState(user.email === config.adminEmail ? 'admin' : 'receiver');
        setConfig(prev => ({
          ...prev,
          senderName: user.displayName || 'Anonymous',
          adminEmail: user.email || undefined
        }));
      } else {
        setUserState('not-logged-in');
      }
    });

    return () => unsubscribe();
  }, [config.adminEmail]);

  const handleBotTemplateChange = async (templateId: string) => {
    setSelectedTemplate(templateId);
    setShareUrl('');
    
    if (templateId === 'custom') {
        setConfig(prev => ({
            ...prev,
            botId: '',
            botName: '',
            botAvatar: '',
            initialMessage: '',
            initialInstructions: '',
            initialDocuments: []
        }));
    } else {
        try {
            const template = availableTemplates.find(t => t.botId === templateId);
            if (!template) throw new Error('Template not found');

            setConfig(prev => ({
                ...prev,
                botId: template.botId,
                botName: template.name,
                botAvatar: template.avatar,
                initialMessage: template.defaultMessage,
                initialInstructions: template.defaultInstructions,
                initialDocuments: []
            }));
        } catch (error) {
            console.error('Error loading template:', error);
            toast({
                title: "Error loading template",
                description: error instanceof Error ? error.message : "Unknown error",
                variant: "destructive"
            });
        }
    }
};

  const handleEditBot = async (bot: UserBot) => {
    setEditingBot(bot.shareId);
    setSelectedTemplate('custom');
    setConfig({
      ...bot,
      botId: bot.botId,
      // Ensure we have a valid Document array
      initialDocuments: (bot.initialDocuments || []).filter((doc): doc is Document => doc !== undefined)
    });
    setShareUrl(bot.shareUrl);
  };

  const handleUpdateBot = async () => {
    if (!editingBot || !currentUser) return;

    try {
        setIsCreating(true);
        
        // Create a clean update object without Date objects
        const updateConfig = {
            botId: config.botId!,
            botName: config.botName,
            botAvatar: config.botAvatar,
            senderName: currentUser.displayName || 'Anonymous',
            recipientName: config.recipientName,
            adminEmail: currentUser.email!,
            initialMessage: config.initialMessage,
            initialInstructions: config.initialInstructions,
            initialDocuments: config.initialDocuments || []
        };

        await FirebaseService.updateShareConfig(currentUser.uid, editingBot, updateConfig);

        // Refresh user's bots
        const updatedBots = await FirebaseService.getUserBots(currentUser.uid);
        setUserBots(updatedBots);
        
        setEditingBot(null);
        setSuccessDialog({
            isOpen: true,
            title: 'Success',
            message: `${config.botName} updated successfully`,
            shareUrl: shareUrl // Use the existing shareUrl from state
          });

    } catch (error) {
        console.error('Error updating bot:', error);
        show({
            title: 'Error',
            message: error instanceof Error ? error.message : 'An unknown error occurred',
            confirmText: 'OK'
        });

    } finally {
        setIsCreating(false);
    }
};

const handleCreateShare = async () => {
  try {
      setIsCreating(true);
      
      if (!currentUser) {
          throw new Error('Must be logged in to create shares');
      }

      const canCreate = await FirebaseService.canCreateShare(currentUser.uid);
      if (!canCreate) {
          throw new Error('You have reached your share limit. Please upgrade your plan.');
      }

      if (!config.botName || !config.recipientName || !config.adminEmail) {
          throw new Error('Please fill in all required fields');
      }

      // For custom bots, create a new bot config first
      let finalBotId: string;
      if (selectedTemplate === 'custom') {
          if (!config.initialMessage || !config.initialInstructions) {
              throw new Error('Please fill in message and instructions for custom bot');
          }
          
          finalBotId = await FirebaseService.createBotConfig({
              name: config.botName,
              avatar: config.botAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(config.botName)}`,
              defaultMessage: config.initialMessage,
              defaultInstructions: config.initialInstructions,
              isTemplate: false
          });
      } else {
          if (!config.botId) {
              throw new Error('No bot template selected');
          }
          finalBotId = config.botId;
      }

      // Create the share config
      const shareConfig = {
          botId: finalBotId,
          botName: config.botName,
          senderName: currentUser.displayName || 'Anonymous',
          recipientName: config.recipientName,
          adminEmail: currentUser.email!,
          initialDocuments: config.initialDocuments || [],
          initialMessage: config.initialMessage,
          initialInstructions: config.initialInstructions
      };

      const shareId = await FirebaseService.createShareConfig(currentUser.uid, shareConfig);
      const newShareUrl = `${window.location.origin}/${currentUser.uid}/${shareId}`;
      setShareUrl(newShareUrl);

      // Refresh user's bots and switch to edit mode
      const updatedBots = await FirebaseService.getUserBots(currentUser.uid);
      setUserBots(updatedBots);
      
      // Find the newly created bot
      const newBot = updatedBots.find(bot => bot.shareId === shareId);
      if (newBot) {
          // Switch to edit mode
          setEditingBot(shareId);
          setConfig(prev => ({
              ...prev,
              ...newBot,
              botId: finalBotId,
              initialDocuments: (newBot.initialDocuments || []).filter((doc): doc is Document => doc !== undefined)
          }));
      }

      // Show success message
      setSuccessDialog({
          isOpen: true,
          title: 'Success',
          message: 'Emissary created successfully. You can now upload documents.',
          shareUrl: newShareUrl
      });

  } catch (error) {
      console.error('Error creating share:', error);
      toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to create share",
          variant: "destructive"
      });
  } finally {
      setIsCreating(false);
  }
};
  

  // Handle document deletion
  const handleDeleteDocument = async (index: number) => {
    if (!currentUser || !editingBot) return;
  
    const documentToDelete = config.initialDocuments?.[index];
    if (!documentToDelete?.storagePath) return;
  
    try {
      // First update the config to remove the document reference
      const updatedDocuments = (config.initialDocuments || [])
        .filter((_, i) => i !== index)
        .filter((doc): doc is Document => doc !== undefined);
  
      // Create a clean update object without Date objects
      const updateConfig = {
        botId: config.botId!,
        botName: config.botName,
        botAvatar: config.botAvatar,
        senderName: currentUser.displayName || 'Anonymous',
        recipientName: config.recipientName,
        adminEmail: currentUser.email!,
        initialMessage: config.initialMessage,
        initialInstructions: config.initialInstructions,
        initialDocuments: updatedDocuments,
        updatedAt: new Date().toISOString()
      };
  
      // Update the database first
      await FirebaseService.updateShareConfig(currentUser.uid, editingBot, updateConfig);
  
      // Then try to delete the file
      try {
        await StorageService.deleteDocument(documentToDelete.storagePath);
      } catch (error) {
        console.warn('File not found in storage:', documentToDelete.storagePath);
        // Continue execution since we've already updated the config
      }
  
      // Update local state
      setConfig(prev => ({
        ...prev,
        initialDocuments: updatedDocuments
      }));
  
      toast({
        title: "Success",
        description: "Document removed successfully"
      });
    } catch (error) {
      console.error('Error updating document configuration:', error);
      toast({
        title: "Error",
        description: "Failed to update document configuration",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    try {
      await FirebaseService.logout();
      setUserState('not-logged-in');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

// Simplify handleFileUpload
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  if (!currentUser) {
      toast({
          title: "Error",
          description: "Please log in to upload files",
          variant: "destructive"
      });
      return;
  }

  // Only allow uploads when editing or after share is created
  const shareId = editingBot || shareUrl.split('/').pop();
  if (!shareId) {
      toast({
          title: "Error",
          description: "Please create the dispatch first before uploading documents",
          variant: "destructive"
      });
      return;
  }

  setIsUploading(true);
  try {
      const document = await DocumentHandler.handleFileUpload(event, {
          userId: currentUser.uid,
          shareId,
          currentDocuments: config.initialDocuments || [],
      });

      if (document) {
          const updatedDocuments = [...(config.initialDocuments || []), document];
          setConfig(prev => ({
              ...prev,
              initialDocuments: updatedDocuments
          }));

          if (editingBot) {
              await FirebaseService.updateShareConfig(currentUser.uid, editingBot, {
                  ...config,
                  initialDocuments: updatedDocuments
              });
          }
      }
  } catch (error) {
      console.error('Error uploading file:', error);
      toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to upload file",
          variant: "destructive"
      });
  } finally {
      setIsUploading(false);
      if (event.target) {
          event.target.value = '';
      }
  }
};

  return (
    <div className="flex min-h-screen bg-gray-50">
    <SuccessDialog
      isOpen={successDialog.isOpen}
      onClose={() => setSuccessDialog(prev => ({ ...prev, isOpen: false }))}
      title={successDialog.title}
      message={successDialog.message}
      shareUrl={successDialog.shareUrl}
    />
      <SidebarProvider>
      <AppSidebar
          botName={config.botName || ''}
          currentBotAvatar={config.botAvatar || ''}
          senderName={config.senderName || ''}
          recipientName={config.recipientName || ''}
          userState={userState}
          currentUser={currentUser}
          documents={config.initialDocuments || []}
          fileInputRef={fileInputRef}
          onShowLogin={() => setShowLoginDialog(true)}
          onLogout={handleLogout}
          onFileUpload={handleFileUpload}
          onDeleteDocument={handleDeleteDocument}
          isUploading={isUploading}
          isAdminPage={true}
          editingBotId={editingBot || undefined}
        />

        <div className="flex-1 p-6">
          {!currentUser ? (
            <Card>
              <CardHeader>
                <CardTitle>Login Access Required</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 mb-4">
                  You need to be logged in to create and manage emissary dispatches.
                </p>
                <Button onClick={() => setShowLoginDialog(true)}>
                  Login to Continue
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>{editingBot ? 'Edit Dispatch Configuration' : 'Create New Dispatch Configuration'}</CardTitle>
                </CardHeader>
                <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label>Select Emissary Template</Label>
                <Select
                    value={selectedTemplate}
                    onValueChange={handleBotTemplateChange}
                    >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a bot template" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                        <SelectLabel>Available Emissaries</SelectLabel>
                        {availableTemplates.map(template => (
                            <SelectItem key={template.botId} value={template.botId}>
                            {template.name} {template.isTemplate ? '- Template' : ''}
                            </SelectItem>
                        ))}
                        <SelectItem value="custom">Custom Emissary</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                    </Select>
              </div>
              <div className="grid gap-2">
                <Label>Current Emissary Avatar</Label>
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border">
                    {config.botAvatar ? (                       
                      <img
                        src={config.botAvatar}
                        alt={config.botName || 'Bot avatar'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.src = `https://ui-avatars.com/api/?name=${config.botName || 'Bot'}&background=random`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        {config.botName?.[0] || '?'}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{config.botName || 'Select a bot'}</p>
                    <p className="text-sm text-gray-500">
                      {selectedTemplate === 'custom' ? 'Custom Bot' : `${config.botName} Template`}
                    </p>
                  </div>
                </div>
              </div>

              {selectedTemplate === 'custom' && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="botName">Emissary Name</Label>
                    <Input
                      id="botName"
                      value={config.botName || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        botName: e.target.value
                      }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="botAvatar">Emissary Avatar URL</Label>
                    <Input
                      id="botAvatar"
                      value={config.botAvatar || ''}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        botAvatar: e.target.value
                      }))}
                    />
                  </div>
                </>
              )}

              <div className="grid gap-2">
                <Label htmlFor="recipientName">Recipient Name</Label>
                <Input
                  id="recipientName"
                  value={config.recipientName || ''}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    recipientName: e.target.value
                  }))}
                  placeholder="Client name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="initialMessage">Initial Message</Label>
                <Textarea
                  id="initialMessage"
                  value={config.initialMessage || ''}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    initialMessage: e.target.value
                  }))}
                  rows={4}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="initialInstructions">Emissary Instructions</Label>
                <Textarea
                  id="initialInstructions"
                  value={config.initialInstructions || ''}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    initialInstructions: e.target.value
                  }))}
                  rows={4}
                />
              </div>
              {(editingBot) ? (
                  <>
                    <div className="grid gap-2">
                      <DocumentUpload
                        documents={config.initialDocuments || []}
                        userId={currentUser?.uid}
                        shareId={editingBot || shareUrl.split('/').pop()}
                        onUpload={(doc: Document) => {
                          setConfig(prev => ({
                            ...prev,
                            initialDocuments: [...(prev.initialDocuments || []), doc]
                          }));
                        }}
                        onDelete={(index: number) => {
                          handleDeleteDocument(index);
                        }}
                        isUploading={isUploading}
                      />
                    </div>
                  </>
                ) : (
                  <div className="grid gap-2">
                    <Label>Documents</Label>
                    <div className="text-center p-6 border-2 border-dashed rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Create the emissary dispatch to enable document uploads.
                      </p>
                    </div>
                  </div>
                )}
            </div>
              <div className="mt-6">
                {editingBot ? (
                    <div className="flex gap-2">
                        <Button onClick={handleUpdateBot} disabled={isCreating}>
                            {isCreating ? 'Updating...' : 'Update Dispatch'}
                        </Button>
                        <Button variant="outline" onClick={() => {
                            setEditingBot(null);
                            setConfig({ initialDocuments: [] });
                            setShareUrl('');
                        }}>
                            Cancel Edit
                        </Button>
                    </div>
                ) : (
                    <Button onClick={handleCreateShare} disabled={isCreating}>
                        {isCreating ? 'Creating...' : 'Create Dispatch'}
                    </Button>
                )}
            </div>

            {shareUrl && (
                <div className="mt-4 space-y-2">
                    <Label>Share URL</Label>
                    <div className="flex gap-2">
                        <Input value={shareUrl} readOnly className="flex-1" />
                        <Button onClick={() => navigator.clipboard.writeText(shareUrl)}>
                            Copy
                        </Button>
                        <Button onClick={() => window.open(shareUrl, '_blank')}>
                            Visit
                        </Button>
                    </div>
                </div>
            )}
        </CardContent>
    </Card>

          <Card>
                    <CardHeader>
                        <CardTitle>Your Emissary Dispatches</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">Avatar</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Recipient</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Uses</TableHead>
                                <TableHead className="text-right">Documents</TableHead>
                                <TableHead className="text-right">Total Size</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {userBots.map((bot) => (
                                <TableRow key={bot.shareId}>
                                    <TableCell>
                                          <Avatar>
                                            <AvatarImage src={bot.botAvatar} alt={bot.botName} />
                                            <AvatarFallback>{bot.botName[0]}</AvatarFallback>
                                          </Avatar>
                                    </TableCell>
                                    <TableCell className="font-medium">{bot.botName}</TableCell>
                                    <TableCell>{bot.recipientName}</TableCell>
                                    <TableCell>
                                        {bot.createdAt instanceof Date 
                                            ? bot.createdAt.toLocaleDateString()
                                            : new Date(bot.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{bot.usageCount}</TableCell>
                                    <TableCell className="text-right">
                                        <TooltipProvider>
                                            <Tooltip>
                                            <TooltipTrigger className="cursor-help">
                                                {bot.initialDocuments?.length || 0}
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <div className="space-y-1">
                                                {bot.initialDocuments?.map((doc, index) => (
                                                    <div key={index} className="text-xs">
                                                    {doc.name} ({formatFileSize(doc.size)})
                                                    </div>
                                                ))}
                                                {(!bot.initialDocuments || bot.initialDocuments.length === 0) && (
                                                    <div className="text-xs">No documents</div>
                                                )}
                                                </div>
                                            </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatFileSize(calculateTotalSize(bot.initialDocuments))}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handleEditBot(bot)}
                                            >
                                                Upload & Edit
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => window.open(bot.shareUrl, '_blank')}
                                            >
                                                View
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                                ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                </Card>
                        </>
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