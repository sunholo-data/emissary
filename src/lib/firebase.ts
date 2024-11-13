// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  connectAuthEmulator,
  signInWithEmailAndPassword, 
  signInWithPopup,
  GithubAuthProvider,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
  UserCredential
} from 'firebase/auth';
import { 
    getFirestore, 
    connectFirestoreEmulator,
    doc, 
    getDoc, 
    setDoc, 
    addDoc,
    deleteDoc,
    updateDoc,
    writeBatch,
    collection,
    CollectionReference,
    query,
    where,
    getDocs,
    increment,
    serverTimestamp,
    orderBy,
    onSnapshot,
    Firestore
  } from 'firebase/firestore';
import type { ConfigProps, Document, ChatMessage, ShareConfig } from '@/types';

// define all interfaces at the top
interface MessageFilter {
    userEmail: string | null;
    isAdmin: boolean;
    shareId: string;
  }

  export interface BotConfig {
    botId: string;
    name: string;
    avatar: string;
    defaultMessage: string;
    defaultInstructions: string;
    createdAt: number;
    updatedAt: number;
    isTemplate: boolean;
  }

  // all bots a user has access to
  export interface UserBot {
    shareId: string;
    botId: string;
    botName: string;
    botAvatar: string;
    recipientName: string;
    adminEmail: string;
    initialMessage?: string;
    initialInstructions?: string;
    initialDocuments: Document[];
    createdAt: Date;
    updatedAt: Date;
    shareUrl: string;
    usageCount: number;
    lastAccessedAt: Date;
  }
  
  export interface ShareMetadata {
    createdBy: string;
    createdAt: number;
    updatedAt: number;
    isActive: boolean;
    planTier: 'free' | 'basic' | 'premium';
    usageCount: number;
    lastAccessedAt: number;
  }



// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};



// Debug logging
console.log('Firebase Config Environment Variables:', {
  apiKey: firebaseConfig.apiKey ? 'Set' : 'Not Set',
  authDomain: firebaseConfig.authDomain ? 'Set' : 'Not Set',
  projectId: firebaseConfig.projectId ? 'Set' : 'Not Set',
  storageBucket: firebaseConfig.storageBucket ? 'Set' : 'Not Set',
  messagingSenderId: firebaseConfig.messagingSenderId ? 'Set' : 'Not Set',
  appId: firebaseConfig.appId ? 'Set' : 'Not Set'
});

export function initFirebase() {
  let app;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    
    // Connect to emulators immediately after app initialization
    // but only in the browser
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
      // Initialize Auth and connect to emulator
      const auth = getAuth(app);
      connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
      
      // Initialize Firestore and connect to emulator
      const db = getFirestore(app);
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
    }
  } else {
    app = getApp();
  }

  return app;
}

  class FirebaseService {
    private static app = typeof window !== 'undefined' ? initFirebase() : null;
    private static _auth: Auth | null = null;
    private static _db: Firestore | null = null;
    private static _googleProvider: GoogleAuthProvider | null = null;
    private static _githubProvider: GoogleAuthProvider | null = null;
  
    private static initialize() {
      if (typeof window === 'undefined') {
        throw new Error('Firebase can only be initialized in the browser');
      }
  
      if (!this.app) {
        this.app = initFirebase();
      }
  
      if (!this._auth) {
        this._auth = getAuth(this.app);
      }
  
      if (!this._db) {
        this._db = getFirestore(this.app);
      }
  
      if (!this._googleProvider) {
        this._googleProvider = new GoogleAuthProvider();
      }
  
      if (!this._githubProvider) {
        this._githubProvider = new GithubAuthProvider();
      }
    }
  
    private static get db() {
      if (!this._db) {
        this.initialize();
      }
      return this._db!;
    }
  
    static get auth() {
      if (!this._auth) {
        this.initialize();
      }
      return this._auth!;
    }
  
    private static get googleProvider() {
      if (!this._googleProvider) {
        this.initialize();
      }
      return this._googleProvider!;
    }
  
    private static get githubProvider() {
      if (!this._githubProvider) {
        this.initialize();
      }
      return this._githubProvider!;
    }
  
    static async getCompleteShareConfig(userId: string, shareId: string): Promise<{
      share: ShareConfig;
      bot: BotConfig;
    } | null> {
      try {
        const shareRef = doc(this.db, 'userConfigs', userId, 'shares', shareId);
        const shareSnap = await getDoc(shareRef);
        
        if (!shareSnap.exists()) {
          return null;
        }
  
        const shareData = shareSnap.data() as ShareConfig;
        const botData = await this.getBotConfig(shareData.botId);
        
        if (!botData) {
          throw new Error('Bot configuration not found');
        }
  
        return {
          share: shareData,
          bot: botData
        };
      } catch (error: any) {
        this.handleError(error, 'Getting complete share config');
        throw error;
      }
    }

  private static handleError(error: any, context: string) {
    console.error(`${context} Error:`, error);
    throw new Error(`${context} failed: ${error.message}`);
  }

  // Authentication Methods
  private static handleAuthError(error: any) {
    console.error('Auth Error:', error);
    
    const errorMessages: { [key: string]: string } = {
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/popup-blocked': 'Please enable popups for this website.',
      'auth/popup-closed-by-user': 'Login was cancelled.',
      'auth/account-exists-with-different-credential': 
        'An account already exists with the same email address but different sign-in credentials.',
      'auth/network-request-failed': 'A network error occurred. Please try again.',
      'auth/too-many-requests': 'Too many unsuccessful login attempts. Please try again later.',
    };

    throw new Error(errorMessages[error.code] || 'An unexpected error occurred.');
  }

  static async loginWithEmail(email: string, password: string): Promise<UserCredential | null> {
    if (typeof window === 'undefined') return null;
    try {
      return await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error: any) {
      this.handleAuthError(error);
      return null;
    }
  }

  static async loginWithGoogle(): Promise<UserCredential | null> {
    if (typeof window === 'undefined') return null;
    try {
      this.googleProvider.setCustomParameters({ prompt: 'select_account' });
      return await signInWithPopup(this.auth, this.googleProvider);
    } catch (error: any) {
      this.handleAuthError(error);
      return null;
    }
  }

  static async loginWithGithub(): Promise<UserCredential | null> {
    if (typeof window === 'undefined') return null;
    try {
      this.githubProvider.setCustomParameters({ prompt: 'select_account' });
      return await signInWithPopup(this.auth, this.githubProvider);
    } catch (error: any) {
      this.handleAuthError(error);
      return null;
    }
  }

  static async logout(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      await signOut(this.auth);
    } catch (error: any) {
      this.handleAuthError(error);
    }
  }

  static onAuthStateChange(callback: (user: User | null) => void) {
    if (typeof window === 'undefined') return () => {};
    return onAuthStateChanged(this.auth, callback);
  }

  // Firestore Methods
  static async getConfigForUser(userId: string, shareId: string): Promise<ConfigProps> {
    if (typeof window === 'undefined') throw new Error('This method can only be used in the browser');
    try {
      // Use getCompleteShareConfig instead of direct access
      const completeConfig = await this.getCompleteShareConfig(userId, shareId);
      if (!completeConfig) {
        throw new Error('Configuration not found');
      }
      
      return this.toConfigProps(completeConfig.share, completeConfig.bot);
    } catch (error: any) {
      this.handleError(error, 'Getting config');
      throw error;
    }
  }

  static async createBotConfig(botConfig: Omit<BotConfig, 'botId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (typeof window === 'undefined') throw new Error('This method can only be used in the browser');
    try {
      const botId = crypto.randomUUID();
      const timestamp = Date.now();
      
      const fullConfig: BotConfig = {
        ...botConfig,
        botId,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      const botRef = doc(this.db, 'botConfigs', botId);
      await setDoc(botRef, fullConfig);
      
      return botId;
    } catch (error: any) {
      this.handleError(error, 'Creating bot config');
      throw error;
    }
  }

  static async getBotConfig(botId: string): Promise<BotConfig | null> {
    if (typeof window === 'undefined') throw new Error('This method can only be used in the browser');
    try {
      const botRef = doc(this.db, 'botConfigs', botId);
      const botSnap = await getDoc(botRef);
      
      return botSnap.exists() ? botSnap.data() as BotConfig : null;
    } catch (error: any) {
      this.handleError(error, 'Getting bot config');
      throw error;
    }
  }

  static async getTemplateBots(): Promise<BotConfig[]> {
    if (typeof window === 'undefined') throw new Error('This method can only be used in the browser');
    try {
      const templatesRef = collection(this.db, 'botConfigs');
      const q = query(templatesRef, where('isTemplate', '==', true));
      const templatesSnap = await getDocs(q);
      
      return templatesSnap.docs.map(doc => doc.data() as BotConfig);
    } catch (error: any) {
      this.handleError(error, 'Getting template bots');
      throw error;
    }
  }

  static async createShareConfig(userId: string, shareConfig: Omit<ShareConfig, 'shareId' | 'metadata'>): Promise<string> {
    if (typeof window === 'undefined') throw new Error('This method can only be used in the browser');
    try {
      const shareId = crypto.randomUUID();
      const timestamp = Date.now();
      
      // Create the full share config
      const fullConfig: ShareConfig = {
        ...shareConfig,
        shareId,
        metadata: {
          createdBy: userId,
          createdAt: timestamp,
          updatedAt: timestamp,
          isActive: true,
          planTier: 'free',
          usageCount: 0,
          lastAccessedAt: timestamp
        }
      };
  
      // Use a batch write to ensure all documents are created atomically
      const batch = writeBatch(this.db);
  
      // Add share document
      const shareRef = doc(this.db, 'userConfigs', userId, 'shares', shareId);
      batch.set(shareRef, fullConfig);
      
      // Update user's share count
      const userConfigRef = doc(this.db, 'userConfigs', userId);
      batch.set(userConfigRef, {
        userId,
        createdAt: timestamp,
        updatedAt: timestamp,
        shareCount: increment(1)
      }, { merge: true });
  
      // Create the chat document
      const chatRef = doc(this.db, 'chatMessages', shareId);
      batch.set(chatRef, {
        adminEmail: shareConfig.adminEmail,
        botId: shareConfig.botId,
        botName: shareConfig.botName || "Emissary Helper",
        initialDocuments: shareConfig.initialDocuments || [],
        metadata: {
          createdAt: timestamp,
          updatedAt: timestamp,
          isActive: true,
          planTier: 'free',
          usageCount: 0,
          lastAccessedAt: timestamp
        },
        senderName: shareConfig.senderName,
        recipientName: shareConfig.recipientName,
        initialMessage: shareConfig.initialMessage,
        initialInstructions: shareConfig.initialInstructions
      });
  
      // Commit the batch
      await batch.commit();
      
      return shareId;
    } catch (error: any) {
      this.handleError(error, 'Creating share config');
      throw error;
    }
  }

  static async updateShareConfig(userId: string, shareId: string, updates: Partial<ShareConfig>): Promise<void> {
    if (typeof window === 'undefined') throw new Error('This method can only be used in the browser');
    try {
      const shareRef = doc(this.db, 'userConfigs', userId, 'shares', shareId);
      await setDoc(shareRef, {
        ...updates,
        'metadata.updatedAt': Date.now()
      }, { merge: true });
    } catch (error: any) {
      this.handleError(error, 'Updating share config');
      throw error;
    }
  }

  static toConfigProps(share: ShareConfig, bot: BotConfig): ConfigProps {
    return {
      botId: share.botId,
      botName: bot.name,
      botAvatar: bot.avatar,
      senderName: share.senderName,
      recipientName: share.recipientName,
      initialDocuments: share.initialDocuments,
      adminEmail: share.adminEmail,
      initialMessage: share.initialMessage || bot.defaultMessage,
      initialInstructions: share.initialInstructions || bot.defaultInstructions,
      shareId: share.shareId
    };
  }

  // Usage tracking methods remain the same
  static async incrementShareUsage(userId: string, shareId: string): Promise<void> {
    if (typeof window === 'undefined') throw new Error('This method can only be used in the browser');
    try {
      const shareRef = doc(this.db, 'userConfigs', userId, 'shares', shareId);
      await updateDoc(shareRef, {
        'metadata.usageCount': increment(1),
        'metadata.lastAccessedAt': serverTimestamp()
      });
    } catch (error: any) {
      this.handleError(error, 'Updating share usage');
      throw error;
    }
  }

  static async getUserShareCount(userId: string): Promise<number> {
    if (typeof window === 'undefined') throw new Error('This method can only be used in the browser');
    try {
      const userConfigRef = doc(this.db, 'userConfigs', userId);
      const userConfig = await getDoc(userConfigRef);
      return userConfig.data()?.shareCount || 0;
    } catch (error: any) {
      this.handleError(error, 'Getting user share count');
      throw error;
    }
  }

  static async canCreateShare(userId: string): Promise<boolean> {
    return true; // To be implemented with plan limitations
  }

  static formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  static async getUserBots(userId: string): Promise<UserBot[]> {
    if (typeof window === 'undefined') throw new Error('This method can only be used in the browser');
    
    try {
      // Get all shares for the user
      const sharesRef = collection(this.db, 'userConfigs', userId, 'shares');
      const q = query(sharesRef, orderBy('metadata.createdAt', 'desc'));
      const sharesSnapshot = await getDocs(q);
      
      // Fetch all unique bot configs
      const botPromises = new Map<string, Promise<BotConfig | null>>();
      sharesSnapshot.docs.forEach(doc => {
        const shareData = doc.data() as ShareConfig;
        if (!botPromises.has(shareData.botId)) {
          botPromises.set(shareData.botId, this.getBotConfig(shareData.botId));
        }
      });
      
      const botConfigs = new Map<string, BotConfig>();
      await Promise.all(
        Array.from(botPromises.entries()).map(async ([botId, promise]) => {
          const config = await promise;
          if (config) {
            botConfigs.set(botId, config);
          }
        })
      );

      // Transform share documents into UserBot objects
      return sharesSnapshot.docs
        .map(doc => {
          const shareData = doc.data() as ShareConfig;
          const botConfig = botConfigs.get(shareData.botId);
          
          if (!botConfig) return null;

          // Make sure initialDocuments includes the size field
          const initialDocuments = shareData.initialDocuments?.map(doc => ({
            ...doc,
            size: doc.size || 0 // Provide a default if size doesn't exist
          })) || [];

          const userBot: UserBot = {
            shareId: shareData.shareId,
            botId: shareData.botId,
            botName: botConfig.name,
            botAvatar: botConfig.avatar,
            recipientName: shareData.recipientName,
            adminEmail: shareData.adminEmail,
            initialMessage: shareData.initialMessage || botConfig.defaultMessage,
            initialInstructions: shareData.initialInstructions || botConfig.defaultInstructions,
            initialDocuments: initialDocuments,
            createdAt: new Date(shareData.metadata.createdAt),
            updatedAt: new Date(shareData.metadata.updatedAt),
            shareUrl: `${window.location.origin}/${userId}/${shareData.shareId}`,
            usageCount: shareData.metadata.usageCount,
            lastAccessedAt: new Date(shareData.metadata.lastAccessedAt)
          };

          return userBot;
        })
        .filter((bot): bot is UserBot => bot !== null);
      
    } catch (error: any) {
      this.handleError(error, 'Getting user bots');
      throw error;
    }
  }

  // Get chat messages for a specific share
  // Get chat messages with role-based filtering
  static async getChatMessages(shareId: string, userEmail: string, isAdmin: boolean): Promise<ChatMessage[]> {
    if (typeof window === 'undefined') throw new Error('This method can only be used in the browser');
    
    try {
      const messagesRef = collection(this.db, 'chatMessages', shareId, 'messages');
      let q;

      if (isAdmin) {
        // Admins see all messages
        q = query(messagesRef, orderBy('timestamp', 'asc'));
      } else {
        // Non-admins only see their own messages and admin messages
        q = query(
          messagesRef,
          where('userEmail', 'in', [userEmail, 'm@sunholo.com']), // Replace with actual admin email
          orderBy('timestamp', 'asc')
        );
      }

      const messagesSnap = await getDocs(q);
      
      return messagesSnap.docs.map(doc => ({
        ...doc.data(),
        read: doc.data().read ?? false
      }) as ChatMessage);
    } catch (error: any) {
      this.handleError(error, 'Getting chat messages');
      throw error;
    }
  }

  private static async validateShareAccess(shareId: string): Promise<boolean> {
    try {
      // Get the current user
      const user = this.auth.currentUser;
      console.log('Current user:', {
        uid: user?.uid,
        email: user?.email,
        emailVerified: user?.emailVerified,
        isAnonymous: user?.isAnonymous
      });
      
      if (!user || !user.email) {
        console.error('No authenticated user or email');
        return false;
      }
  
      // Get all user shares that match the shareId
      const sharesRef = collection(this.db, 'userConfigs');
      const q = query(
        sharesRef,
        where('shares', 'array-contains', shareId)
      );
      
      const sharesSnap = await getDocs(q);
      console.log('Share lookup result:', {
        empty: sharesSnap.empty,
        size: sharesSnap.size
      });
      
      return !sharesSnap.empty;
    } catch (error) {
      console.error('Error validating share access:', error);
      return false;
    }
  }

  // Add a new message to the chat
  static async addChatMessage(shareId: string, message: Omit<ChatMessage, 'timestamp'>): Promise<void> {
    if (typeof window === 'undefined') throw new Error('This method can only be used in the browser');
    
    try {
      // Debug logging
      const user = this.auth.currentUser;
      console.log('Adding message - Debug info:', {
        shareId,
        messageContent: message.content,
        sender: message.sender,
        userEmail: message.userEmail,
        currentUser: {
          uid: user?.uid,
          email: user?.email,
          emailVerified: user?.emailVerified
        }
      });
  
      // Validate user is authenticated
      if (!user || !user.email) {
        throw new Error('No authenticated user found');
      }
  
      // Validate message has required fields
      if (!message.userEmail || !message.content || !message.sender) {
        throw new Error('Missing required message fields');
      }
  
      // Validate email matches current user
      if (message.userEmail !== user.email) {
        throw new Error('Message email does not match authenticated user');
      }
  
      const timestamp = Date.now();
      const messagesRef = collection(this.db, 'chatMessages', shareId, 'messages');
      
      // Create the message document
      const messageData = {
        content: message.content,
        userEmail: user.email, // Always use the authenticated user's email
        userName: message.userName || user.displayName || 'Anonymous',
        sender: message.sender,
        timestamp,
        read: false,
        photoURL: message.photoURL || user.photoURL || null
      };
  
      console.log('Final message data:', messageData);
  
      await addDoc(messagesRef, messageData);
    } catch (error: any) {
      console.error('Error adding chat message:', error);
      // Re-throw with more context
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  static async updateShareLastMessage(userId: string, shareId: string): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const shareRef = doc(this.db, 'userConfigs', userId, 'shares', shareId);
      await updateDoc(shareRef, {
        'metadata.lastMessageAt': serverTimestamp()
      });
    } catch (error) {
      // Log but don't throw - this is non-critical
      console.warn('Failed to update share metadata:', error);
    }
  }

  private static createSecureMessageQuery(
    messagesRef: CollectionReference,
    { userEmail, isAdmin, shareId }: MessageFilter
  ) {
    // If no user email, they can only see admin messages
    if (!userEmail) {
      return query(
        messagesRef,
        where('sender', '==', 'admin'),
        orderBy('timestamp', 'asc')
      );
    }

    // For the welcome bot, admins see everything, others see only their messages and admin messages
    if (shareId === 'welcome-emissary') {
      if (isAdmin && userEmail === 'm@sunholo.com') {
        return query(messagesRef, orderBy('timestamp', 'asc'));
      }
      return query(
        messagesRef,
        where('userEmail', 'in', [userEmail, 'm@sunholo.com']),
        orderBy('timestamp', 'asc')
      );
    }

    // For regular chats
    // Admins (must be share admin) see everything in their share
    if (isAdmin) {
      return query(
        messagesRef,
        where('shareId', '==', shareId),
        orderBy('timestamp', 'asc')
      );
    }

    // Regular users see only their messages and admin responses
    return query(
      messagesRef,
      where('shareId', '==', shareId),
      where('userEmail', 'in', [userEmail, 'm@sunholo.com']),
      orderBy('timestamp', 'asc')
    );
  }


  static onChatMessages(
    shareId: string, 
    userEmail: string | null, 
    isAdmin: boolean, 
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    if (typeof window === 'undefined') return () => {};
    
    try {
      const messagesRef = collection(this.db, 'chatMessages', shareId, 'messages');
      let q;
  
      // Simplify query structure - just order by timestamp
      // Security rules will handle message visibility
      q = query(messagesRef, orderBy('timestamp', 'asc'));
  
      return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => {
          const data = doc.data() as ChatMessage;
          return {
            id: doc.id,
            ...data
          };
        });
        
        // Filter messages client-side
        const filteredMessages = messages.filter(msg => {
          if (!userEmail) {
            // Not logged in - only show admin messages
            return msg.sender === 'admin';
          }
          if (isAdmin) {
            // Admin sees all messages
            return true;
          }
          // Regular users see their own messages and admin messages
          return msg.userEmail === userEmail || msg.sender === 'admin';
        });
        
        callback(filteredMessages);
      }, (error) => {
        console.error('Error in chat message listener:', error);
        callback([]);
      });
    } catch (error) {
      console.error('Error setting up chat listener:', error);
      return () => {};
    }
  }

  // Delete a chat message
  static async deleteChatMessage(shareId: string, messageId: string): Promise<void> {
    if (typeof window === 'undefined') throw new Error('This method can only be used in the browser');
    
    try {
      const messageRef = doc(this.db, 'chatMessages', shareId, 'messages', messageId);
      await deleteDoc(messageRef);
    } catch (error: any) {
      this.handleError(error, 'Deleting chat message');
      throw error;
    }
  }

  // Get unread message count for a user
  static async getUnreadMessageCount(shareId: string, userEmail: string): Promise<number> {
    if (typeof window === 'undefined') throw new Error('This method can only be used in the browser');
    
    try {
      const messagesRef = collection(this.db, 'chatMessages', shareId, 'messages');
      const q = query(
        messagesRef,
        where('userEmail', '!=', userEmail),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.size;
    } catch (error: any) {
      this.handleError(error, 'Getting unread message count');
      throw error;
    }
  }

  // Mark messages as read
  // Mark messages as read
  static async markMessagesAsRead(shareId: string, userEmail: string): Promise<void> {
    if (typeof window === 'undefined') throw new Error('This method can only be used in the browser');
    
    try {
      const messagesRef = collection(this.db, 'chatMessages', shareId, 'messages');
      const q = query(
        messagesRef,
        where('userEmail', '!=', userEmail),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(q);
      
      // If no unread messages, return early
      if (snapshot.empty) return;

      // Use individual updates instead of batch for better permission handling
      const updatePromises = snapshot.docs.map(async doc => {
        try {
          await updateDoc(doc.ref, { read: true });
        } catch (error) {
          console.warn(`Failed to mark message ${doc.id} as read:`, error);
          // Don't throw error for individual message failures
        }
      });
      
      await Promise.all(updatePromises);
    } catch (error: any) {
      // Log error but don't throw
      console.error('Error marking messages as read:', error);
    }
  }

    // Specific method for welcome bot messages
    static onWelcomeBotMessages(callback: (messages: ChatMessage[]) => void): () => void {
        if (typeof window === 'undefined') return () => {};
        
        try {
          const messagesRef = collection(this.db, 'chatMessages', 'welcome-emissary', 'messages');
          const q = query(messagesRef, orderBy('timestamp', 'asc'));
          
          return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data() as ChatMessage
            }));
            callback(messages);
          }, (error) => {
            console.warn('Error listening to welcome bot messages:', error);
            // Return empty array on error
            callback([]);
          });
        } catch (error) {
          console.warn('Error setting up welcome bot listener:', error);
          return () => {};
        }
      }

      static async initializeChatDocument(shareId: string, config: ShareConfig): Promise<void> {
        if (typeof window === 'undefined') return;
      
        try {
          const chatDocRef = doc(this.db, 'chatMessages', shareId);
          const chatDoc = await getDoc(chatDocRef);
      
          if (!chatDoc.exists()) {
            // Create the chat document with all required fields
            await setDoc(chatDocRef, {
              adminEmail: config.adminEmail,
              botId: config.botId,
              botName: config.botName || "Emissary Helper",
              initialDocuments: config.initialDocuments || [],
              metadata: {
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isActive: true,
                planTier: 'free',
                usageCount: 0,
                lastAccessedAt: Date.now()
              },
              senderName: config.senderName,
              recipientName: config.recipientName,
              initialMessage: config.initialMessage,
              initialInstructions: config.initialInstructions
            });
      
            console.log('Chat document initialized:', shareId);
          }
        } catch (error) {
          console.error('Error initializing chat document:', error);
          throw error;
        }
      }

  // Add a method specifically for the welcome bot
  static async markWelcomeBotMessagesAsRead(userEmail: string): Promise<void> {
    return this.markMessagesAsRead('welcome-emissary', userEmail);
  }

  static async initializeWelcomeBot() {
    if (typeof window === 'undefined') return;

    try {
      // Create welcome bot config if it doesn't exist
      const welcomeBotConfig = {
        shareId: 'welcome-emissary',
        botId: 'welcome-bot',
        botName: "Emissary Helper",
        senderName: "Mark Edmondson",
        recipientName: "Everyone",
        adminEmail: "m@sunholo.com",
        initialDocuments: [],
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isActive: true,
          planTier: 'free',
          usageCount: 0,
          lastAccessedAt: Date.now()
        }
      };

      const welcomeRef = doc(this.db, 'chatMessages', 'welcome-emissary');
      
      // First try to get the existing config
      try {
        const welcomeDoc = await getDoc(welcomeRef);
        if (!welcomeDoc.exists()) {
          // Only try to create if we're authenticated as the admin
          const currentUser = this.auth.currentUser;
          if (currentUser?.email === welcomeBotConfig.adminEmail) {
            await setDoc(welcomeRef, welcomeBotConfig);
            console.log('Welcome bot initialized successfully');
          } else {
            console.log('Welcome bot not initialized - requires admin privileges');
          }
        }
      } catch (error) {
        // Just log the error but don't throw - the welcome bot can still function without the config
        console.warn('Error checking welcome bot config:', error);
      }
    } catch (error) {
      // Log but don't throw - this isn't critical for the app to function
      console.warn('Error in welcome bot initialization:', error);
    }
  }
}

export default FirebaseService;