import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase';
import type { FunnelData, SlideTransition, FunnelStep } from '@/types/funnel';

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

    // Get all page views with session info, ordered by time
    const { data: pageViews, error: pvError } = await supabase
      .from('page_views')
      .select('session_id, slide_id, viewed_at, duration_ms')
      .gte('viewed_at', `${from}T00:00:00`)
      .lte('viewed_at', `${to}T23:59:59`)
      .order('viewed_at', { ascending: true });

    if (pvError) {
      console.error('Error fetching page views:', pvError);
      return NextResponse.json({ error: pvError.message }, { status: 500 });
    }

    // Get session entry/exit info
    const { data: sessions, error: sessError } = await supabase
      .from('sessions')
      .select('id, entry_slide, exit_slide')
      .gte('started_at', `${from}T00:00:00`)
      .lte('started_at', `${to}T23:59:59`);

    if (sessError) {
      console.error('Error fetching sessions:', sessError);
      return NextResponse.json({ error: sessError.message }, { status: 500 });
    }

    // Get CTA clicks per slide
    const { data: ctaClicks, error: ctaError } = await supabase
      .from('cta_clicks')
      .select('slide_id')
      .gte('clicked_at', `${from}T00:00:00`)
      .lte('clicked_at', `${to}T23:59:59`);

    if (ctaError) {
      console.error('Error fetching CTA clicks:', ctaError);
    }

    // Group page views by session
    const sessionViews = new Map<string, { slideId: string; viewedAt: string; durationMs: number }[]>();
    pageViews?.forEach((pv) => {
      const views = sessionViews.get(pv.session_id) || [];
      views.push({
        slideId: pv.slide_id,
        viewedAt: pv.viewed_at,
        durationMs: pv.duration_ms || 0,
      });
      sessionViews.set(pv.session_id, views);
    });

    // Calculate transitions
    const transitionMap = new Map<string, number>();
    sessionViews.forEach((views) => {
      for (let i = 0; i < views.length - 1; i++) {
        const key = `${views[i].slideId}→${views[i + 1].slideId}`;
        transitionMap.set(key, (transitionMap.get(key) || 0) + 1);
      }
    });

    const transitions: SlideTransition[] = Array.from(transitionMap.entries())
      .map(([key, count]) => {
        const [from, to] = key.split('→');
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 50); // Limit to top 50 transitions

    // Calculate slide stats
    const slideStats = new Map<string, { visitors: Set<string>; totalDuration: number; viewCount: number }>();
    sessionViews.forEach((views, sessionId) => {
      views.forEach((view) => {
        const stats = slideStats.get(view.slideId) || {
          visitors: new Set<string>(),
          totalDuration: 0,
          viewCount: 0,
        };
        stats.visitors.add(sessionId);
        stats.totalDuration += view.durationMs;
        stats.viewCount += 1;
        slideStats.set(view.slideId, stats);
      });
    });

    // Count CTA clicks per slide
    const ctaClicksPerSlide = new Map<string, number>();
    ctaClicks?.forEach((click) => {
      ctaClicksPerSlide.set(click.slide_id, (ctaClicksPerSlide.get(click.slide_id) || 0) + 1);
    });

    // Count exit slides
    const exitSlideCount = new Map<string, number>();
    sessions?.forEach((session) => {
      if (session.exit_slide) {
        exitSlideCount.set(session.exit_slide, (exitSlideCount.get(session.exit_slide) || 0) + 1);
      }
    });

    // Calculate funnel steps
    const steps: FunnelStep[] = Array.from(slideStats.entries())
      .map(([slideId, stats]) => {
        const visitors = stats.visitors.size;
        const exitCount = exitSlideCount.get(slideId) || 0;
        const dropOffRate = visitors > 0 ? (exitCount / visitors) * 100 : 0;

        return {
          slideId,
          slideName: `Slide ${slideId}`,
          visitors,
          dropOffRate,
          ctaClicks: ctaClicksPerSlide.get(slideId) || 0,
          avgDuration: stats.viewCount > 0 ? stats.totalDuration / stats.viewCount : 0,
        };
      })
      .sort((a, b) => b.visitors - a.visitors);

    // Entry distribution
    const entryCount = new Map<string, number>();
    sessions?.forEach((session) => {
      if (session.entry_slide) {
        entryCount.set(session.entry_slide, (entryCount.get(session.entry_slide) || 0) + 1);
      }
    });
    const entryDistribution = Array.from(entryCount.entries())
      .map(([slideId, count]) => ({ slideId, count }))
      .sort((a, b) => b.count - a.count);

    // Exit distribution
    const exitDistribution = Array.from(exitSlideCount.entries())
      .map(([slideId, count]) => ({ slideId, count }))
      .sort((a, b) => b.count - a.count);

    const funnelData: FunnelData = {
      transitions,
      steps,
      entryDistribution,
      exitDistribution,
      totalSessions: sessions?.length || 0,
    };

    return NextResponse.json(funnelData);
  } catch (error) {
    console.error('Funnel API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
