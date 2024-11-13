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
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const Plot: React.FC<PlotProps> = ({ data, layout, className, id }) => {
  const plotId = useMemo(() => id || `plot-${++plotCounter}`, [id]);

  const parsedData = useMemo(() => {
    try {
      if (!data) return null;
      if (typeof data === 'string') {
        const parsed = JSON.parse(data) as RechartsPlotData;
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
        return JSON.parse(layout) as RechartsPlotLayout;
      }
      return layout;
    } catch (error) {
      console.error('Error parsing plot layout:', error);
      return {};
    }
  }, [layout]);

  if (!parsedData?.data || !parsedData?.series) {
    return (
      <span className="inline-block w-full text-center text-gray-500 text-sm py-4">
        Invalid or missing plot data
      </span>
    );
  }

  const { margin = { top: 20, right: 30, left: 20, bottom: 30 } } = parsedLayout;

  const renderChart = () => {
    switch (parsedData.chartType) {
      case 'bar':
        return (
          <BarChart data={parsedData.data} margin={margin}>
            {parsedLayout.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis
              dataKey="x"
              label={parsedLayout.xAxisLabel ? {
                value: parsedLayout.xAxisLabel,
                position: 'bottom'
              } : undefined}
            />
            <YAxis
              label={parsedLayout.yAxisLabel ? {
                value: parsedLayout.yAxisLabel,
                angle: -90,
                position: 'insideLeft'
              } : undefined}
            />
            <Tooltip />
            {parsedLayout.showLegend !== false && <Legend />}
            {parsedData.series.map((series: SeriesConfig, index: number) => (
              <Bar
                key={`${plotId}-${series.dataKey}`}
                dataKey={series.dataKey}
                fill={series.color || COLORS[index % COLORS.length]}
              />
            ))}
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            {parsedData.series.map((series: SeriesConfig, index: number) => (
              <Pie
                key={`${plotId}-${series.dataKey}`}
                data={parsedData.data}
                dataKey={series.dataKey}
                nameKey="x"
                cx="50%"
                cy="50%"
                innerRadius={parsedLayout.pieConfig?.innerRadius || 0}
                outerRadius={parsedLayout.pieConfig?.outerRadius || '80%'}
                label
              >
                {parsedData.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            ))}
            <Tooltip />
            {parsedLayout.showLegend !== false && <Legend />}
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart margin={margin}>
            {parsedLayout.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis
              dataKey="x"
              type="number"
              label={parsedLayout.xAxisLabel ? {
                value: parsedLayout.xAxisLabel,
                position: 'bottom'
              } : undefined}
            />
            <YAxis
              dataKey="y"
              type="number"
              label={parsedLayout.yAxisLabel ? {
                value: parsedLayout.yAxisLabel,
                angle: -90,
                position: 'insideLeft'
              } : undefined}
            />
            <Tooltip />
            {parsedLayout.showLegend !== false && <Legend />}
            {parsedData.series.map((series: SeriesConfig, index: number) => (
              <Scatter
                key={`${plotId}-${series.dataKey}`}
                data={parsedData.data}
                fill={series.color || COLORS[index % COLORS.length]}
              />
            ))}
          </ScatterChart>
        );

      case 'line':
      default:
        return (
          <LineChart data={parsedData.data} margin={margin}>
            {parsedLayout.showGrid !== false && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis
              dataKey="x"
              label={parsedLayout.xAxisLabel ? {
                value: parsedLayout.xAxisLabel,
                position: 'bottom'
              } : undefined}
            />
            <YAxis
              label={parsedLayout.yAxisLabel ? {
                value: parsedLayout.yAxisLabel,
                angle: -90,
                position: 'insideLeft'
              } : undefined}
            />
            <Tooltip />
            {parsedLayout.showLegend !== false && <Legend />}
            {parsedData.series.map((series: SeriesConfig, index: number) => (
              <Line
                key={`${plotId}-${series.dataKey}`}
                type={series.type || "monotone"}
                dataKey={series.dataKey}
                stroke={series.color || COLORS[index % COLORS.length]}
                dot={false}
              />
            ))}
          </LineChart>
        );
    }
  };

  return (
    <span
      id={plotId}
      className={`inline-block w-full h-64 ${className || ''}`}
      style={{ minWidth: '300px', display: 'block', marginBottom: '1rem' }}
    >
      <ResponsiveContainer width="100%" height={256}>
        {renderChart()}
      </ResponsiveContainer>
    </span>
  );
};
