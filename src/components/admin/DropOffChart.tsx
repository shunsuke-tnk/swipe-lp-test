'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import type { FunnelStep } from '@/types/funnel';

interface DropOffChartProps {
  steps: FunnelStep[];
  maxItems?: number;
}

export default function DropOffChart({ steps, maxItems = 10 }: DropOffChartProps) {
  const sortedSteps = [...steps]
    .sort((a, b) => b.dropOffRate - a.dropOffRate)
    .slice(0, maxItems);

  if (sortedSteps.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">離脱データがありません</p>
      </div>
    );
  }

  const getBarColor = (dropOffRate: number) => {
    if (dropOffRate >= 50) return '#ef4444'; // red
    if (dropOffRate >= 30) return '#f97316'; // orange
    if (dropOffRate >= 15) return '#eab308'; // yellow
    return '#22c55e'; // green
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">離脱率ランキング</h3>
      <div className="h-64 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedSteps}
            layout="vertical"
            margin={{ top: 5, right: 60, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="slideId"
              tick={{ fontSize: 12 }}
              width={50}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const data = payload[0].payload as FunnelStep;
                return (
                  <div className="bg-white p-3 shadow-lg rounded-lg border text-sm">
                    <p className="font-semibold mb-1">Slide {data.slideId}</p>
                    <p>離脱率: <span className="font-medium">{data.dropOffRate.toFixed(1)}%</span></p>
                    <p>訪問者数: <span className="font-medium">{data.visitors}</span></p>
                    <p>CTAクリック: <span className="font-medium">{data.ctaClicks}</span></p>
                    <p>平均滞在: <span className="font-medium">{formatDuration(data.avgDuration)}</span></p>
                  </div>
                );
              }}
            />
            <Bar dataKey="dropOffRate" radius={[0, 4, 4, 0]}>
              {sortedSteps.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.dropOffRate)} />
              ))}
              <LabelList
                dataKey="dropOffRate"
                position="right"
                formatter={(value) => typeof value === 'number' ? `${value.toFixed(1)}%` : String(value)}
                style={{ fontSize: 11, fill: '#374151' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex justify-center gap-4 flex-wrap text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-gray-600">&lt;15%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span className="text-gray-600">15-30%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-orange-500" />
          <span className="text-gray-600">30-50%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-gray-600">&gt;50%</span>
        </div>
      </div>
    </div>
  );
}
