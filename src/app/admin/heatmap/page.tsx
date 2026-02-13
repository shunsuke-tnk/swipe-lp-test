'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ResponsiveSidebar from '@/components/admin/ResponsiveSidebar';
import HeatmapCanvas from '@/components/admin/HeatmapCanvas';
import DateRangePicker from '@/components/admin/DateRangePicker';
import { useDateRange } from '@/hooks/useDateRange';
import { slides } from '@/data/slides';
import type { HeatmapData } from '@/types/analytics';

// Get all slide IDs - for slides with horizontal sub-slides, only include the sub-slides (not the parent)
function getAllSlideIds(): string[] {
  const ids: string[] = [];
  slides.forEach((slide) => {
    if (slide.horizontalSlides && slide.horizontalSlides.length > 0) {
      // Only add the sub-slides (04a, 04b, etc.), not the parent (04)
      slide.horizontalSlides.forEach((hs) => ids.push(hs.id));
    } else {
      // Regular slide without horizontal sub-slides
      ids.push(slide.id);
    }
  });
  return ids;
}

export default function HeatmapPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedSlide, setSelectedSlide] = useState<string>('01');
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(false);

  const { from, to, preset, error, setPreset, setCustomRange } = useDateRange('7d');
  const allSlideIds = getAllSlideIds();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchHeatmap = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/analytics/heatmap/${selectedSlide}?from=${from}&to=${to}`
        );
        if (response.ok) {
          const data = await response.json();
          setHeatmapData(data);
        }
      } catch (err) {
        console.error('Failed to fetch heatmap:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmap();
  }, [status, selectedSlide, from, to]);

  // Get image path for selected slide
  const getSlideImage = (slideId: string): string => {
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

    return '/images/01.Gemini_Generated_Image_am2oo5am2oo5am2o.png';
  };

  if (status === 'loading') {
    return (
      <ResponsiveSidebar>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </ResponsiveSidebar>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <ResponsiveSidebar>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">ヒートマップ</h1>
          <p className="text-gray-500 text-sm md:text-base mt-1">クリック位置の可視化</p>
        </div>

        {/* Date Range Picker */}
        <div className="mb-6">
          <DateRangePicker
            from={from}
            to={to}
            preset={preset}
            error={error}
            onPresetChange={setPreset}
            onCustomRangeChange={setCustomRange}
          />
        </div>

        {/* Slide Selector */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">スライドを選択</p>
          <div className="flex flex-wrap gap-2 overflow-x-auto">
            {allSlideIds.map((id) => (
              <button
                key={id}
                onClick={() => setSelectedSlide(id)}
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedSlide === id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-3 md:p-4">
            <p className="text-xs md:text-sm text-gray-500">総クリック数</p>
            <p className="text-lg md:text-2xl font-bold text-gray-900">
              {heatmapData?.totalClicks || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 md:p-4">
            <p className="text-xs md:text-sm text-gray-500">CTAクリック数</p>
            <p className="text-lg md:text-2xl font-bold text-gray-900">
              {heatmapData?.ctaClicks || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 md:p-4">
            <p className="text-xs md:text-sm text-gray-500">CTAクリック率</p>
            <p className="text-lg md:text-2xl font-bold text-gray-900">
              {heatmapData && heatmapData.totalClicks > 0
                ? ((heatmapData.ctaClicks / heatmapData.totalClicks) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
        </div>

        {/* Heatmap View */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="relative mx-auto" style={{ maxWidth: '375px', aspectRatio: '9/16' }}>
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <>
                <Image
                  src={getSlideImage(selectedSlide)}
                  alt={`Slide ${selectedSlide}`}
                  fill
                  className="object-cover rounded-lg"
                />
                {heatmapData && heatmapData.points.length > 0 && (
                  <HeatmapCanvas
                    points={heatmapData.points}
                    width={375}
                    height={667}
                  />
                )}
                {(!heatmapData || heatmapData.points.length === 0) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <p className="text-white text-center text-sm md:text-base">
                      まだクリックデータがありません
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 flex justify-center gap-2 md:gap-4 flex-wrap">
            <div className="flex items-center gap-1 md:gap-2">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-blue-500" />
              <span className="text-xs md:text-sm text-gray-600">低</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-green-500" />
              <span className="text-xs md:text-sm text-gray-600">中低</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-yellow-500" />
              <span className="text-xs md:text-sm text-gray-600">中高</span>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-red-500" />
              <span className="text-xs md:text-sm text-gray-600">高</span>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveSidebar>
  );
}
