'use client';

import { useEffect, useRef } from 'react';
import type { HeatmapPoint } from '@/types/analytics';

interface HeatmapCanvasProps {
  points: HeatmapPoint[];
  width: number;
  height: number;
}

export default function HeatmapCanvas({ points, width, height }: HeatmapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (points.length === 0) return;

    // Find max count for normalization
    const maxCount = Math.max(...points.map((p) => p.count));

    // Draw heatmap points
    points.forEach((point) => {
      const x = (point.xPercent / 100) * width;
      const y = (point.yPercent / 100) * height;
      const intensity = point.count / maxCount;
      const radius = 20 + intensity * 30;

      // Create radial gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

      // Color based on intensity (blue -> green -> yellow -> red)
      const alpha = 0.3 + intensity * 0.5;
      if (intensity < 0.25) {
        gradient.addColorStop(0, `rgba(59, 130, 246, ${alpha})`); // Blue
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      } else if (intensity < 0.5) {
        gradient.addColorStop(0, `rgba(16, 185, 129, ${alpha})`); // Green
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      } else if (intensity < 0.75) {
        gradient.addColorStop(0, `rgba(245, 158, 11, ${alpha})`); // Yellow
        gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
      } else {
        gradient.addColorStop(0, `rgba(239, 68, 68, ${alpha})`); // Red
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      }

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });
  }, [points, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none"
    />
  );
}
