// src/app/api/debug-env/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const debugInfo = {
    envFile: process.env.ENV_FILE,
    envFileContents: null as string | null,
    secretsDir: [] as string[],
    firebaseEnvVars: {} as Record<string, string>,
    error: null as string | null
  };

  try {
    // Check ENV_FILE
    if (process.env.ENV_FILE) {
      try {
        debugInfo.envFileContents = fs.readFileSync(process.env.ENV_FILE, 'utf8');
      } catch (e: any) {
        debugInfo.error = `Error reading ENV_FILE: ${e.message}`;
      }
    }

    // List contents of /secrets/firebase
    try {
      debugInfo.secretsDir = fs.readdirSync('/secrets/firebase');
    } catch (e: any) {
      debugInfo.error = `Error listing /secrets/firebase: ${e.message}`;
    }

    // Get all NEXT_PUBLIC_FIREBASE environment variables
    Object.keys(process.env)
      .filter(key => key.startsWith('NEXT_PUBLIC_FIREBASE'))
      .forEach(key => {
        debugInfo.firebaseEnvVars[key] = process.env[key] || 'Not Set';
      });

  } catch (e: any) {
    debugInfo.error = `General error: ${e.message}`;
  }

  // Remove sensitive information before sending response
  const safeDebugInfo = {
    ...debugInfo,
    envFileContents: debugInfo.envFileContents ? 'File exists and is readable' : null,
    firebaseEnvVars: Object.fromEntries(
      Object.entries(debugInfo.firebaseEnvVars)
        .map(([key, value]) => [key, value ? 'Set' : 'Not Set'])
    )
  };

  return NextResponse.json(safeDebugInfo);
}