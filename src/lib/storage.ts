import { getStorage, connectStorageEmulator, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { initFirebase } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';
import type { Document } from '@/types';

export class StorageService {
  private static storage: ReturnType<typeof getStorage> | null = null;
  private static initialized = false;
  
  private static getStorageInstance() {
    if (!this.storage && typeof window !== 'undefined') {
      const app = initFirebase();
      if (app) {
        this.storage = getStorage(app);
        
        if (!this.initialized && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
          connectStorageEmulator(this.storage, "127.0.0.1", 9199);
          this.initialized = true;
        }
      }
    }

    if (!this.storage) {
      throw new Error('Storage not initialized');
    }

    return this.storage;
  }

  static async uploadDocument(file: File, userId: string, shareId: string): Promise<Document> {
    const storage = this.getStorageInstance();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User must be authenticated to upload documents');
    }

    if (currentUser.uid !== userId) {
      throw new Error('User ID mismatch. You can only upload to your own directory.');
    }

    try {
      const fileExtension = file.name.split('.').pop() || '';
      const fileName = `${crypto.randomUUID()}.${fileExtension}`;
      const storagePath = `users/${userId}/shares/${shareId}/documents/${fileName}`;
      
      const storageRef = ref(storage, storagePath);
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Cache-Control': 'public, max-age=3600'
        }
      };

      await uploadBytes(storageRef, file, metadata);
      const downloadUrl = await getDownloadURL(storageRef);

      const fileType = file.type.split('/')[1] || fileExtension;
      
      return {
        name: file.name,
        type: fileType,
        url: downloadUrl,
        storagePath,
        contentType: file.type,
        size: file.size
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error instanceof Error 
        ? new Error(`Upload failed: ${error.message}`)
        : new Error('Upload failed: Unknown error occurred');
    }
  }

  static async deleteDocument(storagePath: string): Promise<void> {
    const storage = this.getStorageInstance();
    if (!storage) throw new Error('Storage not initialized');
    
    try {
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef);
      console.log('Successfully deleted file:', storagePath);
    } catch (error) {
      // Check if the error is because the file doesn't exist
      if (error instanceof Error && error.message.includes('object-not-found')) {
        console.warn('File already deleted or not found:', storagePath);
        return; // Don't throw error for non-existent files
      }
      throw error; // Re-throw other types of errors
    }
  }
}

export default StorageService;