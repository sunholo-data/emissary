// src/app/[userId]/[shareId]/not-found.tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Share Not Found</h1>
        <p className="text-gray-600">
            The share you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/">
            Return Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
