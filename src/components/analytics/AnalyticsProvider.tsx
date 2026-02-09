'use client';

import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AnalyticsEvent, PageViewData, ClickData, CTAClickData, SessionData } from '@/types/analytics';

interface AnalyticsContextType {
  trackPageView: (data: Omit<PageViewData, 'durationMs'>) => void;
  trackClick: (data: ClickData) => void;
  trackCTAClick: (data: CTAClickData) => void;
  currentSlide: string;
  setCurrentSlide: (slideId: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
}

function getVisitorId(): string {
  if (typeof window === 'undefined') return '';

  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    visitorId = uuidv4();
    localStorage.setItem('visitor_id', visitorId);
  }
  return visitorId;
}

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

async function sendEvent(event: AnalyticsEvent): Promise<void> {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.error('Failed to send analytics event:', error);
  }
}

interface Props {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: Props) {
  const [currentSlide, setCurrentSlide] = useState('01');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const visitorIdRef = useRef<string>('');
  const slideEnterTimeRef = useRef<number>(Date.now());
  const lastSlideRef = useRef<string>('01');
  const isInitializedRef = useRef(false);

  // Initialize session
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const visitorId = getVisitorId();
    visitorIdRef.current = visitorId;

    const initSession = async () => {
      const sessionData: SessionData = {
        deviceType: getDeviceType(),
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'direct',
        entrySlide: '01',
      };

      const event: AnalyticsEvent = {
        type: 'session_start',
        visitorId,
        sessionId: '', // Will be set by server
        timestamp: Date.now(),
        data: sessionData,
      };

      try {
        const response = await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
        const result = await response.json();
        if (result.sessionId) {
          setSessionId(result.sessionId);
        }
      } catch (error) {
        console.error('Failed to start session:', error);
      }
    };

    initSession();

    // Handle page unload
    const handleUnload = () => {
      const exitData: SessionData = {
        deviceType: getDeviceType(),
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'direct',
        entrySlide: '01',
        exitSlide: lastSlideRef.current,
      };

      // Use sendBeacon for reliable delivery on page unload
      navigator.sendBeacon(
        '/api/analytics/track',
        JSON.stringify({
          type: 'session_end',
          visitorId: visitorIdRef.current,
          sessionId: '',
          timestamp: Date.now(),
          data: exitData,
        })
      );
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  const trackPageView = useCallback((data: Omit<PageViewData, 'durationMs'>) => {
    if (!visitorIdRef.current) return;

    // Calculate duration on previous slide
    const now = Date.now();
    const durationMs = now - slideEnterTimeRef.current;
    slideEnterTimeRef.current = now;
    lastSlideRef.current = data.slideId;

    const pageViewData: PageViewData = {
      ...data,
      durationMs,
    };

    const event: AnalyticsEvent = {
      type: 'page_view',
      visitorId: visitorIdRef.current,
      sessionId: sessionId || '',
      timestamp: now,
      data: pageViewData,
    };

    sendEvent(event);
  }, [sessionId]);

  const trackClick = useCallback((data: ClickData) => {
    if (!visitorIdRef.current) return;

    const event: AnalyticsEvent = {
      type: 'click',
      visitorId: visitorIdRef.current,
      sessionId: sessionId || '',
      timestamp: Date.now(),
      data,
    };

    sendEvent(event);
  }, [sessionId]);

  const trackCTAClick = useCallback((data: CTAClickData) => {
    if (!visitorIdRef.current) return;

    const event: AnalyticsEvent = {
      type: 'cta_click',
      visitorId: visitorIdRef.current,
      sessionId: sessionId || '',
      timestamp: Date.now(),
      data,
    };

    sendEvent(event);
  }, [sessionId]);

  return (
    <AnalyticsContext.Provider
      value={{
        trackPageView,
        trackClick,
        trackCTAClick,
        currentSlide,
        setCurrentSlide,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}
