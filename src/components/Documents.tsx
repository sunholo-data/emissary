import { IconMap } from '@/lib/icons';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { DocumentHandler } from '@/lib/document-handler';
import type { Document, UserState } from '@/types';
import Image from 'next/image';

type DocumentSidebarProps = {
  documents: Document[];
  userState: UserState;
};

const DocumentItem = ({ 
  doc
}: { 
  doc: Document; 
}) => {
  const isImage = doc.contentType?.startsWith('image/');
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isImage) {
      e.preventDefault();
      window.open(doc.url, '_blank', 'noopener');
    }
  };

  const iconType = DocumentHandler.getFileIcon(doc.type || doc.contentType || '');
  const IconComponent = IconMap[iconType];

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <a 
          href={doc.url} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={handleClick}
          className="flex items-center gap-2"
        >
          {isImage ? (
            <div className="relative w-4 h-4 overflow-hidden rounded">
              <Image 
                src={doc.url}
                alt={doc.name}
                width={16}
                height={16}
                className="object-cover"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const IconFallback = IconMap.Image;
                  const iconElement = document.createElement('div');
                  iconElement.className = 'w-4 h-4';
                  target.parentNode?.appendChild(iconElement);
                }}
              />
            </div>
          ) : (
            <IconComponent className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="truncate" title={doc.name}>{doc.name}</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const DocumentSidebar = ({ 
  documents, 
  userState
}: DocumentSidebarProps) => {
  if (userState === 'not-logged-in') {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Documents</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="flex flex-col items-center justify-center space-y-4 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Please log in to view the documents assigned to this emissary
            </p>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        <span>Assigned Documents</span>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {documents.map((doc, index) => (
            <DocumentItem
              key={index}
              doc={doc}
            />
          ))}
          {documents.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No documents assigned
            </div>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default DocumentSidebar;
