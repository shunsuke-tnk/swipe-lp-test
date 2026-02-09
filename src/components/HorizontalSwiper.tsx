'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Pagination from './Pagination';
import type { Slide } from '@/data/slides';

interface HorizontalSwiperProps {
  slides: NonNullable<Slide['horizontalSlides']>;
  onComplete?: () => void;
  onPrev?: () => void;
}

// 統一されたスワイプ閾値
const SWIPE_THRESHOLD = 50;
const GESTURE_DECISION_THRESHOLD = 10;

export default function HorizontalSwiper({ slides, onComplete, onPrev }: HorizontalSwiperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // タッチ状態を管理するRef
  const touchStateRef = useRef({
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    hasTriggered: false,
    gestureDirection: null as 'horizontal' | 'vertical' | null,
  });

  // コールバックを最新の状態で保持
  const onCompleteRef = useRef(onComplete);
  const onPrevRef = useRef(onPrev);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onPrevRef.current = onPrev;
  }, [onComplete, onPrev]);

  // 現在のスライドインデックスを更新
  const updateCurrentIndex = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const slideWidth = container.clientWidth;
    const newIndex = Math.round(scrollLeft / slideWidth);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < slides.length) {
      setCurrentIndex(newIndex);
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
    } else if (onCompleteRef.current) {
      onCompleteRef.current();
    }
  }, [currentIndex, slides.length]);

  // 特定のスライドへ移動
  const goToSlide = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;

    const slideWidth = container.clientWidth;
    container.scrollTo({
      left: index * slideWidth,
      behavior: 'smooth',
    });
  }, []);

  // 統合されたタッチイベントハンドラ
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStateRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startScrollLeft: container.scrollLeft,
        hasTriggered: false,
        gestureDirection: null,
      };
      setIsTransitioning(false);
      setTranslateY(0);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const state = touchStateRef.current;
      if (state.hasTriggered) return;

      const touch = e.touches[0];
      const diffX = touch.clientX - state.startX;
      const diffY = touch.clientY - state.startY;
      const absDiffX = Math.abs(diffX);
      const absDiffY = Math.abs(diffY);

      // ジェスチャー方向を最初の動きで決定
      if (!state.gestureDirection && (absDiffX > GESTURE_DECISION_THRESHOLD || absDiffY > GESTURE_DECISION_THRESHOLD)) {
        state.gestureDirection = absDiffY > absDiffX ? 'vertical' : 'horizontal';
      }

      // 横スクロール中は親への伝播を防止
      if (state.gestureDirection === 'horizontal') {
        e.stopPropagation();
        return;
      }

      // 縦ジェスチャーの場合のみ特別な処理
      if (state.gestureDirection !== 'vertical') return;

      const scrollLeft = container.scrollLeft;
      const slideWidth = container.clientWidth;
      const currentIdx = Math.round(scrollLeft / slideWidth);
      const isFirstSlide = currentIdx === 0;
      const isLastSlide = currentIdx === slides.length - 1;

      // 端でのみ縦スワイプを許可
      const canMoveUp = isLastSlide && diffY < 0;
      const canMoveDown = isFirstSlide && diffY > 0;

      if (canMoveUp || canMoveDown) {
        // 指の動きに追従（抵抗感を加える）
        const resistance = 0.4;
        setTranslateY(diffY * resistance);

        // 閾値を超えたら遷移をトリガー
        if (canMoveUp && diffY < -SWIPE_THRESHOLD) {
          state.hasTriggered = true;
          triggerTransition('next');
        } else if (canMoveDown && diffY > SWIPE_THRESHOLD) {
          state.hasTriggered = true;
          triggerTransition('prev');
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const state = touchStateRef.current;

      // 縦ジェスチャーで遷移しなかった場合、元に戻す
      if (state.gestureDirection === 'vertical' && !state.hasTriggered) {
        setIsTransitioning(true);
        setTranslateY(0);
        setTimeout(() => setIsTransitioning(false), 150);
        return;
      }

      // 横スワイプで端での追加スワイプ処理
      if (state.gestureDirection === 'horizontal' && !state.hasTriggered) {
        const touch = e.changedTouches[0];
        const diffX = touch.clientX - state.startX;
        const currentScrollLeft = container.scrollLeft;
        const maxScroll = container.scrollWidth - container.clientWidth;

        // 左端で右にスワイプ（前のセクションへ）
        if (state.startScrollLeft <= 5 && diffX > SWIPE_THRESHOLD && currentScrollLeft <= 5) {
          if (onPrevRef.current) {
            onPrevRef.current();
          }
        }

        // 右端で左にスワイプ（次のセクションへ）
        if (state.startScrollLeft >= maxScroll - 5 && diffX < -SWIPE_THRESHOLD && currentScrollLeft >= maxScroll - 5) {
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
        }
      }

      // リセット
      state.gestureDirection = null;
    };

    const triggerTransition = (direction: 'next' | 'prev') => {
      setIsTransitioning(true);
      setTranslateY(direction === 'next' ? -window.innerHeight * 0.3 : window.innerHeight * 0.3);

      setTimeout(() => {
        if (direction === 'next' && onCompleteRef.current) {
          onCompleteRef.current();
        } else if (direction === 'prev' && onPrevRef.current) {
          onPrevRef.current();
        }
        setTranslateY(0);
        setIsTransitioning(false);
      }, 150);
    };

    // スクロール終了検出
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateCurrentIndex, 50);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [slides.length, updateCurrentIndex]);

  // ヒント表示の計算
  const showRightHint = currentIndex === slides.length - 1;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* スクロールコンテナ */}
      <div
        ref={containerRef}
        className="w-full h-full flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x pinch-zoom',
          transform: `translateY(${translateY}px)`,
          transition: isTransitioning ? 'transform 0.15s ease-out' : 'none',
        }}
      >
        {slides.map((slide, index) => (
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
              priority={index === 0}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* ページネーション */}
      <Pagination
        current={currentIndex}
        total={slides.length}
        direction="horizontal"
        onDotClick={goToSlide}
      />


      {/* 最後のスライド：下スワイプヒント */}
      {showRightHint && onComplete && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 animate-bounce pointer-events-none">
          <div
            className="flex flex-col items-center text-white text-xs bg-black/50 px-4 py-2 rounded-full backdrop-blur-md"
            style={{
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)'
            }}
          >
            <svg
              className="w-5 h-5 mb-0.5 drop-shadow-md"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
            <span className="font-medium">Swipe</span>
          </div>
        </div>
      )}

      {/* 中間スライドでの右矢印 */}
      {!showRightHint && currentIndex < slides.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
          aria-label="Next slide"
        >
          <svg className="w-6 h-6 drop-shadow-md" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

    </div>
  );
}
