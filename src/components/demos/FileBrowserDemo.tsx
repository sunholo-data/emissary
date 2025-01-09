import React, { useState } from 'react';
import { Folder, File } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { FileBrowserDialog } from '@/components/FileBrowserDialog';

interface SelectedItem {
  path: string;
  type: 'file' | 'folder';
  name: string;
}

const FileBrowserDemo = () => {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (items: SelectedItem[]) => {
    setSelectedItems(items);
  };

  return (
    <div className="space-y-4">
      <div className="border rounded p-3 space-y-2">
        <div className="flex gap-2 mb-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="w-full"
          >
            <Folder className="h-4 w-4 mr-2" />
            Browse Files & Folders
          </Button>
        </div>

        {/* Preview of structure */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Documents</span>
          </div>
          <div className="ml-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <File className="h-3 w-3" />
              <span>report.pdf</span>
            </div>
          </div>
        </div>

        {/* Show selected items */}
        {selectedItems.length > 0 && (
          <div className="mt-2 pt-2 border-t space-y-1">
            <div className="text-xs text-muted-foreground">Selected items:</div>
            <div className="flex flex-wrap gap-1">
              {selectedItems.map(item => (
                <Badge 
                  key={`${item.type}-${item.path}`}
                  variant="secondary"
                  className="text-xs"
                >
                  {item.type === 'folder' ? (
                    <Folder className="h-3 w-3 mr-1" />
                  ) : (
                    <File className="h-3 w-3 mr-1" />
                  )}
                  {item.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <Alert>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
          <span>Cloud storage connected</span>
        </div>
      </Alert>

      <FileBrowserDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onSelect={handleSelect}
        selectedItems={selectedItems}
      />
    </div>
  );
};

export default FileBrowserDemo;