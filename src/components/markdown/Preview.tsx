import React, { memo, useMemo } from 'react';
import Image from 'next/image';
import { twMerge } from 'tailwind-merge';
import { FileIcon, FileText, Image as ImageIcon, Music, Video, File } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from "@/components/ui/carousel";
import type { FileIconType } from '@/lib/icons';
import type { BaseCustomProps } from './types';

interface PreviewItem {
  uri: string;
  type: string;
  name?: string;
}

interface PreviewProps extends BaseCustomProps {
  uri?: string;
  type?: string;
  name?: string;
  items?: PreviewItem[];
}

interface PreviewContentProps extends PreviewItem {
  className?: string;
}

const PreviewContent = memo(({ uri, type, name, className }: PreviewContentProps) => {
    // All hooks at the top level, before any conditionals
    const [error, setError] = React.useState<string | null>(null);
    const [loaded, setLoaded] = React.useState(false);
  
    const containerClasses = twMerge(
      "inline-block w-full",
      "rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden",
      "bg-gray-50 dark:bg-gray-900",
      className
    );
  
    const fallbackClasses = twMerge(
      "inline-flex flex-col items-center justify-center p-8",
      "text-gray-500 dark:text-gray-400"
    );
  
    // Helper function to render content based on type
    const renderContent = () => {
      if (type.startsWith('image/')) {
        return (
          <div className="relative w-full h-[800px]">
            <Image
              src={uri}
              alt={name || ''}
              fill
              className="object-contain"
              onError={() => setError('Image preview unavailable')}
            />
            {error && (
              <div className={fallbackClasses}>
                <ImageIcon className="w-12 h-12 mb-2" />
                <span>{error}</span>
              </div>
            )}
          </div>
        );
      }
  
      if (type.startsWith('audio/')) {
        return (
          <div className="w-full p-4">
            {!error ? (
              <audio
                controls
                preload="metadata"
                className={twMerge(
                  "w-full",
                  !loaded && "invisible h-0"
                )}
                onError={(e) => {
                  console.error('Audio error:', e);
                  setError('Unable to play audio file');
                }}
                onLoadedMetadata={() => setLoaded(true)}
              >
                <source src={uri} type={type} />
              </audio>
            ) : (
              <div className={fallbackClasses}>
                <Music className="w-12 h-12 mb-2" />
                <span>{error}</span>
              </div>
            )}
  
            {!loaded && !error && (
              <div className={fallbackClasses}>
                <Music className="w-12 h-12 mb-2 animate-pulse" />
                <span>Loading audio...</span>
              </div>
            )}
          </div>
        );
      }
  
      if (type.startsWith('video/')) {
        return (
          <video controls className="w-full max-h-[600px]">
            <source src={uri} type={type} />
            <span className={fallbackClasses}>
              <Video className="w-12 h-12 mb-2" />
              <span>Video preview unavailable</span>
            </span>
          </video>
        );
      }
  
      if (type === 'application/pdf') {
        return (
          <iframe
            src={uri}
            title={`PDF Preview - ${name || 'Document'}`}
            className="w-full h-[800px]"
            style={{
              minHeight: '800px',
              maxHeight: '1200px'
            }}
            onError={() => setError('PDF preview unavailable')}
          />
        );
      }
  
      if (type.startsWith('text/')) {
        return (
          <iframe
            src={uri}
            title={`Text Preview - ${name || 'Document'}`}
            className="w-full h-full"
            style={{ minHeight: '400px' }}
          />
        );
      }
  
      // Default fallback
      return (
        <div className={fallbackClasses}>
          <FileIcon className="w-12 h-12 mb-2" />
          <span>{name || 'File'}</span>
        </div>
      );
    };
  
    // Main render
    return (
      <span className={containerClasses}>
        {renderContent()}
        {error && !type.startsWith('image/') && (
          <div className={fallbackClasses}>
            <FileIcon className="w-12 h-12 mb-2" />
            <span>{error}</span>
          </div>
        )}
      </span>
    );
  });

PreviewContent.displayName = 'PreviewContent';

const Preview = memo((props: PreviewProps) => {
    const [api, setApi] = React.useState<CarouselApi>();
    const [current, setCurrent] = React.useState(0);
    
    const items = useMemo(() => {
      if (typeof props.items === 'string') {
        try {
          const parsedItems = JSON.parse(props.items) as PreviewItem[];
          // Validate the parsed items
          if (!Array.isArray(parsedItems)) return [];
          return parsedItems.filter((item): item is PreviewItem => (
            typeof item === 'object' &&
            item !== null &&
            typeof item.uri === 'string' &&
            typeof item.type === 'string'
          ));
        } catch (e) {
          console.error('Failed to parse items JSON:', e);
          return [];
        }
      }
      if (Array.isArray(props.items)) {
        return props.items;
      }
      if (props.uri && props.type) {
        return [{
          uri: props.uri,
          type: props.type,
          name: props.name
        }];
      }
      return [];
    }, [props.items, props.uri, props.type, props.name]);
  
    const { className } = props;

    // Setup carousel API and current slide tracking
    React.useEffect(() => {
        if (!api) return;

        api.on("select", () => {
        setCurrent(api.selectedScrollSnap());
        });
    }, [api]);
  
    if (!items.length) {
      return (
        <>
          <br />
          <span className="inline-block text-red-500">
            Preview requires either uri and type props or an items array
          </span>
          <br />
        </>
      );
    }
  
    if (items.length === 1) {
      return (
        <>
          <br />
          <PreviewContent {...items[0]} className={className} />
          <br />
        </>
      );
    }
  
    return (
      <>
        <br />
        <span className="inline-block w-full">
          <Carousel
            setApi={setApi}
            orientation="vertical"
            opts={{
              align: "start",
              loop: true,
            }}
            className={twMerge("w-full", className)}
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {items.map((item: PreviewItem, index: number) => (
                <CarouselItem 
                  key={`${item.uri}-${index}`}
                  className="pl-2 md:pl-4 basis-full"
                >
                  <PreviewContent {...item} className="h-full" />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </span>
        <br />
      </>
    );
}, (prevProps: PreviewProps, nextProps: PreviewProps) => {
    // Handle string items
    if (typeof prevProps.items === 'string' || typeof nextProps.items === 'string') {
      try {
        const prevItems = typeof prevProps.items === 'string' ? 
          JSON.parse(prevProps.items) as PreviewItem[] : 
          (prevProps.items || []);
        const nextItems = typeof nextProps.items === 'string' ? 
          JSON.parse(nextProps.items) as PreviewItem[] : 
          (nextProps.items || []);
        
        if (!Array.isArray(prevItems) || !Array.isArray(nextItems)) return false;
        if (prevItems.length !== nextItems.length) return false;
        
        return prevItems.every((item, index) => {
          const nextItem = nextItems[index];
          if (!nextItem) return false;
          return item.uri === nextItem.uri &&
                 item.type === nextItem.type &&
                 item.name === nextItem.name;
        });
      } catch (e) {
        return false;
      }
    }
  
    // Handle array items
    if (Array.isArray(prevProps.items) || Array.isArray(nextProps.items)) {
      const prevItems = prevProps.items || [];
      const nextItems = nextProps.items || [];
      
      if (prevItems.length !== nextItems.length) return false;
      return prevItems.every((item, index) => {
        const nextItem = nextItems[index];
        if (!nextItem) return false;
        return item.uri === nextItem.uri &&
               item.type === nextItem.type &&
               item.name === nextItem.name;
      });
    }
  
    // Handle single item props
    return prevProps.uri === nextProps.uri &&
           prevProps.type === nextProps.type &&
           prevProps.name === nextProps.name &&
           prevProps.className === nextProps.className;
  });
  
  Preview.displayName = 'Preview';
  
  // Export with proper typing for the markdown component system
  export const PreviewComponent: React.ComponentType<BaseCustomProps> = Preview as React.ComponentType<BaseCustomProps>;