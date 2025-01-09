export interface SelectedItem {
    path: string;
    type: 'file' | 'folder';
    name: string;
  }

export interface FileBrowserButtonProps {
    onItemsSelected: (items: SelectedItem[]) => void;
    selectedItems?: SelectedItem[];
  }

// Types for the file system structure
export type FileSystemItem = null | {
    [key: string]: FileSystemItem;
  };
  
export interface FileBrowserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (items: SelectedItem[]) => void;
    selectedItems: SelectedItem[];
  }