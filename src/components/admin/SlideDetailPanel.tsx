'use client';

import Image from 'next/image';
import Link from 'next/link';
import { slides } from '@/data/slides';
import type { SlideDetailStats } from './SlideStatsTable';

interface SlideDetailPanelProps {
  slideId: string;
  stats: SlideDetailStats | null;
  onClose?: () => void;
}

// Get image path for a slide
function getSlideImage(slideId: string): string {
  const mainSlide = slides.find((s) => s.id === slideId);
  if (mainSlide) return mainSlide.image;

  for (const slide of slides) {
    if (slide.horizontalSlides) {
      const hs = slide.horizontalSlides.find((h) => h.id === slideId);
      if (hs) return hs.image;
    }
  }

  return '/images/01_ファーストビュー_作りっぱなしLP.png';
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}分${remainingSeconds}秒`;
}

export default function SlideDetailPanel({ slideId, stats, onClose }: SlideDetailPanelProps) {
  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">スライドを選択してください</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">スライド {slideId} の詳細</h3>
          <p className="text-sm text-gray-500">詳細な統計情報</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="閉じる"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-4">
        {/* Slide Preview */}
        <div className="mb-6">
          <div className="relative mx-auto" style={{ maxWidth: '200px', aspectRatio: '9/16' }}>
            <Image
              src={getSlideImage(slideId)}
              alt={`Slide ${slideId}`}
              fill
              className="object-contain rounded-lg border"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">閲覧数</p>
            <p className="text-xl font-bold text-gray-900">{stats.views.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">ユニーク訪問者</p>
            <p className="text-xl font-bold text-gray-900">{stats.uniqueVisitors.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">平均滞在時間</p>
            <p className="text-xl font-bold text-gray-900">{formatDuration(stats.avgDurationMs)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">離脱率</p>
            <p className={`text-xl font-bold ${
              stats.bounceRate > 50 ? 'text-red-600' : stats.bounceRate > 30 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {stats.bounceRate.toFixed(1)}%
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">CTAクリック</p>
            <p className="text-xl font-bold text-blue-600">{stats.ctaClicks}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">総クリック数</p>
            <p className="text-xl font-bold text-gray-900">{stats.totalClicks}</p>
          </div>
        </div>

        {/* CTAクリック率 */}
        {stats.views > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-700 mb-1">CTAクリック率</p>
            <p className="text-2xl font-bold text-blue-800">
              {((stats.ctaClicks / stats.views) * 100).toFixed(2)}%
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Link
            href={`/admin/heatmap?slide=${slideId}`}
            className="w-full py-2 px-4 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            ヒートマップを見る
          </Link>
        </div>
      </div>
    </div>
  );
}
