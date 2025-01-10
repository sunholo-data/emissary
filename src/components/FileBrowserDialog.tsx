import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Folder, File, ArrowLeft, Check } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert } from '@/components/ui/alert';
import type { FileSystemItem, FileBrowserDialogProps } from '@/types/file-browser';
import { useToolContext } from '@/contexts/ToolContext';
import { format } from 'date-fns';
import { InfoIcon } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface GCSObject {
    name: string;
    size?: string | number;
    contentType?: string;
    updated?: string;
    created?: string;
    id?: string;
    timeCreated?: string;
    timeStorageClassUpdated?: string;
    crc32c?: string;
    md5Hash?: string;
  }

export function FileBrowserDialog({ 
  open, 
  onOpenChange,
  onSelect,
  selectedItems = []
}: FileBrowserDialogProps) {
  const { toolConfigs } = useToolContext();
  const fileConfig = toolConfigs['file-browser'] || {};
  const bucketUrl = fileConfig.bucketUrl;
  const rootPath = fileConfig.rootPath || '/';

  const [currentPath, setCurrentPath] = useState(rootPath);
  const [pathHistory, setPathHistory] = useState<string[]>([rootPath]);
  const [fileSystem, setFileSystem] = useState<GCSObject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && bucketUrl) {
      loadFolderContents(currentPath);
    }
  }, [open, bucketUrl, currentPath]);

  const loadFolderContents = async (path: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let normalizedPath = path;
      if (normalizedPath.startsWith('/')) {
        normalizedPath = normalizedPath.slice(1);
      }
      
      console.log('Loading folder:', { bucket: bucketUrl, prefix: normalizedPath });

      const response = await fetch('/api/gcs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucket: bucketUrl,
          prefix: normalizedPath === '/' ? '' : normalizedPath,
          delimiter: '/'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load storage contents');
      }

      const data = await response.json();
      setFileSystem(data.contents);
    } catch (err) {
      console.error('Error loading folder contents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load storage contents');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToFolder = (folderPath: string) => {
    setPathHistory(prev => [...prev, currentPath]);
    setCurrentPath(folderPath);
  };

  const navigateUp = () => {
    const previousPath = pathHistory[pathHistory.length - 1];
    if (previousPath) {
      setPathHistory(prev => prev.slice(0, -1));
      setCurrentPath(previousPath);
    }
  };

  const isItemSelected = (path: string, type: 'file' | 'folder'): boolean => {
    return selectedItems.some(item => item.path === path && item.type === type);
  };

  const toggleSelection = (path: string, name: string, type: 'file' | 'folder', e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent folder navigation when clicking checkbox
    }
    
    const isSelected = isItemSelected(path, type);
    if (isSelected) {
      onSelect(selectedItems.filter(item => !(item.path === path && item.type === type)));
    } else {
      onSelect([...selectedItems, { path, type, name }]);
    }
  };

  function formatDate(dateString?: string): string {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM d, yyyy HH:mm:ss');
    } catch {
      return dateString;
    }
  }

  // Group files and folders
  const groupedContents = React.useMemo(() => {
    const folders: GCSObject[] = [];
    const files: GCSObject[] = [];

    fileSystem.forEach(item => {
      if (item.name.endsWith('/')) {
        folders.push(item);
      } else {
        files.push(item);
      }
    });

    return { folders, files };
  }, [fileSystem]);

  if (!bucketUrl) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File Browser Configuration Required</DialogTitle>
          </DialogHeader>
          <Alert>
            <span>Please configure the file browser in the admin settings first.</span>
          </Alert>
          <div className="text-sm text-muted-foreground">
            Configuration required:
            <ul className="list-disc ml-4 mt-2">
              <li>Storage Bucket URL</li>
              <li>Root Path (optional)</li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Select Files or Folders</span>
            <span className="text-sm font-normal text-muted-foreground">
              Bucket: {bucketUrl}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        {/* Current path navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {currentPath !== rootPath && (
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateUp}
              className="h-8 px-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1 truncate">
            Current path: {currentPath}
          </div>
        </div>

        {/* Selected Items */}
        {selectedItems.length > 0 && (
          <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded">
            {selectedItems.map(item => (
              <Badge 
                key={`${item.type}-${item.path}`}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {item.type === 'folder' ? (
                  <Folder className="h-3 w-3" />
                ) : (
                  <File className="h-3 w-3" />
                )}
                {item.name}
                <span 
                  className="ml-1 cursor-pointer hover:text-gray-700"
                  onClick={() => toggleSelection(item.path, item.name, item.type)}
                >
                  ×
                </span>
              </Badge>
            ))}
          </div>
        )}

        <ScrollArea className="h-[400px] border rounded-lg">
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                Loading...
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <span>{error}</span>
              </Alert>
            ) : (
              <div className="space-y-1">
                {/* Folders */}
                {groupedContents.folders.map((folder) => {
                  const name = folder.name.split('/').slice(-2)[0];
                  const isSelected = isItemSelected(folder.name, 'folder');
                  
                  return (
                    <div 
                      key={folder.name}
                      className="flex items-center p-2 rounded hover:bg-gray-100"
                      onClick={() => navigateToFolder(folder.name)}
                    >
                      <div className="flex items-center mr-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelection(folder.name, name, 'folder')}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </div>
                      <Folder className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="truncate flex-1">{name}</span>
                    </div>
                  );
                })}
                
                {/* Files */}
                {groupedContents.files.map((file) => {
                    const name = file.name.split('/').pop() || '';
                    const isSelected = isItemSelected(file.name, 'file');
                  
                  return (
                    <div 
                      key={file.name}
                      className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-100 ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => toggleSelection(file.name, name, 'file')}
                    >
                      <File className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="truncate flex-1">{name}</span>
                      <span className="text-xs text-gray-500">
                        {file.size && formatFileSize(Number(file.size))}
                      </span>
                    </div>
                  );
                })}

                {groupedContents.folders.length === 0 && 
                 groupedContents.files.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    This folder is empty
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            disabled={selectedItems.length === 0}
          >
            Use Selected Items
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
