'use client';

import { CTAButton as CTAButtonType } from '@/data/slides';
import { useAnalytics } from '@/components/analytics/AnalyticsProvider';

interface CTAButtonProps {
  cta: CTAButtonType;
  slideId?: string;
  onAction?: () => void;
}

export default function CTAButton({ cta, slideId, onAction }: CTAButtonProps) {
  const { trackCTAClick, currentSlide } = useAnalytics();
  const positionClasses = {
    'bottom-center': 'left-1/2 -translate-x-1/2 bottom-[50px]',
    'bottom-right': 'right-4 bottom-[60px]',
    'bottom-left': 'left-4 bottom-[60px]',
  };

  const styleClasses = {
    'bottom-center': `
      bg-[rgba(200,160,220,0.95)]
      text-white
      px-8 py-4
      rounded-2xl
      shadow-lg
      min-w-[200px]
      text-center
      font-medium
      backdrop-blur-sm
      border border-white/20
    `,
    'bottom-right': `
      text-gray-700
      text-sm
      font-medium
      bg-white/80
      px-4 py-2
      rounded-lg
      shadow-md
      backdrop-blur-sm
    `,
    'bottom-left': `
      text-gray-700
      text-sm
      font-medium
      bg-white/80
      px-4 py-2
      rounded-lg
      shadow-md
      backdrop-blur-sm
    `,
  };

  const handleClick = () => {
    // Track CTA click
    trackCTAClick({
      slideId: slideId || currentSlide,
      ctaText: cta.text,
      ctaAction: cta.action,
      ctaHref: cta.href,
    });

    if (cta.action === 'link' && cta.href) {
      window.open(cta.href, '_blank');
    } else if (onAction) {
      onAction();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        absolute z-50
        ${positionClasses[cta.position]}
        ${styleClasses[cta.position]}
        transition-all duration-300 ease-out
        hover:scale-105 hover:shadow-xl
        active:scale-95
        cursor-pointer
      `}
    >
      {cta.text}
    </button>
  );
}
