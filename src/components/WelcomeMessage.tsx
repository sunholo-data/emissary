import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare } from 'lucide-react';

interface WelcomeMessageProps {
    botName: string;
    botAvatar: string;
    senderName: string;
    recipientName: string;
    initialMessage?: string;  // Make this optional
    onAccept: () => void;
  }

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
    botName,
    botAvatar,
    senderName,
    recipientName,
    initialMessage = "Welcome to Sunholo Emissary",
    onAccept
  }) => {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <Card className="max-w-xl w-full shadow-lg animate-fadeIn">
          <CardHeader className="text-center space-y-6 pt-8">
            <div className="flex justify-center animate-scaleIn">
              <Avatar className="h-28 w-28 ring-4 ring-muted ring-offset-2">
                <AvatarImage src={botAvatar} alt={botName} />
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {botName[0]}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-2 animate-slideUp">
              <h2 className="text-3xl font-bold text-foreground">{botName}</h2>
              <p className="text-muted-foreground text-lg">Your personal Emissary</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            <div className="bg-muted p-4 rounded-xl space-y-2 animate-slideUp delay-200">
              <div className="flex justify-between text-sm text-muted-foreground">
                <div className="space-x-2">
                  <span className="font-medium">From:</span>
                  <span>{senderName}</span>
                </div>
                <div className="space-x-2">
                  <span className="font-medium">To:</span>
                  <span>{recipientName}</span>
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-6 animate-slideUp delay-300">
              <div className="relative bg-primary/5 rounded-2xl p-6 max-w-md mx-auto">
                <div className="absolute left-6 top-6">
                  <MessageSquare className="w-6 h-6 text-primary shrink-0" />
                </div>
                <p className="text-lg text-foreground pl-10 text-left">
                  {initialMessage}
                </p>
              </div>
              
              <Button 
                size="lg" 
                onClick={onAccept}
                className="px-8 py-6 text-lg rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105"
              >
                Accept Message
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

export default WelcomeMessage;
