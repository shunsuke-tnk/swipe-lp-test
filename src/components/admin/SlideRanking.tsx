'use client';

import type { SlideStats } from '@/types/analytics';

interface SlideRankingProps {
  title: string;
  slides: SlideStats[];
  metricKey: 'views' | 'bounceRate';
  metricLabel: string;
}

export default function SlideRanking({ title, slides, metricKey, metricLabel }: SlideRankingProps) {
  const maxValue = Math.max(...slides.map((s) => s[metricKey] || 0));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <ul className="space-y-3">
        {slides.map((slide, index) => {
          const value = slide[metricKey] || 0;
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

          return (
            <li key={slide.slideId} className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">スライド {slide.slideId}</span>
                  <span className="text-gray-500">
                    {metricKey === 'bounceRate'
                      ? `${value.toFixed(1)}%`
                      : value.toLocaleString()}
                    {' '}{metricLabel}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      metricKey === 'bounceRate' ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
