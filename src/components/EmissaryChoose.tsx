import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface Template {
    botId: string;
    name: string;
    avatar: string;
    isTemplate: boolean;
    defaultInstructions: string;
  }

interface EmissaryChooseProps {
    templates: Template[];
    selectedTemplate: string;
    onSelect: (templateId: string) => void;
  }

  const EmissaryChoose: React.FC<EmissaryChooseProps> = ({ 
    templates, 
    selectedTemplate, 
    onSelect 
  }) => {
    const truncateText = (text: string, limit: number) => {
        if (!text) return '';
        return text.length > limit ? `${text.substring(0, limit)}...` : text;
      };
      return (
        <div className="w-full space-y-4">
          <Carousel opts={{loop: true}}className="w-full max-w-xl mx-auto">
            <CarouselContent className="-ml-1">
              {templates.map((template) => (
                <CarouselItem key={template.botId} className="pl-1 basis-full sm:basis-1/2 lg:basis-1/3">
                  <Card className={`border-2 h-[400px] max-w-[300px] mx-auto ${selectedTemplate === template.botId ? 'border-blue-500' : 'border-transparent'}`}>
                    <CardContent className="flex flex-col items-center p-4 h-full">
                      <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-gray-200 shrink-0">
                        <img
                          src={template.avatar}
                          alt={template.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.src = `https://ui-avatars.com/api/?name=${template.name}&background=random`;
                          }}
                        />
                      </div>
                      <h3 className="font-semibold text-center mb-2 line-clamp-1">{template.name}</h3>
                      <p className="text-sm text-gray-500 text-center mb-4">
                        {template.isTemplate ? 'Template' : 'Custom'}
                      </p>
                      <p className="text-sm text-gray-600 text-center mb-4 overflow-y-auto flex-1">
                        {truncateText(template.defaultInstructions || '', 200)}
                      </p>
                      <Button
                        variant={selectedTemplate === template.botId ? "default" : "outline"}
                        className="w-full mt-auto"
                        onClick={() => onSelect(template.botId)}
                      >
                        {selectedTemplate === template.botId ? (
                          <span className="flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            Selected
                          </span>
                        ) : (
                          'Select'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
              <CarouselItem className="pl-1 basis-full sm:basis-1/2 lg:basis-1/3">
                <Card className={`border-2 h-[400px] max-w-[300px] mx-auto ${selectedTemplate === 'custom' ? 'border-blue-500' : 'border-transparent'}`}>
                  <CardContent className="flex flex-col items-center p-4 h-full">
                    <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 border-gray-200 flex items-center justify-center bg-gray-100 shrink-0">
                      <span className="text-3xl">+</span>
                    </div>
                    <h3 className="font-semibold text-center mb-2">Custom Emissary</h3>
                    <p className="text-sm text-gray-500 text-center mb-4">
                      Create your own
                    </p>
                    <p className="text-sm text-gray-600 text-center mb-4 flex-1">
                      Create a custom emissary with your own instructions and personality.
                    </p>
                    <Button
                      variant={selectedTemplate === 'custom' ? "default" : "outline"}
                      className="w-full mt-auto"
                      onClick={() => onSelect('custom')}
                    >
                      {selectedTemplate === 'custom' ? (
                        <span className="flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Selected
                        </span>
                      ) : (
                        'Select'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      );
    };
export default EmissaryChoose;