import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Folder, File, ChevronDown, ChevronRight } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { FileSystemItem, FileBrowserDialogProps } from '@/types/file-browser';

// This would come from your cloud storage
const mockFileSystem: FileSystemItem = {
  'Documents': {
    'Contracts': {
      'contract1.pdf': null,
      'contract2.pdf': null,
    },
    'Agreements': {
      'agreement1.docx': null,
      'agreement2.docx': null,
    },
  },
  'Images': {
    'logo.png': null,
    'signature.jpg': null,
  },
};

export function FileBrowserDialog({ 
  open, 
  onOpenChange,
  onSelect,
  selectedItems = []
}: FileBrowserDialogProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev, 
      [path]: !prev[path]
    }));
  };

  const isItemSelected = (path: string, type: 'file' | 'folder'): boolean => {
    return selectedItems.some(item => item.path === path && item.type === type);
  };

  const toggleSelection = (path: string, name: string, type: 'file' | 'folder') => {
    const isSelected = isItemSelected(path, type);
    
    if (isSelected) {
      onSelect(selectedItems.filter(item => !(item.path === path && item.type === type)));
    } else {
      onSelect([...selectedItems, { path, type, name }]);
    }
  };

  const renderFileSystem = (structure: FileSystemItem, currentPath: string = ''): React.ReactNode => {
    if (!structure) return null;

    return Object.entries(structure).map(([name, value]) => {
      const path = currentPath ? `${currentPath}/${name}` : name;
      const isFolder = value !== null;
      const isExpanded = expandedFolders[path];
      const isSelected = isItemSelected(path, isFolder ? 'folder' : 'file');

      return (
        <div key={path} className="ml-4">
          <div 
            className={`flex items-center p-1 rounded cursor-pointer hover:bg-gray-100 ${
              isSelected ? 'bg-blue-50' : ''
            }`}
            onClick={() => toggleSelection(path, name, isFolder ? 'folder' : 'file')}
          >
            {isFolder && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(path);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            {!isFolder && <div className="w-6" />} {/* Spacer for alignment */}
            {isFolder ? (
              <Folder className="h-4 w-4 mx-1 text-blue-500" />
            ) : (
              <File className="h-4 w-4 mx-1 text-gray-500" />
            )}
            <span className="truncate max-w-xs">{name}</span>
          </div>
          {isFolder && isExpanded && (
            <div className="ml-2">
              {renderFileSystem(value, path)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Files or Folders</DialogTitle>
        </DialogHeader>
        
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
            {renderFileSystem(mockFileSystem)}
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