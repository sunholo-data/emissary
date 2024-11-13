// src/app/[userId]/[shareId]/page.tsx
'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { notFound } from 'next/navigation';
import FirebaseService from '@/lib/firebase';
import SharePage from '@/components/SharePage';
import type { ConfigProps } from '@/types';

function SharePageLoading({ isExiting = false }: { isExiting?: boolean }) {
  return (
    <div 
      className={`fixed inset-0 z-50 bg-gradient-to-b from-background to-muted flex items-center justify-center p-4 ${
        isExiting ? 'animate-fadeOut' : 'animate-fadeIn'
      }`}
    >
      <div className="max-w-xl w-full shadow-lg">
        <div className="text-center space-y-6 pt-8">
          <div className="flex justify-center animate-scaleIn">
            <div className="h-28 w-28 rounded-full bg-muted relative">
              <div className="absolute inset-0">
                <div className="h-full w-full rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
            </div>
          </div>
          <div className="space-y-2 animate-slideUp">
            <div className="h-8 w-48 bg-muted rounded-lg mx-auto" />
            <div className="h-6 w-32 bg-muted rounded-lg mx-auto" />
          </div>
        </div>
        
        <div className="space-y-6 px-8 pb-8 mt-6">
          <div className="bg-muted p-4 rounded-xl animate-slideUp delay-200">
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-muted/50 rounded" />
              <div className="h-4 w-24 bg-muted/50 rounded" />
            </div>
          </div>
          
          <div className="text-center space-y-6 animate-slideUp delay-300">
            <div className="relative bg-muted/50 rounded-2xl p-6 max-w-md mx-auto">
              <div className="h-6 w-64 bg-muted/50 rounded mx-auto" />
            </div>
            
            <div className="h-14 w-40 bg-primary/20 rounded-xl mx-auto overflow-hidden">
              <div className="h-full w-full rounded-xl bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DynamicSharePage({ 
  params: { userId, shareId } 
}: { 
  params: { userId: string; shareId: string } 
}) {
  const [config, setConfig] = useState<ConfigProps | null>(null);
  const [loadingState, setLoadingState] = useState<'loading' | 'exiting' | 'complete'>('loading');
  const hasIncrementedUsageRef = useRef(false);
  const configRef = useRef<ConfigProps | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadConfig() {
      if (hasIncrementedUsageRef.current) return;

      try {
        const completeConfig = await FirebaseService.getCompleteShareConfig(userId, shareId);
        
        if (!completeConfig) {
          if (isMounted) notFound();
          return;
        }

        const configProps = FirebaseService.toConfigProps(
          completeConfig.share,
          completeConfig.bot
        );

        if (!hasIncrementedUsageRef.current) {
          try {
            await FirebaseService.incrementShareUsage(userId, shareId);
            hasIncrementedUsageRef.current = true;
          } catch (error) {
            console.error('Error updating usage stats:', error);
          }
        }

        if (isMounted && !configRef.current) {
          configRef.current = configProps;
          setConfig(configProps);
          // Start exit animation
          setLoadingState('exiting');
          // Complete after animation
          setTimeout(() => {
            if (isMounted) {
              setLoadingState('complete');
            }
          }, 300); // Match this with animation duration
        }
      } catch (error) {
        console.error('Error loading share:', error);
        if (isMounted) notFound();
      }
    }

    loadConfig();

    return () => {
      isMounted = false;
    };
  }, [userId, shareId]);

  const memoizedConfig = useMemo(() => {
    if (!config) return null;
    
    if (
      configRef.current &&
      JSON.stringify(configRef.current) === JSON.stringify(config)
    ) {
      return configRef.current;
    }

    configRef.current = {
      ...config,
      initialDocuments: [...config.initialDocuments]
    };
    
    return configRef.current;
  }, [config]);

  if (loadingState !== 'complete') {
    return <SharePageLoading isExiting={loadingState === 'exiting'} />;
  }

  if (!memoizedConfig) {
    return notFound();
  }

  return (
    <div className="animate-fadeIn">
      <SharePage config={memoizedConfig} />
    </div>
  );
}