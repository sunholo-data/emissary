import React from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";

const MultivacLogo = () => {
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      <Button
        variant="ghost"
        className="h-auto p-0 hover:bg-transparent"
        asChild
      >
        <a
          href="https://www.sunholo.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-sm">Built with</span>
          <Image
            src="/images/logo/sunholo.png"
            alt="Sunholo"
            width={40}
            height={20}
            className="object-contain"
          />
          <span className="text-sm">Multivac</span>
        </a>
      </Button>
      <span className="text-xs text-muted-foreground">© 2024 Holosun ApS</span>
    </div>
  );
};

export default MultivacLogo;