'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ResponsiveSidebar from '@/components/admin/ResponsiveSidebar';
import KPICard from '@/components/admin/KPICard';
import TimeSeriesChart from '@/components/admin/TimeSeriesChart';
import SlideRanking from '@/components/admin/SlideRanking';
import SlideStatsTable, { SlideDetailStats } from '@/components/admin/SlideStatsTable';
import SlideDetailPanel from '@/components/admin/SlideDetailPanel';
import DateRangePicker from '@/components/admin/DateRangePicker';
import ExportButton from '@/components/admin/ExportButton';
import { useDateRange } from '@/hooks/useDateRange';
import type { DashboardStats, TimeSeriesPoint, RealtimeStats } from '@/types/analytics';

interface StatsResponse extends DashboardStats {
  timeSeries: TimeSeriesPoint[];
  realtime: RealtimeStats;
  allSlides: SlideDetailStats[];
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);

  const { from, to, preset, error, setPreset, setCustomRange } = useDateRange('7d');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics/stats?from=${from}&to=${to}`);

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
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

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <ResponsiveSidebar>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">ダッシュボード</h1>
              <p className="text-gray-500 text-sm md:text-base mt-1">SwipeLP アナリティクス</p>
            </div>
            <ExportButton
              stats={stats}
              timeSeries={stats?.timeSeries || []}
              dateRange={{ from, to }}
              contentId="dashboard-content"
            />
          </div>
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
          <div id="dashboard-content">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6 mb-6 md:mb-8">
              <KPICard
                title="現在のアクセス数"
                value={stats?.realtime?.currentVisitors || 0}
                icon={<span className="text-xl md:text-2xl">👥</span>}
              />
              <KPICard
                title="ページビュー"
                value={stats?.totalPageViews || 0}
                icon={<span className="text-xl md:text-2xl">👁️</span>}
              />
              <KPICard
                title="ユニークユーザー"
                value={stats?.uniqueVisitors || 0}
                icon={<span className="text-xl md:text-2xl">👤</span>}
              />
              <KPICard
                title="平均滞在時間"
                value={formatDuration(stats?.avgSessionDuration || 0)}
                icon={<span className="text-xl md:text-2xl">⏱️</span>}
              />
              <KPICard
                title="CTAクリック率"
                value={(stats?.ctaClickRate || 0).toFixed(1)}
                unit="%"
                icon={<span className="text-xl md:text-2xl">🖱️</span>}
              />
            </div>

            {/* Time Series Chart */}
            {stats?.timeSeries && stats.timeSeries.length > 0 && (
              <div className="mb-6 md:mb-8">
                <TimeSeriesChart data={stats.timeSeries} />
              </div>
            )}

            {/* Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
              {stats?.topSlides && stats.topSlides.length > 0 && (
                <SlideRanking
                  title="閲覧数の多いスライド"
                  slides={stats.topSlides}
                  metricKey="views"
                  metricLabel="views"
                />
              )}
              {stats?.highBounceSlides && stats.highBounceSlides.length > 0 && (
                <SlideRanking
                  title="離脱率の高いスライド"
                  slides={stats.highBounceSlides}
                  metricKey="bounceRate"
                  metricLabel=""
                />
              )}
            </div>

            {/* All Slides Stats Table with Detail Panel */}
            {stats?.allSlides && stats.allSlides.length > 0 && (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 mb-6">
                <div className="xl:col-span-2">
                  <SlideStatsTable
                    stats={stats.allSlides}
                    onSlideSelect={setSelectedSlideId}
                    selectedSlideId={selectedSlideId || undefined}
                  />
                </div>
                <div className="xl:col-span-1">
                  <SlideDetailPanel
                    slideId={selectedSlideId || ''}
                    stats={selectedSlideId ? stats.allSlides.find(s => s.slideId === selectedSlideId) || null : null}
                    onClose={() => setSelectedSlideId(null)}
                  />
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!stats || stats.totalPageViews === 0) && (
              <div className="bg-white rounded-lg shadow p-8 md:p-12 text-center">
                <p className="text-gray-500 text-base md:text-lg">
                  まだデータがありません。LPにアクセスがあるとここに統計が表示されます。
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </ResponsiveSidebar>
  );
}
