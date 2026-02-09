import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase';
import { getRealtimeStats } from '@/lib/upstash';
import type { DashboardStats, TimeSeriesPoint, SlideStats } from '@/types/analytics';

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];

    // Get total page views
    const { count: totalPageViews } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('viewed_at', `${from}T00:00:00`)
      .lte('viewed_at', `${to}T23:59:59`);

    // Get unique visitors
    const { data: uniqueVisitorsData } = await supabase
      .from('sessions')
      .select('visitor_id')
      .gte('started_at', `${from}T00:00:00`)
      .lte('started_at', `${to}T23:59:59`);

    const uniqueVisitors = new Set(uniqueVisitorsData?.map((s) => s.visitor_id)).size;

    // Get session data for avg duration and bounce rate
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('started_at, ended_at, total_slides_viewed')
      .gte('started_at', `${from}T00:00:00`)
      .lte('started_at', `${to}T23:59:59`)
      .not('ended_at', 'is', null);

    let avgSessionDuration = 0;
    let bounceRate = 0;

    if (sessionsData && sessionsData.length > 0) {
      const durations = sessionsData
        .filter((s) => s.ended_at)
        .map((s) => new Date(s.ended_at!).getTime() - new Date(s.started_at).getTime());

      if (durations.length > 0) {
        avgSessionDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      }

      const bounces = sessionsData.filter((s) => (s.total_slides_viewed || 0) <= 1).length;
      bounceRate = (bounces / sessionsData.length) * 100;
    }

    // Get CTA click rate
    const { count: totalCtaClicks } = await supabase
      .from('cta_clicks')
      .select('*', { count: 'exact', head: true })
      .gte('clicked_at', `${from}T00:00:00`)
      .lte('clicked_at', `${to}T23:59:59`);

    const ctaClickRate = uniqueVisitors > 0 ? ((totalCtaClicks || 0) / uniqueVisitors) * 100 : 0;

    // Get top slides
    const { data: slideViewsData } = await supabase
      .from('page_views')
      .select('slide_id, duration_ms')
      .gte('viewed_at', `${from}T00:00:00`)
      .lte('viewed_at', `${to}T23:59:59`);

    const slideStats = new Map<string, { views: number; totalDuration: number }>();
    slideViewsData?.forEach((pv) => {
      const current = slideStats.get(pv.slide_id) || { views: 0, totalDuration: 0 };
      current.views++;
      current.totalDuration += pv.duration_ms || 0;
      slideStats.set(pv.slide_id, current);
    });

    const topSlides: SlideStats[] = Array.from(slideStats.entries())
      .map(([slideId, stats]) => ({
        slideId,
        views: stats.views,
        uniqueVisitors: 0, // Would need additional query
        avgDurationMs: stats.views > 0 ? stats.totalDuration / stats.views : 0,
        bounceRate: 0,
        ctaClickRate: 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // Get high bounce slides (exit slides)
    const { data: exitSlidesData } = await supabase
      .from('sessions')
      .select('exit_slide')
      .gte('started_at', `${from}T00:00:00`)
      .lte('started_at', `${to}T23:59:59`)
      .not('exit_slide', 'is', null);

    const exitCounts = new Map<string, number>();
    exitSlidesData?.forEach((s) => {
      if (s.exit_slide) {
        exitCounts.set(s.exit_slide, (exitCounts.get(s.exit_slide) || 0) + 1);
      }
    });

    const highBounceSlides: SlideStats[] = Array.from(exitCounts.entries())
      .map(([slideId, count]) => ({
        slideId,
        views: slideStats.get(slideId)?.views || 0,
        uniqueVisitors: 0,
        avgDurationMs: 0,
        bounceRate: slideStats.get(slideId)
          ? (count / slideStats.get(slideId)!.views) * 100
          : 0,
        ctaClickRate: 0,
      }))
      .sort((a, b) => b.bounceRate - a.bounceRate)
      .slice(0, 5);

    // Get time series data
    const { data: timeSeriesRaw } = await supabase
      .from('page_views')
      .select('viewed_at, session_id')
      .gte('viewed_at', `${from}T00:00:00`)
      .lte('viewed_at', `${to}T23:59:59`)
      .order('viewed_at', { ascending: true });

    const timeSeriesMap = new Map<string, { pageViews: number; sessions: Set<string> }>();
    timeSeriesRaw?.forEach((pv) => {
      const date = pv.viewed_at.split('T')[0];
      const current = timeSeriesMap.get(date) || { pageViews: 0, sessions: new Set() };
      current.pageViews++;
      current.sessions.add(pv.session_id);
      timeSeriesMap.set(date, current);
    });

    const timeSeries: TimeSeriesPoint[] = Array.from(timeSeriesMap.entries())
      .map(([date, data]) => ({
        date,
        pageViews: data.pageViews,
        uniqueVisitors: data.sessions.size,
        sessions: data.sessions.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get realtime stats
    const realtime = await getRealtimeStats();

    const stats: DashboardStats & { timeSeries: TimeSeriesPoint[]; realtime: typeof realtime } = {
      totalPageViews: totalPageViews || 0,
      uniqueVisitors,
      avgSessionDuration,
      bounceRate,
      ctaClickRate,
      topSlides,
      highBounceSlides,
      timeSeries,
      realtime,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
