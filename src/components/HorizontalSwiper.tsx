'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import CTAButton from './CTAButton';
import type { Slide } from '@/data/slides';

interface HorizontalSwiperProps {
  slides: NonNullable<Slide['horizontalSlides']>;
  onComplete?: () => void;
  onPrev?: () => void;
}

export default function HorizontalSwiper({ slides, onComplete, onPrev }: HorizontalSwiperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLeftHint, setShowLeftHint] = useState(true);
  const [showRightHint, setShowRightHint] = useState(false);

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

    // ヒント表示の更新
    setShowLeftHint(newIndex === 0);
    setShowRightHint(newIndex === slides.length - 1);
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
    } else {
      // 最初のスライドなら前のセクションへ
      if (onPrev) {
        onPrev();
      }
    }
  }, [currentIndex, onPrev]);

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

  // 親要素でタッチイベントを検出（縦スワイプ用）
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const container = containerRef.current;
    if (!wrapper || !container) return;

    let startX = 0;
    let startY = 0;
    let startScrollLeft = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startScrollLeft = container.scrollLeft;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;
      const absDiffX = Math.abs(diffX);
      const absDiffY = Math.abs(diffY);

      const currentScrollLeft = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;
      const slideWidth = container.clientWidth;
      const currentIdx = Math.round(currentScrollLeft / slideWidth);
      const isFirstSlide = currentIdx === 0;
      const isLastSlide = currentIdx === slides.length - 1;

      // 縦スワイプの処理（縦方向の動きが横より大きい場合）
      if (absDiffY > absDiffX && absDiffY > 50) {
        // 最後のスライドで上にスワイプ → 次の縦スライドへ
        if (isLastSlide && diffY < -50) {
          if (onComplete) {
            onComplete();
          }
          return;
        }
        // 最初のスライドで下にスワイプ → 前の縦スライドへ
        if (isFirstSlide && diffY > 50) {
          if (onPrev) {
            onPrev();
          }
          return;
        }
      }

      // 横スワイプの処理
      if (absDiffX > absDiffY && absDiffX > 50) {
        // 左端で右にスワイプ（前に戻る）
        if (startScrollLeft <= 5 && diffX > 50 && currentScrollLeft <= 5) {
          if (onPrev) {
            onPrev();
          }
        }

        // 右端で左にスワイプ（次へ進む）
        if (startScrollLeft >= maxScroll - 5 && diffX < -50 && currentScrollLeft >= maxScroll - 5) {
          if (onComplete) {
            onComplete();
          }
        }
      }
    };

    wrapper.addEventListener('touchstart', handleTouchStart, { passive: true });
    wrapper.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      wrapper.removeEventListener('touchstart', handleTouchStart);
      wrapper.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onComplete, onPrev, slides.length]);

  // 横スクロール中は親への伝播を防止
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
    <div
      ref={wrapperRef}
      className="relative w-full h-full"
      style={{ touchAction: 'none' }}
    >
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

      {/* ページネーション（現在位置表示） */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 z-10">
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

      {/* 最初のスライド：下にスワイプで戻るヒント */}
      {showLeftHint && onPrev && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 animate-pulse">
          <button
            onClick={goToPrev}
            className="flex flex-col items-center gap-1 text-white/70 text-xs bg-black/30 px-3 py-2 rounded-full"
          >
            <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>戻る</span>
          </button>
        </div>
      )}

      {/* 最後のスライド：上にスワイプで次へヒント */}
      {showRightHint && onComplete && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 animate-pulse">
          <button
            onClick={goToNext}
            className="flex flex-col items-center gap-1 text-white/70 text-xs bg-black/30 px-3 py-2 rounded-full"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            <span>次へ</span>
          </button>
        </div>
      )}

      {/* 中間スライドでの左右矢印 */}
      {!showLeftHint && currentIndex > 0 && (
        <button
          onClick={goToPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {!showRightHint && currentIndex < slides.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* 進捗表示 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white/60 text-xs bg-black/30 px-3 py-1 rounded-full">
        {currentIndex + 1} / {slides.length}
      </div>
    </div>
  );
}
