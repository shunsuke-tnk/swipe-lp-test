'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ResponsiveSidebar from '@/components/admin/ResponsiveSidebar';
import DateRangePicker from '@/components/admin/DateRangePicker';
import FunnelChart from '@/components/admin/FunnelChart';
import DropOffChart from '@/components/admin/DropOffChart';
import { useDateRange } from '@/hooks/useDateRange';
import type { FunnelData } from '@/types/funnel';

export default function FunnelPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);

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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Entry Distribution */}
              {funnelData && funnelData.entryDistribution.length > 0 && (
                <div className="bg-white rounded-lg shadow p-4 md:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">入口スライド分布</h3>
                  <div className="space-y-2">
                    {funnelData.entryDistribution.slice(0, 5).map((entry, idx) => {
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">出口スライド分布</h3>
                  <div className="space-y-2">
                    {funnelData.exitDistribution.slice(0, 5).map((exit, idx) => {
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
