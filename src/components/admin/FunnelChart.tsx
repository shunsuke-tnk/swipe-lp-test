'use client';

import { useMemo } from 'react';
import {
  Sankey,
  Tooltip,
  Layer,
  Rectangle,
  ResponsiveContainer,
} from 'recharts';
import type { SlideTransition, SankeyData, SankeyNode, SankeyLink } from '@/types/funnel';

interface FunnelChartProps {
  transitions: SlideTransition[];
  minTransitions?: number;
}

// Custom node component for the Sankey diagram
interface NodeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  payload: SankeyNode & { value?: number };
}

const CustomNode = ({ x, y, width, height, payload }: NodeProps) => {
  return (
    <Layer>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#3b82f6"
        fillOpacity={0.9}
        rx={4}
        ry={4}
      />
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
        fontSize={12}
        fontWeight="bold"
      >
        {payload.name}
      </text>
      {payload.value && (
        <text
          x={x + width / 2}
          y={y + height + 14}
          textAnchor="middle"
          fill="#6b7280"
          fontSize={10}
        >
          {payload.value}回
        </text>
      )}
    </Layer>
  );
};

// Custom link component
interface LinkProps {
  sourceX: number;
  targetX: number;
  sourceY: number;
  targetY: number;
  sourceControlX: number;
  targetControlX: number;
  linkWidth: number;
  payload: { value: number };
}

const CustomLink = ({
  sourceX,
  targetX,
  sourceY,
  targetY,
  sourceControlX,
  targetControlX,
  linkWidth,
  payload,
}: LinkProps) => {
  const gradientId = `link-gradient-${sourceX}-${targetY}`;
  const opacity = Math.min(0.8, 0.2 + (payload.value / 100) * 0.6);

  return (
    <Layer>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={opacity} />
          <stop offset="100%" stopColor="#10b981" stopOpacity={opacity} />
        </linearGradient>
      </defs>
      <path
        d={`
          M${sourceX},${sourceY}
          C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
        `}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={linkWidth}
        strokeOpacity={0.5}
      />
    </Layer>
  );
};

export default function FunnelChart({ transitions, minTransitions = 1 }: FunnelChartProps) {
  const sankeyData = useMemo<SankeyData | null>(() => {
    if (!transitions || transitions.length === 0) return null;

    // Filter transitions by minimum count
    const filtered = transitions.filter((t) => t.count >= minTransitions);
    if (filtered.length === 0) return null;

    // Get unique slide IDs
    const slideIds = new Set<string>();
    filtered.forEach((t) => {
      slideIds.add(t.from);
      slideIds.add(t.to);
    });

    const slideArray = Array.from(slideIds).sort();
    const slideIndex = new Map<string, number>();
    slideArray.forEach((id, idx) => slideIndex.set(id, idx));

    const nodes: SankeyNode[] = slideArray.map((id) => ({ name: id }));
    const links: SankeyLink[] = filtered.map((t) => ({
      source: slideIndex.get(t.from)!,
      target: slideIndex.get(t.to)!,
      value: t.count,
    }));

    return { nodes, links };
  }, [transitions, minTransitions]);

  if (!sankeyData) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">遷移データがありません</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">ユーザーフロー</h3>
      <div className="h-64 md:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={sankeyData}
            node={CustomNode}
            link={CustomLink}
            nodePadding={50}
            nodeWidth={60}
            margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
          >
            <Tooltip
              content={({ payload }) => {
                if (!payload || payload.length === 0) return null;
                const data = payload[0]?.payload;
                if (data?.source && data?.target) {
                  return (
                    <div className="bg-white p-2 shadow rounded border text-sm">
                      <p className="font-medium">{data.source.name} → {data.target.name}</p>
                      <p className="text-gray-600">{data.value}回の遷移</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </Sankey>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
