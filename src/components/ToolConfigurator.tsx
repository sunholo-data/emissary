import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';

// Type definitions for tool configuration
export interface ToolConfig {
  id: string;
  config: Record<string, any>;
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  placeholder?: string;
  options?: { label: string; value: string }[];
  required?: boolean;
}

interface ToolConfiguratorProps {
  toolId: string;
  currentConfig?: Record<string, any>;
  onConfigUpdate: (toolId: string, config: Record<string, any>) => void;
  configFields: ConfigField[];
}

const ToolConfigurator = ({
  toolId,
  currentConfig = {},
  onConfigUpdate,
  configFields
}: ToolConfiguratorProps) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [localConfig, setLocalConfig] = React.useState(currentConfig);

  const handleChange = (key: string, value: string) => {
    setLocalConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    onConfigUpdate(toolId, localConfig);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="flex items-center justify-between p-2 mt-2 bg-muted rounded-lg">
        <div className="text-xs text-muted-foreground">
          {Object.keys(currentConfig).length ? 'Configured' : 'Not configured'}
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsEditing(true)}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="mt-2">
      <CardContent className="p-3 space-y-3">
        {configFields.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label className="text-xs">{field.label}</Label>
            <Input
              value={localConfig[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="h-8"
            />
          </div>
        ))}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ToolConfigurator;