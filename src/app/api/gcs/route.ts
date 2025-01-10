import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

const storage = new Storage();

interface StorageItem {
  name: string;
  size: string | number | null;
  contentType: string;
  updated?: string;
  created?: string;
  id?: string;
  timeCreated?: string;
  timeStorageClassUpdated?: string;
  crc32c?: string;
  md5Hash?: string;
}

export async function POST(request: Request) {
  try {
    const { bucket, prefix = '', delimiter = '/' } = await request.json();

    if (!bucket) {
      return NextResponse.json(
        { error: 'Bucket name is required' },
        { status: 400 }
      );
    }

    const bucketName = bucket.replace('gs://', '').replace(/\/$/, '');
    const cleanPrefix = prefix === '/' ? '' : prefix.replace(/^\/+/, '');

    console.log('Listing contents:', { bucketName, cleanPrefix });

    // Get files and folders in the current directory
    const [files] = await storage.bucket(bucketName).getFiles({
      prefix: cleanPrefix,
      delimiter,
      autoPaginate: false,
      maxResults: 1000,
    });

    // Get folder prefixes (directories)
    const [, , response] = await storage.bucket(bucketName).getFiles({
      prefix: cleanPrefix,
      delimiter,
      autoPaginate: false,
      maxResults: 1000,
    });

    const prefixes = (response as { prefixes?: string[] })?.prefixes || [];
    
    // Create folders list
    const folders: StorageItem[] = prefixes
      .filter(prefix => prefix !== cleanPrefix)
      .map((prefix: string) => ({
        name: prefix,
        size: null,
        contentType: 'folder'
      }));

    // Get detailed metadata for files
    const fileObjects: StorageItem[] = files
      .filter(file => {
        const relativePath = cleanPrefix ? file.name.slice(cleanPrefix.length) : file.name;
        return !relativePath.includes('/');
      })
      .map(file => ({
        name: file.name,
        size: file.metadata.size || null,
        contentType: file.metadata.contentType || 'application/octet-stream',
        updated: file.metadata.updated,
        created: file.metadata.timeCreated,
        id: file.id,
        timeCreated: file.metadata.timeCreated,
        timeStorageClassUpdated: file.metadata.timeStorageClassUpdated,
        crc32c: file.metadata.crc32c,
        md5Hash: file.metadata.md5Hash
      }));

    // Sort both arrays alphabetically
    const sortedFolders = folders.sort((a, b) => a.name.localeCompare(b.name));
    const sortedFiles = fileObjects.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ 
      contents: [...sortedFolders, ...sortedFiles]
    });

  } catch (err: unknown) {
    const error = err as Error;
    console.error('Storage API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to list storage contents',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}