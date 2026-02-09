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

      // Calculate click position as percentage
      const xPercent = (e.clientX / window.innerWidth) * 100;
      const yPercent = (e.clientY / window.innerHeight) * 100;

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
