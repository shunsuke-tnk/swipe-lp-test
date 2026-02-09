import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase';
import type { HeatmapData, HeatmapPoint } from '@/types/analytics';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slideId: string }> }
) {
  // Check authentication
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slideId } = await params;
    const supabase = createServerClient();
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];

    // Get all click events for this slide
    const { data: clickEvents, error } = await supabase
      .from('click_events')
      .select('x_percent, y_percent, element_type')
      .eq('slide_id', slideId)
      .gte('clicked_at', `${from}T00:00:00`)
      .lte('clicked_at', `${to}T23:59:59`);

    if (error) {
      console.error('Error fetching click events:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Count CTA clicks
    const ctaClicks = clickEvents?.filter((e) => e.element_type === 'cta').length || 0;

    // Aggregate clicks into heatmap points (round to 2% grid)
    const pointMap = new Map<string, number>();
    clickEvents?.forEach((event) => {
      // Round to 2% grid for aggregation
      const x = Math.round(event.x_percent / 2) * 2;
      const y = Math.round(event.y_percent / 2) * 2;
      const key = `${x},${y}`;
      pointMap.set(key, (pointMap.get(key) || 0) + 1);
    });

    const points: HeatmapPoint[] = Array.from(pointMap.entries()).map(([key, count]) => {
      const [x, y] = key.split(',').map(Number);
      return { xPercent: x, yPercent: y, count };
    });

    const heatmapData: HeatmapData = {
      slideId,
      totalClicks: clickEvents?.length || 0,
      ctaClicks,
      points,
    };

    return NextResponse.json(heatmapData);
  } catch (error) {
    console.error('Heatmap API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
