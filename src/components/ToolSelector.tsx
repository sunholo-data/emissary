import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Check, AlertCircle, Search, Code, LineChart, BrainCircuit, ChevronDown, ChevronUp } from 'lucide-react';
import { Cpu, Terminal, Database, History, Globe } from 'lucide-react';
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

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.FC<{ className?: string }>;
  component?: CustomComponent;
  demo: () => React.ReactNode;
  isPremium?: boolean; 
}

interface ToolSelectorProps {
  selectedTools: string[];
  onChange: (tools: string[]) => void;
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
        title: 'Sample Chart',
        showGrid: true
      };
      return <Plot data={sampleData} layout={sampleLayout} />;
    }
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
    demo: () => (
      <div className="space-y-4">
        <div className="bg-black rounded-lg p-4 font-mono text-xs text-white">
          <div className="flex items-center gap-2 mb-2 text-gray-400">
            <Terminal className="h-4 w-4"/>
            <span>Python Code Execution</span>
          </div>
          <div className="text-green-400">&gt;&gt;&gt; import pandas as pd</div>
          <div className="text-white">&gt;&gt;&gt; df = pd.read_csv('data.csv')</div>
          <div className="text-white">&gt;&gt;&gt; df.describe()</div>
          <div className="text-green-400 whitespace-pre">
 count  1000.0  1000.0
 mean    15.5    82.4
 std      5.2    12.3
 min      0.0    45.6
 max     32.1   120.8
          </div>
        </div>
        <Alert>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
            <span>Code execution environment ready</span>
          </div>
        </Alert>
      </div>
    )
 },
  {
    id: 'search',
    name: 'Web Search',
    description: 'Real-time web search access',
    category: 'Integration',
    icon: Search,
    isPremium: true,
    demo: () => (
      <Alert>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Web Search API Connected</span>
        </div>
      </Alert>
    )
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
 }
];

const CATEGORIES = Array.from(new Set(AVAILABLE_TOOLS.map(tool => tool.category)));

export default function ToolSelector({ 
    selectedTools, 
    onChange,
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
  
    const activeDemo = AVAILABLE_TOOLS.find(tool => tool.id === activeDemoId)?.demo;
  
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
              {/* Tools List */}
              <div>
                <Label className="mb-2 block">Available Tools</Label>
                <Card>
                  <ScrollArea className="h-[400px]">
                    {filteredTools.map((tool) => (
                      <div
                        key={tool.id}
                        className={cn(
                          "flex items-start p-3 gap-3 cursor-pointer hover:bg-accent",
                          activeDemoId === tool.id && "bg-accent"
                        )}
                        onClick={() => setActiveDemoId(tool.id)}
                      >
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
                    ))}
                  </ScrollArea>
                </Card>
              </div>
  
              {/* Demo Preview */}
              <div>
                <Label className="mb-2 block">Demo Preview</Label>
                <Card>
                  <ScrollArea className="h-[400px]">
                    <CardContent className="p-4">
                      {activeDemo?.()}
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