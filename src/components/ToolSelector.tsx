//src/components/ToolSelector.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Check, AlertCircle, Search, Code, LineChart, BrainCircuit, ChevronDown, ChevronUp } from 'lucide-react';
import { Cpu, Folder, Terminal, Database, History, Globe, Network } from 'lucide-react';
import { FileIcon, FileText, Image as ImageIcon, Music, Video, File } from 'lucide-react';
import { Alert } from '@/components/markdown/Alert';
import { Highlight } from '@/components/markdown/Highlight';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plot } from '@/components/markdown/Plot';
import { Tooltip } from '@/components/markdown/Tooltip';
import type { CustomComponent } from '@/components/markdown/types';
import type { RechartsPlotData, RechartsPlotLayout } from '@/components/markdown/Plot';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ToolConfigurator, { ToolConfig, ConfigField } from '@/components/ToolConfigurator';
import GoogleDemo from "@/components/demos/GoogleDemo";
import CodeExecutionDemo from '@/components/demos/CodeExecutionDemo';
import NetworkGraphDemo from '@/components/demos/NetworkGraphDemo';
import FileBrowserDemo from '@/components/demos/FileBrowserDemo';


interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.FC<{ className?: string }>;
  component?: CustomComponent;
  demo: React.ComponentType;
  isPremium?: boolean; 
  configFields?: ConfigField[];
}

interface ToolSelectorProps {
  selectedTools: string[];
  onChange: (tools: string[]) => void;
  toolConfigs?: Record<string, Record<string, any>>; 
  onConfigChange?: (toolId: string, config: Record<string, any>) => void; 
  defaultTools?: string[];
  defaultOpen?: boolean; 
}

const AVAILABLE_TOOLS: Tool[] = [
    {
        id: 'preview',
        name: 'Content Preview',
        description: 'Preview documents and media files',
        category: 'Output',
        icon: ImageIcon,
        isPremium: false,
        demo: () => (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="border rounded p-2">
                <div className="text-xs text-muted-foreground mb-1">PDF</div>
                <div className="bg-muted aspect-[3/4] rounded flex items-center justify-center">
                  <FileText className="h-8 w-8 text-muted-foreground"/>
                </div>
              </div>
              <div className="border rounded p-2">
                <div className="text-xs text-muted-foreground mb-1">Image</div>
                <div className="bg-muted aspect-[3/4] rounded flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground"/>
                </div>
              </div>
              <div className="border rounded p-2">
                <div className="text-xs text-muted-foreground mb-1">Video</div>
                <div className="bg-muted aspect-[3/4] rounded flex items-center justify-center">
                  <Video className="h-8 w-8 text-muted-foreground"/>
                </div>
              </div>
            </div>
            <Alert>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
                <span>Preview system ready</span>
              </div>
            </Alert>
          </div>
        )
     },
  {
    id: 'highlights',
    name: 'Text Highlights',
    description: 'Highlight key phrases in responses',
    category: 'Output',
    icon: AlertCircle,
    component: Highlight,
    demo: () => (
      <div className="space-y-2">
        <p>Example highlights:</p>
        <Highlight>Important information</Highlight>
        <Highlight color="#4caf50">Success highlight</Highlight>
        <Highlight color="#f44336">Error highlight</Highlight>
      </div>
    )
  },
  {
    id: 'plots',
    name: 'Data Visualization',
    description: 'Generate charts and graphs',
    category: 'Output',
    icon: LineChart,
    component: Plot,
    demo: () => {
        const sampleData: RechartsPlotData = {
          data: [
            { x: 'A', y: 10 },
            { x: 'B', y: 15 },
            { x: 'C', y: 8 }
          ],
          series: [{ dataKey: 'y' }],
          chartType: 'bar'
        };
        const sampleLayout: RechartsPlotLayout = {
            showGrid: true,
            margin: { top: 10, right: 10, bottom: 20, left: 30 }, // Smaller margins
            showLegend: false // Disable legend to save space
          };      
        return (
            <Plot 
              data={sampleData}
              layout={sampleLayout}
              className="h-full max-h-[160px]"
            />
        );
      }
  },
  {
    id: 'network',
    name: 'Network Graphs',
    description: 'Visualize relationships and workflows',
    category: 'Output',
    icon: Network, 
    demo: NetworkGraphDemo, 
  },
  {
    id: 'alerts',
    name: 'Alert Messages',
    description: 'Display important notifications',
    category: 'Output',
    icon: AlertCircle,
    component: Alert,
    demo: () => (
      <div className="space-y-2">
        <Alert>Default alert message</Alert>
        <Alert type="success">Success alert message</Alert>
        <Alert type="warning">Warning alert message</Alert>
        <Alert type="error">Error alert message</Alert>
      </div>
    )
  },
  {
    id: 'tooltips',
    name: 'Tooltips',
    description: 'Show contextual information',
    category: 'Output',
    icon: AlertCircle,
    component: Tooltip,
    demo: () => (
      <div className="p-4 space-y-4">
        <Tooltip text="This is a helpful tip">Hover over me</Tooltip><br/>
        <Tooltip text="More information" position="right">Right tooltip</Tooltip>
      </div>
    )
  },
  {
    id: 'code_execution',
    name: 'Code Execution',
    description: 'Execute code to help inform answers',
    category: 'Integration', 
    icon: Cpu,
    isPremium: false,
    demo: CodeExecutionDemo
 },
 {
    id: 'google_search_retrieval',
    name: 'Google Web Search',
    description: 'Real-time Google search access',
    category: 'Integration',
    icon: Search,
    isPremium: false,
    demo: GoogleDemo
  },
  {
    id: 'api',
    name: 'API Integration',
    description: 'External API connections',
    category: 'Integration',
    isPremium: true,
    icon: Code,
    demo: () => (
      <Alert>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>API Gateway Ready</span>
        </div>
      </Alert>
    )
  },
  {
    id: 'postgres',
    name: 'PostgreSQL Connection',
    description: 'Connect to PostgreSQL databases',
    category: 'Integration',
    icon: Database,
    isPremium: true,
    demo: () => (
      <div className="space-y-4">
        <div className="bg-black rounded-lg p-4 font-mono text-xs text-white">
          <div className="flex items-center gap-2 mb-2 text-gray-400">
            <Database className="h-4 w-4"/>
            <span>Connected to: reporting_db</span>
          </div>
          <div className="text-blue-400">postgres=# SELECT COUNT(*) FROM users;</div>
          <div className="text-white"> count</div>
          <div className="text-white">-------</div>
          <div className="text-white"> 15423</div>
          <div className="text-gray-400">(1 row)</div>
        </div>
        <Alert>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
            <span>Database connection active</span>
          </div>
        </Alert>
      </div>
    )
},
{
    id: 'chat_memory',
    name: 'Chat Memory',
    description: 'Access previous conversations',
    category: 'Integration',
    icon: History,
    isPremium: true,
    demo: () => (
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <History className="h-4 w-4"/>
          <span>Recent Conversations</span>
        </div>
        <div className="space-y-2">
          {[
            { time: '2 hours ago', topic: 'Data Analysis Project Review' },
            { time: 'Yesterday', topic: 'Marketing Strategy Discussion' },
            { time: '3 days ago', topic: 'Technical Documentation Help' }
          ].map(item => (
            <div key={item.topic} className="bg-muted p-2 rounded-lg">
              <div className="font-medium">{item.topic}</div>
              <div className="text-xs text-muted-foreground">{item.time}</div>
            </div>
          ))}
        </div>
      </div>
    )
},
{
    id: 'web_reader',
    name: 'Web URL Reader',
    description: 'Extract and analyze web content',
    category: 'Integration',
    icon: Globe,
    isPremium: true,
    demo: () => (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <Globe className="h-4 w-4"/>
          <div className="flex-1 truncate bg-muted px-2 py-1 rounded">
            https://example.com/article
          </div>
        </div>
        <div className="border rounded-lg p-3 space-y-2">
          <div className="font-medium">Extracted Content:</div>
          <div className="text-sm text-muted-foreground line-clamp-3">
            The article discusses key trends in artificial intelligence and their impact on business operations. 
            Main points include machine learning applications, natural language processing advancements, and...
          </div>
          <div className="text-xs text-muted-foreground">
            Last updated: 2 hours ago • Reading time: 5 min
          </div>
        </div>
      </div>
    )
},
{
  id: 'file-browser',
  name: 'File Browser',
  description: 'Select files from cloud storage',
  category: 'Integration',
  icon: Folder,
  isPremium: true,
  demo: FileBrowserDemo,
  configFields: [
    {
      key: 'bucketUrl',
      label: 'Storage Bucket URL',
      type: 'text',
      placeholder: 'gs://your-bucket-name',
      required: true
    },
    {
      key: 'rootPath',
      label: 'Root Path',
      type: 'text',
      placeholder: '/',
      required: false
    }
  ]
 },
 {
    id: 'advanced_models',
    name: 'Advanced Models',
    description: 'Access enhanced reasoning capabilities',
    category: 'Integration',
    icon: BrainCircuit,
    isPremium: true,
    demo: () => (
      <div className="space-y-3">
        <div className="bg-black rounded-lg p-3 font-mono text-xs">
          <div className="text-blue-400">Model: Claude-3-5-Sonnet</div>
          <div className="text-green-400">Capabilities:</div>
          <div className="text-white ml-2">• Advanced reasoning</div>
          <div className="text-white ml-2">• Complex analysis</div>
          <div className="text-white ml-2">• Enhanced creativity</div>
          <div className="text-white ml-2">• Improved accuracy</div>
        </div>
        <Alert>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"/>
            <span>Advanced model ready</span>
          </div>
        </Alert>
      </div>
    )
 },

];

const CATEGORIES = Array.from(new Set(AVAILABLE_TOOLS.map(tool => tool.category)));

export default function ToolSelector({ 
    selectedTools, 
    onChange,
    toolConfigs = {},
    onConfigChange,
    defaultTools = ['preview','highlights', 'plots', 'alerts', 'tooltips'], // Default tools that should be on
    defaultOpen = false // Start collapsed
  }: ToolSelectorProps) {
    const [activeDemoId, setActiveDemoId] = React.useState(AVAILABLE_TOOLS[0].id);
    const [filter, setFilter] = React.useState('All');
    const [isOpen, setIsOpen] = React.useState(defaultOpen);

    // Initialize with defaults if no selections yet
    React.useEffect(() => {
        if (selectedTools.length === 0 && defaultTools.length > 0) {
        onChange(defaultTools);
        }
    }, []);

    const handleConfigUpdate = (toolId: string, config: Record<string, any>) => {
      onConfigChange?.(toolId, config);
    };

    const toggleTool = (toolId: string) => {
      onChange(
        selectedTools.includes(toolId)
          ? selectedTools.filter(id => id !== toolId)
          : [...selectedTools, toolId]
      );
    };
  
    const filteredTools = AVAILABLE_TOOLS.filter(tool => 
      filter === 'All' || tool.category === filter
    );
  
    const ActiveDemo = AVAILABLE_TOOLS.find(tool => tool.id === activeDemoId)?.demo;

  
    return (
        <Card>
          <div className="border-b">
            <div className="flex items-center gap-2 p-4 pb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="shrink-0"
              >
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <h3 className="font-semibold shrink-0">Tools & Features</h3>
            </div>
      
            <ScrollArea className="w-full pb-4 px-4">
              <div className="flex flex-wrap gap-1">
                {selectedTools.map(toolId => {
                  const tool = AVAILABLE_TOOLS.find(t => t.id === toolId);
                  return tool ? (
                    <Badge 
                      key={toolId} 
                      variant="secondary" 
                      className="h-5 shrink-0"
                      onClick={() => toggleTool(toolId)}
                    >
                      <tool.icon className="h-3 w-3 mr-1" />
                      {tool.name}
                      <span className="ml-1 opacity-60">×</span>
                    </Badge>
                  ) : null;
                })}
              </div>
            </ScrollArea>
          </div>
  
        <div className={cn(
          "transition-all duration-200",
          !isOpen && "h-0 overflow-hidden"
        )}>
          <CardContent className="p-4">
            {/* Categories */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant={filter === 'All' ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setFilter('All')}
                >
                  All
                </Badge>
                {CATEGORIES.map(category => (
                  <Badge
                    key={category}
                    variant={filter === category ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => setFilter(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
  
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Available Tools</Label>
              <Card>
                <ScrollArea className="h-[400px]">
                  {filteredTools.map((tool) => (
                    <div
                      key={tool.id}
                      className={cn(
                        "flex flex-col p-3 gap-3 cursor-pointer hover:bg-accent",
                        activeDemoId === tool.id && "bg-accent"
                      )}
                      onClick={() => setActiveDemoId(tool.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className={cn(
                            "w-4 h-4 mt-1 rounded border flex items-center justify-center",
                            selectedTools.includes(tool.id) 
                              ? "bg-primary border-primary" 
                              : "border-gray-300"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTool(tool.id);
                          }}
                        >
                          {selectedTools.includes(tool.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm flex items-center gap-2">
                            <tool.icon className="h-4 w-4" />
                            <span className="truncate">{tool.name}</span>
                            {tool.isPremium && (
                              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                                PRO
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {tool.description}
                          </div>
                        </div>
                      </div>
                      
                      {/* Add configuration UI when tool is selected and has config fields */}
                      {selectedTools.includes(tool.id) && tool.configFields && (
                        <ToolConfigurator
                          toolId={tool.id}
                          currentConfig={toolConfigs[tool.id]}
                          onConfigUpdate={handleConfigUpdate}
                          configFields={tool.configFields}
                        />
                      )}
                    </div>
                  ))}
                </ScrollArea>
              </Card>
            </div>
  
              {/* Demo Preview */}
              <div className="w-full lg:max-w-[400px]"> {/* Constrain width on desktop */}
                <Label className="mb-2 block">Demo Preview</Label>
                <Card>
                    <ScrollArea className="h-[400px]">
                    <CardContent className="p-3">
                      {ActiveDemo && <ActiveDemo />}
                    </CardContent>
                    </ScrollArea>
                </Card>
                </div>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }