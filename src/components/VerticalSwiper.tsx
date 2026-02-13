'use client';

import { useRef, useCallback, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel } from 'swiper/modules';
import Image from 'next/image';
import HorizontalSwiper, { HorizontalSwiperHandle } from './HorizontalSwiper';
import Pagination from './Pagination';
import { slides } from '@/data/slides';
import { useAnalytics } from '@/components/analytics/AnalyticsProvider';
import { ClickTracker } from '@/components/analytics/ClickTracker';
import type { Swiper as SwiperType } from 'swiper';

import 'swiper/css';

export interface VerticalSwiperHandle {
  goToNext: () => void;
  goToPrev: () => void;
  goHorizontalNext: () => void;
  goHorizontalPrev: () => void;
}

interface VerticalSwiperProps {
  onSlideInfoChange?: (info: { isHorizontalSection: boolean; currentIndex: number; totalSlides: number }) => void;
}

const VerticalSwiper = forwardRef<VerticalSwiperHandle, VerticalSwiperProps>(function VerticalSwiper(
  { onSlideInfoChange },
  ref
) {
  const swiperRef = useRef<SwiperType | null>(null);
  const horizontalSwiperRefs = useRef<Record<number, HorizontalSwiperHandle | null>>({});
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  // Track the actual displayed slide ID (including horizontal sub-slides like 04a, 05b, etc.)
  const [activeSlideId, setActiveSlideId] = useState('01');
  const { trackPageView, setCurrentSlide } = useAnalytics();

  const currentSlide = slides[currentSlideIndex];
  const isHorizontalSection = currentSlide?.horizontalSlides && currentSlide.horizontalSlides.length > 0;
  const transitionSpeed = 420;

  useEffect(() => {
    onSlideInfoChange?.({
      isHorizontalSection: !!isHorizontalSection,
      currentIndex: currentSlideIndex,
      totalSlides: slides.length,
    });
  }, [isHorizontalSection, currentSlideIndex, onSlideInfoChange]);

  useEffect(() => {
    if (swiperRef.current) {
      if (isHorizontalSection) {
        swiperRef.current.allowTouchMove = false;
      } else {
        swiperRef.current.allowTouchMove = true;
      }
    }
  }, [isHorizontalSection]);

  const registerHorizontalSwiper = useCallback((verticalIndex: number, instance: HorizontalSwiperHandle | null) => {
    horizontalSwiperRefs.current[verticalIndex] = instance;
  }, []);

  // Callback when horizontal slide changes - updates the active slide ID for click tracking
  const handleHorizontalSlideChange = useCallback((slideId: string, _index: number) => {
    setActiveSlideId(slideId);
    setCurrentSlide(slideId);
    trackPageView({
      slideId,
      slideType: 'horizontal',
      scrollDirection: 'next',
    });
  }, [setCurrentSlide, trackPageView]);

  const moveVerticalFromHorizontal = useCallback((
    fromVerticalIndex: number,
    direction: 'next' | 'prev',
    fromHorizontalIndex: number
  ) => {
    const swiper = swiperRef.current;
    if (!swiper) return;

    const targetVerticalIndex = direction === 'next' ? fromVerticalIndex + 1 : fromVerticalIndex - 1;
    if (targetVerticalIndex < 0 || targetVerticalIndex >= slides.length) return;

    const targetSlide = slides[targetVerticalIndex];
    if (targetSlide.horizontalSlides && targetSlide.horizontalSlides.length > 0) {
      // 04b -> 05a の要件に合わせて、04から05へ下移動する場合は常にaを表示する
      const shouldResetToFirstHorizontal =
        direction === 'next' && fromVerticalIndex === 3 && targetVerticalIndex === 4;

      const targetHorizontalIndex = shouldResetToFirstHorizontal
        ? 0
        : Math.min(fromHorizontalIndex, targetSlide.horizontalSlides.length - 1);
      horizontalSwiperRefs.current[targetVerticalIndex]?.setIndex(targetHorizontalIndex);
    }

    swiper.allowTouchMove = true;
    swiper.slideTo(targetVerticalIndex);
  }, []);

  const goToNext = useCallback(() => {
    if (!swiperRef.current) return;

    if (isHorizontalSection) {
      const horizontalIndex = horizontalSwiperRefs.current[currentSlideIndex]?.getCurrentIndex()
        ?? 0;
      moveVerticalFromHorizontal(currentSlideIndex, 'next', horizontalIndex);
      return;
    }

    swiperRef.current.slideNext();
  }, [currentSlideIndex, isHorizontalSection, moveVerticalFromHorizontal]);

  const goToPrev = useCallback(() => {
    if (!swiperRef.current) return;

    if (isHorizontalSection) {
      const horizontalIndex = horizontalSwiperRefs.current[currentSlideIndex]?.getCurrentIndex()
        ?? 0;
      moveVerticalFromHorizontal(currentSlideIndex, 'prev', horizontalIndex);
      return;
    }

    swiperRef.current.slidePrev();
  }, [currentSlideIndex, isHorizontalSection, moveVerticalFromHorizontal]);

  const goHorizontalNext = useCallback(() => {
    horizontalSwiperRefs.current[currentSlideIndex]?.goToNext();
  }, [currentSlideIndex]);

  const goHorizontalPrev = useCallback(() => {
    horizontalSwiperRefs.current[currentSlideIndex]?.goToPrev();
  }, [currentSlideIndex]);

  useImperativeHandle(ref, () => ({
    goToNext,
    goToPrev,
    goHorizontalNext,
    goHorizontalPrev,
  }), [goToNext, goToPrev, goHorizontalNext, goHorizontalPrev]);

  const goToSlide = useCallback((index: number) => {
    if (swiperRef.current) {
      swiperRef.current.slideTo(index);
    }
  }, []);

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    const newIndex = swiper.activeIndex;
    const slide = slides[newIndex];
    const prevIndex = swiper.previousIndex;

    setCurrentSlideIndex(newIndex);

    // For horizontal sections, use the first horizontal slide ID; otherwise use the main slide ID
    const effectiveSlideId = slide.horizontalSlides && slide.horizontalSlides.length > 0
      ? slide.horizontalSlides[0].id
      : slide.id;

    setActiveSlideId(effectiveSlideId);
    setCurrentSlide(effectiveSlideId);

    trackPageView({
      slideId: effectiveSlideId,
      slideType: 'vertical',
      scrollDirection: newIndex > prevIndex ? 'next' : 'prev',
    });
  }, [trackPageView, setCurrentSlide]);

  return (
    <div className="w-full h-full overflow-hidden bg-black" data-click-area style={{ overscrollBehavior: 'none' }}>
      <ClickTracker slideId={activeSlideId} />
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          // Use non-overshooting easing for smooth slide while avoiding bounce-like tail.
          if (swiper.wrapperEl) {
            swiper.wrapperEl.style.transitionTimingFunction = 'cubic-bezier(0.25, 0.1, 0.25, 1)';
          }
        }}
        onSlideChangeTransitionStart={(swiper) => {
          if (swiper.wrapperEl) {
            swiper.wrapperEl.style.transitionTimingFunction = 'cubic-bezier(0.25, 0.1, 0.25, 1)';
          }
        }}
        onSlideChange={handleSlideChange}
        direction="vertical"
        slidesPerView={1}
        speed={transitionSpeed}
        cssMode={false}
        mousewheel={{
          forceToAxis: true,
          thresholdDelta: 60,
          thresholdTime: 400,
          releaseOnEdges: false,
        }}
        touchRatio={1.5}
        threshold={10}
        resistance={false}
        resistanceRatio={0}
        followFinger
        simulateTouch
        touchReleaseOnEdges={false}
        passiveListeners={false}
        preventInteractionOnTransition
        shortSwipes
        longSwipesRatio={0.15}
        modules={[Mousewheel]}
        className="w-full h-full vertical-swiper"
        style={{
          // @ts-expect-error CSS custom property
          '--swiper-pagination-bottom': '20px',
          '--swiper-pagination-right': '10px',
        }}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={slide.id} className="relative">
            {slide.horizontalSlides && slide.horizontalSlides.length > 0 ? (
              <HorizontalSwiper
                ref={(instance) => registerHorizontalSwiper(index, instance)}
                slides={slide.horizontalSlides}
                onVerticalSwipe={(direction, horizontalIndex) => moveVerticalFromHorizontal(index, direction, horizontalIndex)}
                onSlideChange={handleHorizontalSlideChange}
              />
            ) : (
              <div className="relative w-full h-full" style={{ touchAction: 'pan-y' }}>
                <div className="relative w-full h-full">
                  <Image
                    src={slide.image}
                    alt={`Slide ${slide.id}`}
                    fill
                    className="object-contain object-center"
                    priority={index < 2}
                    draggable={false}
                  />
                </div>
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>

      {!isHorizontalSection && currentSlideIndex < slides.length - 1 && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div
            className="flex flex-col items-center text-white text-xs bg-black/50 px-4 py-2 rounded-full backdrop-blur-md"
            style={{
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
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

      {!isHorizontalSection && (
        <Pagination
          current={currentSlideIndex}
          total={slides.length}
          direction="vertical"
          onDotClick={goToSlide}
        />
      )}
    </div>
  );
});

export default VerticalSwiper;
