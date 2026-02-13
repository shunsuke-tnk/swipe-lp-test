'use client';

import { useEffect, useCallback } from 'react';
import { useAnalytics } from './AnalyticsProvider';

interface Props {
  slideId: string;
}

export function ClickTracker({ slideId }: Props) {
  const { trackClick } = useAnalytics();

  const handleClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Find the click area container (the actual LP content area)
      const clickArea = document.querySelector('[data-click-area]');

      let xPercent: number;
      let yPercent: number;

      if (clickArea) {
        // Calculate position relative to the content container
        const rect = clickArea.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        const relativeY = e.clientY - rect.top;
        xPercent = (relativeX / rect.width) * 100;
        yPercent = (relativeY / rect.height) * 100;

        // Debug log
        console.log('Click Debug:', {
          clientX: e.clientX,
          clientY: e.clientY,
          rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
          relativeX,
          relativeY,
          xPercent,
          yPercent,
        });
      } else {
        console.log('Click Debug: data-click-area not found, using window fallback');
        // Fallback to window-based calculation
        xPercent = (e.clientX / window.innerWidth) * 100;
        yPercent = (e.clientY / window.innerHeight) * 100;
      }

      // Determine element type
      let elementType: 'cta' | 'image' | 'other' = 'other';
      let elementText: string | undefined;

      if (target.closest('button') || target.closest('a') || target.closest('[data-cta]')) {
        elementType = 'cta';
        elementText = target.textContent?.trim().slice(0, 50);
      } else if (target.tagName === 'IMG' || target.closest('img')) {
        elementType = 'image';
      }

      trackClick({
        slideId,
        xPercent,
        yPercent,
        elementType,
        elementText,
      });
    },
    [slideId, trackClick]
  );

  useEffect(() => {
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [handleClick]);

  return null;
}
