'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';
import KPICard from '@/components/admin/KPICard';
import TimeSeriesChart from '@/components/admin/TimeSeriesChart';
import SlideRanking from '@/components/admin/SlideRanking';
import type { DashboardStats, TimeSeriesPoint, RealtimeStats } from '@/types/analytics';

interface StatsResponse extends DashboardStats {
  timeSeries: TimeSeriesPoint[];
  realtime: RealtimeStats;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'today'>('7d');

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
        const now = new Date();
        let from: string;

        switch (dateRange) {
          case 'today':
            from = now.toISOString().split('T')[0];
            break;
          case '30d':
            from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            break;
          default: // 7d
            from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        }

        const to = now.toISOString().split('T')[0];
        const response = await fetch(`/api/analytics/stats?from=${from}&to=${to}`);

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [status, dateRange]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 bg-gray-100 p-8">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        </main>
      </div>
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
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
              <p className="text-gray-500 mt-1">SwipeLP アナリティクス</p>
            </div>
            <div className="flex gap-2">
              {(['today', '7d', '30d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {range === 'today' ? '今日' : range === '7d' ? '7日間' : '30日間'}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <KPICard
              title="現在のアクセス数"
              value={stats?.realtime?.currentVisitors || 0}
              icon={<span className="text-2xl">👥</span>}
            />
            <KPICard
              title="ページビュー"
              value={stats?.totalPageViews || 0}
              icon={<span className="text-2xl">👁️</span>}
            />
            <KPICard
              title="ユニークユーザー"
              value={stats?.uniqueVisitors || 0}
              icon={<span className="text-2xl">👤</span>}
            />
            <KPICard
              title="平均滞在時間"
              value={formatDuration(stats?.avgSessionDuration || 0)}
              icon={<span className="text-2xl">⏱️</span>}
            />
            <KPICard
              title="CTAクリック率"
              value={(stats?.ctaClickRate || 0).toFixed(1)}
              unit="%"
              icon={<span className="text-2xl">🖱️</span>}
            />
          </div>

          {/* Time Series Chart */}
          {stats?.timeSeries && stats.timeSeries.length > 0 && (
            <div className="mb-8">
              <TimeSeriesChart data={stats.timeSeries} />
            </div>
          )}

          {/* Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {/* Empty State */}
          {(!stats || stats.totalPageViews === 0) && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg">
                まだデータがありません。LPにアクセスがあるとここに統計が表示されます。
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
