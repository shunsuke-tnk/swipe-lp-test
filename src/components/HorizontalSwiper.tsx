'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import CTAButton from './CTAButton';
import type { Slide } from '@/data/slides';

interface HorizontalSwiperProps {
  slides: NonNullable<Slide['horizontalSlides']>;
  onComplete?: () => void;
}

export default function HorizontalSwiper({ slides, onComplete }: HorizontalSwiperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // スクロール位置からインデックスを計算
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const slideWidth = container.clientWidth;
    const newIndex = Math.round(scrollLeft / slideWidth);

    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }

    // 最後のスライドで右端に達したら次のセクションへ
    if (newIndex === slides.length - 1) {
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (scrollLeft >= maxScroll - 10) {
        // 既に最後にいて、更にスクロールしようとしている
      }
    }
  }, [currentIndex, slides.length]);

  // 次のスライドへ
  const goToNext = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (currentIndex < slides.length - 1) {
      const slideWidth = container.clientWidth;
      container.scrollTo({
        left: (currentIndex + 1) * slideWidth,
        behavior: 'smooth',
      });
    } else {
      // 最後のスライドなら次のセクションへ
      if (onComplete) {
        onComplete();
      }
    }
  }, [currentIndex, slides.length, onComplete]);

  // 前のスライドへ
  const goToPrev = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (currentIndex > 0) {
      const slideWidth = container.clientWidth;
      container.scrollTo({
        left: (currentIndex - 1) * slideWidth,
        behavior: 'smooth',
      });
    }
  }, [currentIndex]);

  // スクロール終了検出
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScrollEnd = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        handleScroll();
      }, 100);
    };

    container.addEventListener('scroll', handleScrollEnd, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScrollEnd);
      clearTimeout(scrollTimeout);
    };
  }, [handleScroll]);

  // タッチイベントで親への伝播を防止
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const diffX = Math.abs(e.touches[0].clientX - startX);
      const diffY = Math.abs(e.touches[0].clientY - startY);

      // 横方向の動きが大きい場合、イベントを止める
      if (diffX > diffY) {
        e.stopPropagation();
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* スクロールコンテナ */}
      <div
        ref={containerRef}
        className="w-full h-full flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x',
        }}
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="w-full h-full flex-shrink-0 snap-center relative"
            style={{ scrollSnapStop: 'always' }}
          >
            <Image
              src={slide.image}
              alt={`Slide ${slide.id}`}
              fill
              className="object-cover object-center"
              priority
              draggable={false}
            />
            {slide.cta && (
              <CTAButton
                cta={slide.cta}
                onAction={goToNext}
              />
            )}
          </div>
        ))}
      </div>

      {/* ページネーション */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              const container = containerRef.current;
              if (container) {
                container.scrollTo({
                  left: index * container.clientWidth,
                  behavior: 'smooth',
                });
              }
            }}
            className={`rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-3 h-3 bg-white'
                : 'w-2 h-2 bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* 左右ナビゲーションボタン */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {currentIndex < slides.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
