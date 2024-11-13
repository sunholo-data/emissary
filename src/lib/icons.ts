import { FileText, Image as ImageIcon, FileSpreadsheet, FileCode, Video, Music, File } from 'lucide-react';

export const IconMap = {
  FileText,
  Image: ImageIcon,
  FileSpreadsheet,
  FileCode,
  Video,
  Music,
  File,
} as const;

// Create a type from the IconMap keys
export type FileIconType = keyof typeof IconMap;
