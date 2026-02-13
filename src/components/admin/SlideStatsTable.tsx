'use client';

import { useState } from 'react';
import Image from 'next/image';
import { slides } from '@/data/slides';

export interface SlideDetailStats {
  slideId: string;
  views: number;
  uniqueVisitors: number;
  avgDurationMs: number;
  bounceRate: number;
  ctaClicks: number;
  totalClicks: number;
}

interface SlideStatsTableProps {
  stats: SlideDetailStats[];
  onSlideSelect?: (slideId: string) => void;
  selectedSlideId?: string;
}

// Get image path for a slide
function getSlideImage(slideId: string): string {
  // Check main slides
  const mainSlide = slides.find((s) => s.id === slideId);
  if (mainSlide) return mainSlide.image;

  // Check horizontal slides
  for (const slide of slides) {
    if (slide.horizontalSlides) {
      const hs = slide.horizontalSlides.find((h) => h.id === slideId);
      if (hs) return hs.image;
    }
  }

  return '/images/01_ファーストビュー_作りっぱなしLP.png';
}

// Format duration from ms to readable format
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}分${remainingSeconds}秒`;
}

export default function SlideStatsTable({ stats, onSlideSelect, selectedSlideId }: SlideStatsTableProps) {
  const [sortKey, setSortKey] = useState<keyof SlideDetailStats>('slideId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: keyof SlideDetailStats) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const sortedStats = [...stats].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const SortIcon = ({ column }: { column: keyof SlideDetailStats }) => (
    <span className="ml-1 text-gray-400">
      {sortKey === column ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
    </span>
  );

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">全スライド一覧</h3>
        <p className="text-sm text-gray-500 mt-1">クリックで詳細を表示</p>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {sortedStats.map((slide) => (
          <div
            key={slide.slideId}
            onClick={() => onSlideSelect?.(slide.slideId)}
            className={`p-4 border-b cursor-pointer transition-colors ${
              selectedSlideId === slide.slideId ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-16 relative rounded overflow-hidden flex-shrink-0">
                <Image
                  src={getSlideImage(slide.slideId)}
                  alt={`Slide ${slide.slideId}`}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="font-medium text-gray-900">{slide.slideId}</p>
                <p className="text-sm text-gray-500">{slide.views} views</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-gray-500">滞在時間</p>
                <p className="font-medium">{formatDuration(slide.avgDurationMs)}</p>
              </div>
              <div>
                <p className="text-gray-500">離脱率</p>
                <p className="font-medium">{slide.bounceRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-gray-500">CTAクリック</p>
                <p className="font-medium">{slide.ctaClicks}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                スライド
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('views')}
              >
                閲覧数
                <SortIcon column="views" />
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('uniqueVisitors')}
              >
                ユニーク
                <SortIcon column="uniqueVisitors" />
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('avgDurationMs')}
              >
                平均滞在
                <SortIcon column="avgDurationMs" />
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('bounceRate')}
              >
                離脱率
                <SortIcon column="bounceRate" />
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('ctaClicks')}
              >
                CTAクリック
                <SortIcon column="ctaClicks" />
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('totalClicks')}
              >
                総クリック
                <SortIcon column="totalClicks" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedStats.map((slide) => (
              <tr
                key={slide.slideId}
                onClick={() => onSlideSelect?.(slide.slideId)}
                className={`cursor-pointer transition-colors ${
                  selectedSlideId === slide.slideId ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-14 relative rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={getSlideImage(slide.slideId)}
                        alt={`Slide ${slide.slideId}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="font-medium text-gray-900">{slide.slideId}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">{slide.views.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">{slide.uniqueVisitors.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">{formatDuration(slide.avgDurationMs)}</td>
                <td className="px-4 py-3 text-right text-sm">
                  <span
                    className={`${
                      slide.bounceRate > 50 ? 'text-red-600' : slide.bounceRate > 30 ? 'text-yellow-600' : 'text-green-600'
                    }`}
                  >
                    {slide.bounceRate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">{slide.ctaClicks}</td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">{slide.totalClicks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {stats.length === 0 && (
        <div className="p-8 text-center text-gray-500">データがありません</div>
      )}
    </div>
  );
}
