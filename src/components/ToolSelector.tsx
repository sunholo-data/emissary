import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Check, AlertCircle, Search, Code, LineChart, BrainCircuit, ChevronDown, ChevronUp } from 'lucide-react';
import { Cpu, Terminal } from 'lucide-react';
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
        <Tooltip text="This is a helpful tip">Hover over me</Tooltip>
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
  }
];

const CATEGORIES = Array.from(new Set(AVAILABLE_TOOLS.map(tool => tool.category)));

export default function ToolSelector({ 
    selectedTools, 
    onChange,
    defaultTools = ['highlights', 'plots', 'alerts', 'tooltips'], // Default tools that should be on
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