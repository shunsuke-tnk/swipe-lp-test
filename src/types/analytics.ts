// Analytics Types

export interface AnalyticsEvent {
  type: 'page_view' | 'click' | 'cta_click' | 'session_start' | 'session_end';
  visitorId: string;
  sessionId: string;
  timestamp: number;
  data: PageViewData | ClickData | CTAClickData | SessionData;
}

export interface PageViewData {
  slideId: string;
  slideType: 'vertical' | 'horizontal';
  parentSlideId?: string;
  durationMs?: number;
  scrollDirection?: 'next' | 'prev' | 'horizontal';
}

export interface ClickData {
  slideId: string;
  xPercent: number;
  yPercent: number;
  elementType: 'cta' | 'image' | 'other';
  elementText?: string;
}

export interface CTAClickData {
  slideId: string;
  ctaText: string;
  ctaAction: string;
  ctaHref?: string;
}

export interface SessionData {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  userAgent: string;
  referrer: string;
  entrySlide: string;
  exitSlide?: string;
}

// Database types
export interface DBSession {
  id: string;
  visitor_id: string;
  started_at: string;
  ended_at?: string;
  device_type?: string;
  user_agent?: string;
  referrer?: string;
  entry_slide?: string;
  exit_slide?: string;
  total_slides_viewed?: number;
}

export interface DBPageView {
  id: string;
  session_id: string;
  slide_id: string;
  slide_type: string;
  parent_slide_id?: string;
  viewed_at: string;
  duration_ms?: number;
  scroll_direction?: string;
}

export interface DBClickEvent {
  id: string;
  session_id: string;
  slide_id: string;
  x_percent: number;
  y_percent: number;
  element_type?: string;
  element_text?: string;
  clicked_at: string;
}

// Stats types
export interface SlideStats {
  slideId: string;
  views: number;
  uniqueVisitors: number;
  avgDurationMs: number;
  bounceRate: number;
  ctaClickRate: number;
}

export interface DashboardStats {
  totalPageViews: number;
  uniqueVisitors: number;
  avgSessionDuration: number;
  bounceRate: number;
  ctaClickRate: number;
  topSlides: SlideStats[];
  highBounceSlides: SlideStats[];
}

export interface TimeSeriesPoint {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
  sessions: number;
}

export interface HeatmapPoint {
  xPercent: number;
  yPercent: number;
  count: number;
}

export interface HeatmapData {
  slideId: string;
  totalClicks: number;
  ctaClicks: number;
  points: HeatmapPoint[];
}

export interface RealtimeStats {
  currentVisitors: number;
  slideBreakdown: Record<string, number>;
  lastUpdated: number;
}
