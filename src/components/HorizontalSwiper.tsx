'use client';

import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';
import Pagination from './Pagination';
import type { Slide } from '@/data/slides';

export interface HorizontalSwiperHandle {
  goToNext: () => void;
  goToPrev: () => void;
  setIndex: (index: number) => void;
  getCurrentIndex: () => number;
}

interface HorizontalSwiperProps {
  slides: NonNullable<Slide['horizontalSlides']>;
  onVerticalSwipe?: (direction: 'next' | 'prev', horizontalIndex: number) => void;
}

const SWIPE_THRESHOLD = 50;
const GESTURE_DECISION_THRESHOLD = 10;
const TRANSITION_DURATION_MS = 300;

const HorizontalSwiper = forwardRef<HorizontalSwiperHandle, HorizontalSwiperProps>(function HorizontalSwiper(
  { slides, onVerticalSwipe },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const transitionTimeoutRef = useRef<number | null>(null);
  const wheelLockedRef = useRef(false);

  const stateRef = useRef({
    currentIndex,
    slidesLength: slides.length,
  });

  useEffect(() => {
    stateRef.current.currentIndex = currentIndex;
    stateRef.current.slidesLength = slides.length;
  }, [currentIndex, slides.length]);

  const onVerticalSwipeRef = useRef(onVerticalSwipe);

  useEffect(() => {
    onVerticalSwipeRef.current = onVerticalSwipe;
  }, [onVerticalSwipe]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const finishTransitionLater = useCallback(() => {
    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
    }
    transitionTimeoutRef.current = window.setTimeout(() => {
      setIsTransitioning(false);
      transitionTimeoutRef.current = null;
    }, TRANSITION_DURATION_MS);
  }, []);

  const setSlideIndex = useCallback((nextIndex: number) => {
    if (slides.length === 0) return;

    const clamped = Math.max(0, Math.min(nextIndex, slides.length - 1));

    setIsTransitioning(true);
    setTranslateX(0);
    setTranslateY(0);
    setCurrentIndex(clamped);
    finishTransitionLater();
  }, [finishTransitionLater, slides.length]);

  const goToNext = useCallback(() => {
    const { currentIndex: idx, slidesLength } = stateRef.current;
    if (idx < slidesLength - 1) {
      setSlideIndex(idx + 1);
    } else {
      setIsTransitioning(true);
      setTranslateX(0);
      setTranslateY(0);
      finishTransitionLater();
    }
  }, [finishTransitionLater, setSlideIndex]);

  const goToPrev = useCallback(() => {
    const { currentIndex: idx } = stateRef.current;
    if (idx > 0) {
      setSlideIndex(idx - 1);
    } else {
      setIsTransitioning(true);
      setTranslateX(0);
      setTranslateY(0);
      finishTransitionLater();
    }
  }, [finishTransitionLater, setSlideIndex]);

  const setIndex = useCallback((index: number) => {
    setSlideIndex(index);
  }, [setSlideIndex]);

  const getCurrentIndex = useCallback(() => {
    return stateRef.current.currentIndex;
  }, []);

  useImperativeHandle(ref, () => ({
    goToNext,
    goToPrev,
    setIndex,
    getCurrentIndex,
  }), [goToNext, goToPrev, setIndex, getCurrentIndex]);

  useEffect(() => {
    if (currentIndex <= slides.length - 1) return;
    setSlideIndex(Math.max(0, slides.length - 1));
  }, [currentIndex, setSlideIndex, slides.length]);

  const touchStateRef = useRef({
    startX: 0,
    startY: 0,
    hasTriggered: false,
    gestureDirection: null as 'horizontal' | 'vertical' | null,
    isActive: false,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resetPosition = () => {
      setIsTransitioning(true);
      setTranslateX(0);
      setTranslateY(0);
      finishTransitionLater();
    };

    const triggerVerticalTransition = (direction: 'next' | 'prev') => {
      if (!onVerticalSwipeRef.current) {
        resetPosition();
        return;
      }

      setIsTransitioning(true);
      setTranslateY(direction === 'next' ? -window.innerHeight * 0.25 : window.innerHeight * 0.25);

      window.setTimeout(() => {
        onVerticalSwipeRef.current?.(direction, stateRef.current.currentIndex);
        setTranslateX(0);
        setTranslateY(0);
        setIsTransitioning(false);
      }, 180);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (touchStateRef.current.isActive) return;

      const touch = e.touches[0];
      touchStateRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        hasTriggered: false,
        gestureDirection: null,
        isActive: true,
      };
      setIsTransitioning(false);
      setTranslateX(0);
      setTranslateY(0);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const state = touchStateRef.current;
      if (!state.isActive || state.hasTriggered) return;

      const touch = e.touches[0];
      const diffX = touch.clientX - state.startX;
      const diffY = touch.clientY - state.startY;
      const absDiffX = Math.abs(diffX);
      const absDiffY = Math.abs(diffY);

      if (!state.gestureDirection && (absDiffX > GESTURE_DECISION_THRESHOLD || absDiffY > GESTURE_DECISION_THRESHOLD)) {
        state.gestureDirection = absDiffY > absDiffX ? 'vertical' : 'horizontal';
      }

      if (!state.gestureDirection) return;

      e.preventDefault();

      if (state.gestureDirection === 'horizontal') {
        setTranslateX(diffX * 0.5);
        setTranslateY(0);
      } else {
        setTranslateY(diffY * 0.4);
        setTranslateX(0);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const state = touchStateRef.current;
      if (!state.isActive) return;

      const touch = e.changedTouches[0];
      const diffX = touch.clientX - state.startX;
      const diffY = touch.clientY - state.startY;

      if (!state.gestureDirection) {
        state.isActive = false;
        return;
      }

      state.hasTriggered = true;

      if (state.gestureDirection === 'horizontal') {
        if (diffX < -SWIPE_THRESHOLD) {
          goToNext();
        } else if (diffX > SWIPE_THRESHOLD) {
          goToPrev();
        } else {
          resetPosition();
        }
      } else {
        if (diffY < -SWIPE_THRESHOLD) {
          triggerVerticalTransition('next');
        } else if (diffY > SWIPE_THRESHOLD) {
          triggerVerticalTransition('prev');
        } else {
          resetPosition();
        }
      }

      state.gestureDirection = null;
      state.isActive = false;
    };

    const handleWheel = (e: WheelEvent) => {
      if (wheelLockedRef.current) return;

      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      if (absX < 8 && absY < 8) return;

      if (absY > absX && absY > SWIPE_THRESHOLD / 2 && onVerticalSwipeRef.current) {
        e.preventDefault();
        wheelLockedRef.current = true;
        onVerticalSwipeRef.current(e.deltaY > 0 ? 'next' : 'prev', stateRef.current.currentIndex);
        window.setTimeout(() => {
          wheelLockedRef.current = false;
        }, TRANSITION_DURATION_MS);
        return;
      }

      if (absX > absY && absX > SWIPE_THRESHOLD / 2) {
        e.preventDefault();
        wheelLockedRef.current = true;
        if (e.deltaX > 0) {
          goToNext();
        } else {
          goToPrev();
        }
        window.setTimeout(() => {
          wheelLockedRef.current = false;
        }, TRANSITION_DURATION_MS);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [finishTransitionLater, goToNext, goToPrev]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translateX(calc(-${(currentIndex * 100) / Math.max(slides.length, 1)}% + ${translateX}px)) translateY(${translateY}px)`,
          transition: isTransitioning ? 'transform 0.3s ease-out' : 'none',
          display: 'flex',
          width: `${slides.length * 100}%`,
          height: '100%',
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="relative h-full"
            style={{
              width: `${100 / slides.length}%`,
              flexShrink: 0,
            }}
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

      <Pagination
        current={currentIndex}
        total={slides.length}
        direction="horizontal"
        onDotClick={setSlideIndex}
      />
    </div>
  );
});

export default HorizontalSwiper;
