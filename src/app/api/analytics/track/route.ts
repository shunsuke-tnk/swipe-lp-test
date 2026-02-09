import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { trackRealtimeVisitor, setSessionCache, getSessionCache, SessionCache } from '@/lib/upstash';
import type { AnalyticsEvent, PageViewData, ClickData, CTAClickData, SessionData } from '@/types/analytics';

export async function POST(request: NextRequest) {
  try {
    const event: AnalyticsEvent = await request.json();
    const supabase = createServerClient();

    switch (event.type) {
      case 'session_start': {
        const data = event.data as SessionData;

        // Create session in Supabase
        const { data: session, error } = await supabase
          .from('sessions')
          .insert({
            visitor_id: event.visitorId,
            device_type: data.deviceType,
            user_agent: data.userAgent,
            referrer: data.referrer,
            entry_slide: data.entrySlide,
          })
          .select('id')
          .single();

        if (error) {
          console.error('Error creating session:', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Cache session in Redis
        const sessionCache: SessionCache = {
          sessionId: session.id,
          currentSlide: data.entrySlide,
          startedAt: event.timestamp,
          lastActive: event.timestamp,
          slidesViewed: [data.entrySlide],
        };
        await setSessionCache(event.visitorId, sessionCache);
        await trackRealtimeVisitor(event.visitorId, data.entrySlide);

        return NextResponse.json({ success: true, sessionId: session.id });
      }

      case 'page_view': {
        const data = event.data as PageViewData;

        // Get session from cache
        const sessionCache = await getSessionCache(event.visitorId);
        if (!sessionCache) {
          return NextResponse.json({ success: false, error: 'Session not found' }, { status: 400 });
        }

        // Insert page view
        const { error } = await supabase.from('page_views').insert({
          session_id: sessionCache.sessionId,
          slide_id: data.slideId,
          slide_type: data.slideType,
          parent_slide_id: data.parentSlideId,
          duration_ms: data.durationMs,
          scroll_direction: data.scrollDirection,
        });

        if (error) {
          console.error('Error creating page view:', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Update Redis tracking
        await trackRealtimeVisitor(event.visitorId, data.slideId);

        // Update session cache
        sessionCache.currentSlide = data.slideId;
        sessionCache.lastActive = event.timestamp;
        if (!sessionCache.slidesViewed.includes(data.slideId)) {
          sessionCache.slidesViewed.push(data.slideId);
        }
        await setSessionCache(event.visitorId, sessionCache);

        return NextResponse.json({ success: true });
      }

      case 'click': {
        const data = event.data as ClickData;

        const sessionCache = await getSessionCache(event.visitorId);
        if (!sessionCache) {
          return NextResponse.json({ success: false, error: 'Session not found' }, { status: 400 });
        }

        const { error } = await supabase.from('click_events').insert({
          session_id: sessionCache.sessionId,
          slide_id: data.slideId,
          x_percent: data.xPercent,
          y_percent: data.yPercent,
          element_type: data.elementType,
          element_text: data.elementText,
        });

        if (error) {
          console.error('Error creating click event:', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      case 'cta_click': {
        const data = event.data as CTAClickData;

        const sessionCache = await getSessionCache(event.visitorId);
        if (!sessionCache) {
          return NextResponse.json({ success: false, error: 'Session not found' }, { status: 400 });
        }

        const { error } = await supabase.from('cta_clicks').insert({
          session_id: sessionCache.sessionId,
          slide_id: data.slideId,
          cta_text: data.ctaText,
          cta_action: data.ctaAction,
          cta_href: data.ctaHref,
        });

        if (error) {
          console.error('Error creating CTA click:', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      case 'session_end': {
        const sessionCache = await getSessionCache(event.visitorId);
        if (!sessionCache) {
          return NextResponse.json({ success: false, error: 'Session not found' }, { status: 400 });
        }

        const data = event.data as SessionData;

        // Update session with exit info
        const { error } = await supabase
          .from('sessions')
          .update({
            ended_at: new Date(event.timestamp).toISOString(),
            exit_slide: data.exitSlide,
            total_slides_viewed: sessionCache.slidesViewed.length,
          })
          .eq('id', sessionCache.sessionId);

        if (error) {
          console.error('Error updating session:', error);
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown event type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Track API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
