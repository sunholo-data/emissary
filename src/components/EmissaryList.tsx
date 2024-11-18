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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { UserBot } from '@/lib/firebase';
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Emissary Dispatches</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Avatar</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Uses</TableHead>
              <TableHead className="text-right">Documents</TableHead>
              <TableHead className="text-right">Total Size</TableHead>
              <TableHead>Actions</TableHead>
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
                <TableCell>{bot.recipientName}</TableCell>
                <TableCell>
                  {bot.createdAt instanceof Date 
                    ? bot.createdAt.toLocaleDateString()
                    : new Date(bot.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>{bot.usageCount}</TableCell>
                <TableCell className="text-right">
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
                          {(!bot.initialDocuments || bot.initialDocuments.length === 0) && (
                            <div className="text-xs">No documents</div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-right">
                  {formatFileSize(calculateTotalSize(bot.initialDocuments))}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {showEditButton && onEdit && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onEdit(bot)}
                      >
                        Upload & Edit
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onView ? onView(bot) : window.open(bot.shareUrl, '_blank')}
                    >
                      View
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};