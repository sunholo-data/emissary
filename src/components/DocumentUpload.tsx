import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DocumentHandler, ACCEPTED_FILE_TYPES, DEFAULT_MAX_DOCUMENTS } from '@/lib/document-handler';
import StorageService from '@/lib/storage';
import { IconMap } from '@/lib/icons';
import Image from 'next/image';
import type { Document } from '@/types';

interface DocumentUploadProps {
  documents: Document[];
  userId?: string;
  shareId?: string;
  onUpload: (doc: Document) => void;
  onDelete: (index: number) => void;
  isUploading: boolean;
}

const DocumentListItem = ({ 
  doc, 
  onDelete, 
  isUploading 
}: { 
  doc: Document; 
  onDelete: () => void;
  isUploading: boolean;
}) => {
  const isImage = doc.contentType?.startsWith('image/');
  const iconType = DocumentHandler.getFileIcon(doc.type || doc.contentType || '');
  const IconComponent = IconMap[iconType];

  return (
    <div className="flex items-center justify-between p-3 rounded-md border bg-background hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        {isImage && doc.url ? (
          <div className="relative w-10 h-10 overflow-hidden rounded">
            <Image 
              src={doc.url}
              alt={doc.name}
              width={40}
              height={40}
              className="object-cover"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const iconElement = document.createElement('div');
                iconElement.className = 'w-10 h-10 flex items-center justify-center';
                const IconFallback = IconMap.Image;
                const fallbackIcon = document.createElement('div');
                fallbackIcon.innerHTML = '<IconFallback className="w-6 h-6" />';
                target.parentNode?.appendChild(fallbackIcon.firstChild as Node);
              }}
            />
          </div>
        ) : (
          <div className="w-10 h-10 flex items-center justify-center bg-muted/30 rounded">
            <IconComponent className="w-6 h-6 flex-shrink-0" />
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium truncate max-w-[300px]" title={doc.name}>
            {doc.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {doc.contentType?.split('/')[1]?.toUpperCase() || 'Unknown Type'}
          </span>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-muted-foreground hover:text-foreground p-2 rounded-md transition-colors hover:bg-muted"
        disabled={isUploading}
      >
        <X className="w-5 h-5" />
        <span className="sr-only">Delete</span>
      </button>
    </div>
  );
};

export function DocumentUpload({
  documents,
  userId,
  shareId,
  onUpload,
  onDelete,
  isUploading
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!userId || !shareId) return;
    
    try {
      DocumentHandler.validateFileSize(file);
      DocumentHandler.validateDocumentCount(documents.length);
      
      const document = await StorageService.uploadDocument(
        file,
        userId,
        shareId
      );
      
      onUpload(document);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleDelete = async (index: number) => {
    try {
      const doc = documents[index];
      if (!doc.storagePath) return;

      await StorageService.deleteDocument(doc.storagePath);
      onDelete(index);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      await uploadFile(file);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Label>Documents</Label>
        <CardDescription>
          Upload documents that your emissary can reference. Supported formats: PDF, Images, Text, Video, Audio
        </CardDescription>
      </div>

      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-muted",
          isUploading && "opacity-50 pointer-events-none"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-2 cursor-pointer">
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag & drop or click to upload documents
              </p>
              <p className="text-xs text-muted-foreground">
                Maximum file size: 10MB | {documents.length}/{DEFAULT_MAX_DOCUMENTS} documents used
              </p>
              <p className="text-xs text-muted-foreground">
                To increase limits a paid subscription is required. Get in touch.
              </p>
            </>
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={ACCEPTED_FILE_TYPES}
          onChange={handleFileChange}
          disabled={documents.length >= DEFAULT_MAX_DOCUMENTS || isUploading}
        />
      </div>

      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <DocumentListItem
                  key={index}
                  doc={doc}
                  onDelete={() => handleDelete(index)}
                  isUploading={isUploading}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}