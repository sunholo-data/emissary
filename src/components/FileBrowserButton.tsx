import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Folder } from 'lucide-react';
import { FileBrowserDialog } from './FileBrowserDialog';
import { Badge } from "@/components/ui/badge";
import type { SelectedItem, FileBrowserButtonProps } from '@/types/file-browser';

export function FileBrowserButton({ 
  onItemsSelected, 
  selectedItems = [] 
}: FileBrowserButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (items: SelectedItem[]) => {
    onItemsSelected(items);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="relative"
      >
        <Folder className="h-4 w-4" />
        {selectedItems.length > 0 && (
          <Badge 
            variant="secondary" 
            className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs"
          >
            {selectedItems.length}
          </Badge>
        )}
      </Button>

      <FileBrowserDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onSelect={handleSelect}
        selectedItems={selectedItems}
      />
    </div>
  );
}