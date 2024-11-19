import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { UserBot } from '@/lib/firebase';
import { Edit2, Eye, TableIcon, LayoutGrid } from 'lucide-react';
import { formatFileSize, calculateTotalSize } from '@/lib/utils';

interface EmissaryListProps {
  bots: UserBot[];
  onEdit?: (bot: UserBot) => void;
  onView?: (bot: UserBot) => void;
  showEditButton?: boolean;
}

export const EmissaryList = ({ 
  bots, 
  onEdit, 
  onView,
  showEditButton = true 
}: EmissaryListProps) => {
  const [viewMode, setViewMode] = useState<'table' | 'carousel'>('carousel');

  const renderTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">Avatar</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="hidden md:table-cell">Recipient</TableHead>
          <TableHead className="hidden md:table-cell">Created</TableHead>
          <TableHead className="hidden md:table-cell">Uses</TableHead>
          <TableHead className="hidden md:table-cell">Documents</TableHead>
          <TableHead className="w-24">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bots.map((bot) => (
          <TableRow key={bot.shareId}>
            <TableCell>
              <Avatar>
                <AvatarImage src={bot.botAvatar} alt={bot.botName} />
                <AvatarFallback>{bot.botName[0]}</AvatarFallback>
              </Avatar>
            </TableCell>
            <TableCell className="font-medium">{bot.botName}</TableCell>
            <TableCell className="hidden md:table-cell">{bot.recipientName}</TableCell>
            <TableCell className="hidden md:table-cell">
              {bot.createdAt instanceof Date 
                ? bot.createdAt.toLocaleDateString()
                : new Date(bot.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="hidden md:table-cell">{bot.usageCount}</TableCell>
            <TableCell className="hidden md:table-cell">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="cursor-help">
                    {bot.initialDocuments?.length || 0}
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      {bot.initialDocuments?.map((doc, index) => (
                        <div key={index} className="text-xs">
                          {doc.name} ({formatFileSize(doc.size)})
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                {showEditButton && onEdit && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onEdit(bot)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onView ? onView(bot) : window.open(bot.shareUrl, '_blank')}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderCarousel = () => (
    <Carousel opts={{loop: true}} className="w-full max-w-5xl mx-auto">
      <CarouselContent className="-ml-1">
        {bots.map((bot) => (
          <CarouselItem key={bot.shareId} className="pl-1 basis-full sm:basis-1/2 lg:basis-1/3">
            <Card className="h-[400px] max-w-[300px] mx-auto">
              <CardContent className="flex flex-col items-center p-4 h-full">
                <Avatar className="w-20 h-20 mb-4">
                  <AvatarImage src={bot.botAvatar} alt={bot.botName} />
                  <AvatarFallback>{bot.botName[0]}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-center mb-2 line-clamp-1">{bot.botName}</h3>
                <p className="text-sm text-gray-500 text-center mb-2">
                  For: {bot.recipientName}
                </p>
                <div className="text-sm text-gray-600 space-y-2 mb-4">
                  <p>Created: {bot.createdAt instanceof Date 
                    ? bot.createdAt.toLocaleDateString()
                    : new Date(bot.createdAt).toLocaleDateString()}
                  </p>
                  <p>Uses: {bot.usageCount}</p>
                  <p>Documents: {bot.initialDocuments?.length || 0}</p>
                  <p>Total Size: {formatFileSize(calculateTotalSize(bot.initialDocuments))}</p>
                </div>
                <div className="flex gap-2 mt-auto">
                  {showEditButton && onEdit && (
                    <Button 
                      variant="outline"
                      onClick={() => onEdit(bot)}
                      className="flex-1"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => onView ? onView(bot) : window.open(bot.shareUrl, '_blank')}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Emissary Dispatches</CardTitle>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('table')}
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'carousel' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('carousel')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'table' ? renderTable() : renderCarousel()}
      </CardContent>
    </Card>
  );
};

export default EmissaryList;