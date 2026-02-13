'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ResponsiveSidebar from '@/components/admin/ResponsiveSidebar';
import DateRangePicker from '@/components/admin/DateRangePicker';
import FunnelChart from '@/components/admin/FunnelChart';
import DropOffChart from '@/components/admin/DropOffChart';
import { useDateRange } from '@/hooks/useDateRange';
import { slides } from '@/data/slides';
import type { FunnelData, FunnelStep } from '@/types/funnel';

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

export default function FunnelPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStep, setSelectedStep] = useState<FunnelStep | null>(null);
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [showAllExits, setShowAllExits] = useState(false);

  const { from, to, preset, error, setPreset, setCustomRange } = useDateRange('7d');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchFunnel = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics/funnel?from=${from}&to=${to}`);
        if (response.ok) {
          const data = await response.json();
          setFunnelData(data);
        }
      } catch (err) {
        console.error('Failed to fetch funnel data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFunnel();
  }, [status, from, to]);

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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">ファネル分析</h1>
          <p className="text-gray-500 text-sm md:text-base mt-1">ユーザー動線の可視化</p>
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-3 md:p-4">
                <p className="text-xs md:text-sm text-gray-500">総セッション数</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  {funnelData?.totalSessions || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-3 md:p-4">
                <p className="text-xs md:text-sm text-gray-500">遷移パターン数</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  {funnelData?.transitions.length || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-3 md:p-4">
                <p className="text-xs md:text-sm text-gray-500">主要入口</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  {funnelData?.entryDistribution[0]?.slideId || '-'}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-3 md:p-4">
                <p className="text-xs md:text-sm text-gray-500">主要出口</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  {funnelData?.exitDistribution[0]?.slideId || '-'}
                </p>
              </div>
            </div>

            {/* Funnel Chart */}
            {funnelData && funnelData.transitions.length > 0 && (
              <div className="mb-6">
                <FunnelChart transitions={funnelData.transitions} minTransitions={2} />
              </div>
            )}

            {/* Drop-off Chart */}
            {funnelData && funnelData.steps.length > 0 && (
              <div className="mb-6">
                <DropOffChart steps={funnelData.steps} />
              </div>
            )}

            {/* Entry/Exit Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
              {/* Entry Distribution */}
              {funnelData && funnelData.entryDistribution.length > 0 && (
                <div className="bg-white rounded-lg shadow p-4 md:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">入口スライド分布</h3>
                    {funnelData.entryDistribution.length > 5 && (
                      <button
                        onClick={() => setShowAllEntries(!showAllEntries)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {showAllEntries ? '折りたたむ' : `全て表示 (${funnelData.entryDistribution.length})`}
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {(showAllEntries ? funnelData.entryDistribution : funnelData.entryDistribution.slice(0, 5)).map((entry, idx) => {
                      const maxCount = funnelData.entryDistribution[0].count;
                      const percentage = (entry.count / maxCount) * 100;
                      return (
                        <div key={entry.slideId} className="flex items-center gap-3">
                          <span className="w-6 text-sm text-gray-500">{idx + 1}.</span>
                          <span className="w-12 text-sm font-medium">{entry.slideId}</span>
                          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-12 text-sm text-gray-600 text-right">{entry.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Exit Distribution */}
              {funnelData && funnelData.exitDistribution.length > 0 && (
                <div className="bg-white rounded-lg shadow p-4 md:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">出口スライド分布</h3>
                    {funnelData.exitDistribution.length > 5 && (
                      <button
                        onClick={() => setShowAllExits(!showAllExits)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {showAllExits ? '折りたたむ' : `全て表示 (${funnelData.exitDistribution.length})`}
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {(showAllExits ? funnelData.exitDistribution : funnelData.exitDistribution.slice(0, 5)).map((exit, idx) => {
                      const maxCount = funnelData.exitDistribution[0].count;
                      const percentage = (exit.count / maxCount) * 100;
                      return (
                        <div key={exit.slideId} className="flex items-center gap-3">
                          <span className="w-6 text-sm text-gray-500">{idx + 1}.</span>
                          <span className="w-12 text-sm font-medium">{exit.slideId}</span>
                          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-12 text-sm text-gray-600 text-right">{exit.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Slide-by-Slide Detail View */}
            {funnelData && funnelData.steps.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">スライド別詳細</h3>
                  <p className="text-sm text-gray-500 mt-1">各スライドの訪問者数・離脱率・滞在時間</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-0 xl:gap-6 p-4">
                  {/* Slide List */}
                  <div className="xl:col-span-2 overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">スライド</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">訪問者</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">離脱率</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">CTA</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">滞在時間</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {funnelData.steps.map((step) => (
                          <tr
                            key={step.slideId}
                            onClick={() => setSelectedStep(step)}
                            className={`cursor-pointer transition-colors ${
                              selectedStep?.slideId === step.slideId ? 'bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-12 relative rounded overflow-hidden flex-shrink-0">
                                  <Image
                                    src={getSlideImage(step.slideId)}
                                    alt={`Slide ${step.slideId}`}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <span className="font-medium text-sm">{step.slideId}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right text-sm">{step.visitors}</td>
                            <td className="px-3 py-3 text-right text-sm">
                              <span className={`${
                                step.dropOffRate > 50 ? 'text-red-600' : step.dropOffRate > 30 ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {step.dropOffRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right text-sm">{step.ctaClicks}</td>
                            <td className="px-3 py-3 text-right text-sm">{formatDuration(step.avgDuration)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Selected Slide Detail */}
                  <div className="xl:col-span-1 mt-4 xl:mt-0">
                    {selectedStep ? (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-semibold text-gray-900">スライド {selectedStep.slideId}</h4>
                          <button
                            onClick={() => setSelectedStep(null)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="relative mx-auto mb-4" style={{ maxWidth: '150px', aspectRatio: '9/16' }}>
                          <Image
                            src={getSlideImage(selectedStep.slideId)}
                            alt={`Slide ${selectedStep.slideId}`}
                            fill
                            className="object-contain rounded border"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">訪問者数</span>
                            <span className="font-semibold">{selectedStep.visitors}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">離脱率</span>
                            <span className={`font-semibold ${
                              selectedStep.dropOffRate > 50 ? 'text-red-600' : selectedStep.dropOffRate > 30 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {selectedStep.dropOffRate.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">CTAクリック</span>
                            <span className="font-semibold text-blue-600">{selectedStep.ctaClicks}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">平均滞在時間</span>
                            <span className="font-semibold">{formatDuration(selectedStep.avgDuration)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
                        <p>スライドを選択して詳細を表示</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!funnelData || funnelData.totalSessions === 0) && (
              <div className="bg-white rounded-lg shadow p-8 md:p-12 text-center">
                <p className="text-gray-500 text-base md:text-lg">
                  まだデータがありません。LPにアクセスがあるとここにファネルデータが表示されます。
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </ResponsiveSidebar>
  );
}
