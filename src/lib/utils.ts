import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Document } from "@/types"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
} 

export function formatFileSize(bytes?: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
  
  export function calculateTotalSize(documents?: Document[]): number {
    if (!documents) return 0;
    return documents.reduce((total, doc) => total + (doc.size || 0), 0);
  }