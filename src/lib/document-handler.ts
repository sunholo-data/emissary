import { toast } from "@/components/hooks/use-toast";
import StorageService from '@/lib/storage';
import type { Document } from '@/types';
import type { FileIconType } from '@/lib/icons';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const DEFAULT_MAX_DOCUMENTS = 5;

export const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/x-javascript',
    'text/javascript',
    'application/x-python',
    'text/x-python',
    'text/plain',
    'text/html',
    'text/css',
    'text/md',
    'text/csv',
    'text/xml',
    'text/rtf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/heic',
    'image/heif',
    'audio/wav',
    'audio/mp3',
    'audio/mpeg', // Added this
    'audio/aiff',
    'audio/aac',
    'audio/ogg',
    'audio/flac',
    'video/mp4',
    'video/mpeg',
    'video/mov',
    'video/avi',
    'video/x-flv',
    'video/mpg',
    'video/webm',
    'video/wmv',
    'video/3gpp'
] as const;

export const ACCEPTED_FILE_TYPES = [
    ".pdf", ".js", ".py", ".txt", ".html", ".css", ".md", ".csv", ".xml", ".rtf",
    ".png", ".jpeg", ".jpg", ".webp", ".heic", ".heif",
    ".wav", ".mp3", ".aiff", ".aac", ".ogg", ".flac",
    ".mp4", ".mpeg", ".mov", ".avi", ".flv", ".mpg", ".webm", ".wmv", ".3gpp"
].join(',');

export class DocumentHandler {
  static validateFileSize(file: File): void {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      );
    }
  }

  static validateDocumentCount(currentCount: number, maxDocuments: number = DEFAULT_MAX_DOCUMENTS): void {
    if (currentCount >= maxDocuments) {
      throw new Error(
        `Maximum document limit of ${maxDocuments} reached (${currentCount}/${maxDocuments}). Please remove some documents before uploading more.`
      );
    }
  }

  static validateFileType(file: File): void {
    const fileType = file.type;
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;

    if (extension === '.mp3' && (fileType === 'audio/mpeg' || fileType === 'audio/mp3')) {
      return; // Valid MP3 file
    }

    if (!ALLOWED_MIME_TYPES.includes(fileType as typeof ALLOWED_MIME_TYPES[number]) &&
        !ACCEPTED_FILE_TYPES.split(',').includes(extension)) {
      throw new Error(
        `File type not allowed. Allowed types are: ${ACCEPTED_FILE_TYPES}`
      );
    }
  }

  static getCanonicalMimeType(file: File): string {
    // For tracking/logging purposes, we can normalize the MIME type
    if (file.type === 'audio/mpeg' && file.name.toLowerCase().endsWith('.mp3')) {
      return 'audio/mp3';
    }
    return file.type;
  }

  static async handleFileUpload(
    event: React.ChangeEvent<HTMLInputElement>,
    options: {
      userId: string;
      shareId: string;
      onUploadSuccess?: (doc: Document) => void;
      currentDocuments?: Document[];
      maxDocuments?: number;
    }
  ): Promise<Document | undefined> {
    const { 
      userId, 
      shareId, 
      onUploadSuccess, 
      currentDocuments = [],
      maxDocuments = DEFAULT_MAX_DOCUMENTS
    } = options;
    
    const file = event.target.files?.[0];
    
    if (!file || !userId || !shareId) {
      throw new Error('Missing required upload parameters');
    }

    try {
      this.validateFileSize(file);
      this.validateFileType(file);
      this.validateDocumentCount(currentDocuments.length, maxDocuments);
      
      const canonicalType = this.getCanonicalMimeType(file);
      console.log(`Uploading file with type: ${canonicalType}`);
      
      const document = await StorageService.uploadDocument(file, userId, shareId);
      
      if (onUploadSuccess) {
        onUploadSuccess(document);
      }

      toast({
        title: "Success",
        description: `${file.name} has been uploaded successfully (${currentDocuments.length + 1}/${maxDocuments})`
      });

      return document;
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive"
      });
      throw error;
    } finally {
      if (event.target) {
        event.target.value = '';
      }
    }
  }

  static async handleDeleteDocument(
    document: Document,
    index: number,
    options: {
      onDeleteSuccess?: (index: number) => void;
      currentDocuments?: Document[];
      maxDocuments?: number;
    }
  ): Promise<void> {
    const { onDeleteSuccess, currentDocuments = [], maxDocuments = DEFAULT_MAX_DOCUMENTS } = options;

    if (!document.storagePath) {
      throw new Error('Cannot delete document: missing storage path');
    }

    try {
      await StorageService.deleteDocument(document.storagePath);
      
      if (onDeleteSuccess) {
        onDeleteSuccess(index);
      }

      toast({
        title: "Success",
        description: `${document.name} has been deleted (${currentDocuments.length - 1}/${maxDocuments})`
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive"
      });
      throw error;
    }
  }

  static getFileIcon(type: string): FileIconType {
    if (type.startsWith('image/')) return 'Image';
    if (type.startsWith('video/')) return 'Video';
    if (type.startsWith('audio/')) return 'Music';
    
    const cleanType = type.toLowerCase().replace('application/', '').replace('text/', '').replace('.', '');
    
    const typeToIcon: Record<string, FileIconType> = {
      'pdf': 'FileText',
      'rtf': 'FileText',
      'txt': 'FileText',
      'md': 'FileText',
      'markdown': 'FileText',
      'plain': 'FileText',
      'javascript': 'FileCode',
      'js': 'FileCode',
      'typescript': 'FileCode',
      'ts': 'FileCode',
      'python': 'FileCode',
      'py': 'FileCode',
      'html': 'FileCode',
      'css': 'FileCode',
      'xml': 'FileCode',
      'json': 'FileCode',
      'csv': 'FileSpreadsheet',
      'spreadsheet': 'FileSpreadsheet',
      'excel': 'FileSpreadsheet',
      'xlsx': 'FileSpreadsheet',
      'xls': 'FileSpreadsheet',
      'png': 'Image',
      'jpeg': 'Image',
      'jpg': 'Image',
      'webp': 'Image',
      'heic': 'Image',
      'heif': 'Image',
      'svg': 'Image',
      'gif': 'Image',
      'wav': 'Music',
      'mp3': 'Music',
      'aiff': 'Music',
      'aac': 'Music',
      'ogg': 'Music',
      'flac': 'Music',
      'mp4': 'Video',
      'mpeg': 'Video',
      'mov': 'Video',
      'avi': 'Video',
      'flv': 'Video',
      'mpg': 'Video',
      'webm': 'Video',
      'wmv': 'Video',
      '3gpp': 'Video'
    };

    return typeToIcon[cleanType] || 'File';
  }
}