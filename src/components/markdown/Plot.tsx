import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export interface RechartsDataPoint {
  [key: string]: number | string;
}

export interface SeriesConfig {
  dataKey: string;
  color?: string;
  type?: 'monotone' | 'linear' | 'basis' | 'natural';
}

export interface RechartsPlotData {
  data: RechartsDataPoint[];
  series: SeriesConfig[];
  chartType?: 'line' | 'bar' | 'pie' | 'scatter';
}

export interface RechartsPlotLayout {
  title?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  xAxisLabel?: string;
  yAxisLabel?: string;
  pieConfig?: {
    innerRadius?: number;
    outerRadius?: number;
  };
}

export interface PlotProps {
  data?: string | RechartsPlotData;
  layout?: string | RechartsPlotLayout;
  className?: string;
  id?: string;
}

let plotCounter = 0;

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))'
];

export const Plot: React.FC<PlotProps> = ({ data, layout, className, id }) => {
  const plotId = useMemo(() => id || `plot-${++plotCounter}`, [id]);

  const cleanJsonString = (str: string): string => {
    return str
      // Remove extra newlines (keep one for array/object breaks)
      .replace(/\n\s*\n/g, '\n')
      // Remove whitespace at the start of lines
      .replace(/^\s+/gm, '')
      // Remove whitespace at the end of lines
      .replace(/\s+$/gm, '')
      // Normalize spaces between values
      .replace(/\s+/g, ' ')
      // Fix any broken array brackets
      .replace(/\[\s*\n\s*\]/g, '[]')
      // Remove any remaining unnecessary whitespace around brackets and braces
      .replace(/\s*\[\s*/g, '[')
      .replace(/\s*\]\s*/g, ']')
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*}\s*/g, '}')
      // Fix any broken commas
      .replace(/,\s*\n\s*([}\]])/g, '$1')
      // Ensure proper spacing after colons
      .replace(/:\s+/g, ': ');
  };

  const parsedData = useMemo(() => {
    try {
      if (!data) return null;
      if (typeof data === 'string') {
        const cleanData = cleanJsonString(data);
        const parsed = JSON.parse(cleanData) as RechartsPlotData;
        if (!parsed.data || !Array.isArray(parsed.data) || !parsed.series || !Array.isArray(parsed.series)) {
          console.error('Invalid data structure:', parsed);
          return null;
        }
        return parsed;
      }
      return data;
    } catch (error) {
      console.error('Error parsing plot data:', error);
      return null;
    }
  }, [data]);

  const parsedLayout = useMemo(() => {
    try {
      if (!layout) return {};
      if (typeof layout === 'string') {
        const cleanLayout = cleanJsonString(layout);
        return JSON.parse(cleanLayout) as RechartsPlotLayout;
      }
      return layout;
    } catch (error) {
      console.error('Error parsing plot layout:', error);
      return {};
    }
  }, [layout]);

  // Create shadcn/ui compatible config from series
  const chartConfig = useMemo(() => {
    if (!parsedData?.series) return {};
    return parsedData.series.reduce((acc, series, index) => {
      acc[series.dataKey] = {
        label: series.dataKey,
        color: series.color || COLORS[index % COLORS.length]
      };
      return acc;
    }, {} as Record<string, { label: string; color: string }>);
  }, [parsedData?.series]);

  if (!parsedData?.data || !parsedData?.series) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Invalid or missing plot data
          </p>
        </CardContent>
      </Card>
    );
  }

  const { margin = { top: 20, right: 30, left: 20, bottom: 30 } } = parsedLayout;

  const renderChart = () => {
    const chartContent = () => {
      switch (parsedData.chartType) {
        case 'bar':
          return (
            <BarChart data={parsedData.data} margin={margin}>
              {parsedLayout.showGrid !== false && (
                <CartesianGrid 
                  vertical={false} 
                  className="stroke-muted" 
                  strokeDasharray="3 3" 
                />
              )}
              <XAxis
                dataKey="x"
                label={parsedLayout.xAxisLabel ? {
                  value: parsedLayout.xAxisLabel,
                  position: 'bottom'
                } : undefined}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                label={parsedLayout.yAxisLabel ? {
                  value: parsedLayout.yAxisLabel,
                  angle: -90,
                  position: 'insideLeft'
                } : undefined}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground text-xs"
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              {parsedLayout.showLegend !== false && (
                <ChartLegend content={<ChartLegendContent />} wrapperStyle={{ fontSize: '12px' }} />
              )}
              {parsedData.series.map((series: SeriesConfig) => (
                <Bar
                  key={`${plotId}-${series.dataKey}`}
                  dataKey={series.dataKey}
                  fill={`var(--color-${series.dataKey})`}
                  radius={4}
                  name={series.dataKey}
                />
              ))}
            </BarChart>
          );

        case 'pie':
          return (
            <PieChart margin={margin}>
              {parsedData.series.map((series: SeriesConfig) => (
                <Pie
                  key={`${plotId}-${series.dataKey}`}
                  data={parsedData.data}
                  dataKey={series.dataKey}
                  nameKey="x"
                  cx="50%"
                  cy="50%"
                  innerRadius={parsedLayout.pieConfig?.innerRadius || 0}
                  outerRadius={parsedLayout.pieConfig?.outerRadius || '80%'}
                  label={{ fontSize: 12 }}
                  name={series.dataKey}
                >
                  {parsedData.data.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
              ))}
              <ChartTooltip content={<ChartTooltipContent />} />
              {parsedLayout.showLegend !== false && (
                <ChartLegend content={<ChartLegendContent />} wrapperStyle={{ fontSize: '12px' }} />
              )}
            </PieChart>
          );

        case 'scatter':
          return (
            <ScatterChart margin={margin}>
              {parsedLayout.showGrid !== false && (
                <CartesianGrid 
                  vertical={false} 
                  className="stroke-muted" 
                  strokeDasharray="3 3" 
                />
              )}
              <XAxis
                dataKey="x"
                type="number"
                label={parsedLayout.xAxisLabel ? {
                  value: parsedLayout.xAxisLabel,
                  position: 'bottom'
                } : undefined}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                dataKey="y"
                type="number"
                label={parsedLayout.yAxisLabel ? {
                  value: parsedLayout.yAxisLabel,
                  angle: -90,
                  position: 'insideLeft'
                } : undefined}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground text-xs"
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              {parsedLayout.showLegend !== false && (
                <ChartLegend content={<ChartLegendContent />} wrapperStyle={{ fontSize: '12px' }} />
              )}
              {parsedData.series.map((series: SeriesConfig) => (
                <Scatter
                  key={`${plotId}-${series.dataKey}`}
                  data={parsedData.data}
                  fill={`var(--color-${series.dataKey})`}
                  name={series.dataKey}
                />
              ))}
            </ScatterChart>
          );

        case 'line':
        default:
          return (
            <LineChart data={parsedData.data} margin={margin}>
              {parsedLayout.showGrid !== false && (
                <CartesianGrid 
                  vertical={false} 
                  className="stroke-muted" 
                  strokeDasharray="3 3" 
                />
              )}
              <XAxis
                dataKey="x"
                label={parsedLayout.xAxisLabel ? {
                  value: parsedLayout.xAxisLabel,
                  position: 'bottom'
                } : undefined}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                label={parsedLayout.yAxisLabel ? {
                  value: parsedLayout.yAxisLabel,
                  angle: -90,
                  position: 'insideLeft'
                } : undefined}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground text-xs"
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              {parsedLayout.showLegend !== false && (
                <ChartLegend content={<ChartLegendContent />} wrapperStyle={{ fontSize: '12px' }} />
              )}
              {parsedData.series.map((series: SeriesConfig) => (
                <Line
                  key={`${plotId}-${series.dataKey}`}
                  type={series.type || "monotone"}
                  dataKey={series.dataKey}
                  stroke={`var(--color-${series.dataKey})`}
                  dot={false}
                  name={series.dataKey}
                />
              ))}
            </LineChart>
          );
      }
    };

    return (
      <ResponsiveContainer width="100%" height="100%">
        {chartContent()}
      </ResponsiveContainer>
    );
  };

  return (
    <Card className={cn("w-full max-w-lg mx-auto", className)} id={plotId}>
      {parsedLayout.title && (
        <CardHeader className="p-2 sm:p-4">
          <CardTitle className="text-sm sm:text-base">{parsedLayout.title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-2 sm:p-4">
        <div className="w-full h-48 sm:h-64">
          <ChartContainer config={chartConfig} className="w-full h-full">
            {renderChart()}
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default Plot;