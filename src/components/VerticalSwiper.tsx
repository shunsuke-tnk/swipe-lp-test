'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel } from 'swiper/modules';
import Image from 'next/image';
import HorizontalSwiper from './HorizontalSwiper';
import Pagination from './Pagination';
import { slides } from '@/data/slides';
import { useAnalytics } from '@/components/analytics/AnalyticsProvider';
import { ClickTracker } from '@/components/analytics/ClickTracker';
import type { Swiper as SwiperType } from 'swiper';

import 'swiper/css';

export default function VerticalSwiper() {
  const swiperRef = useRef<SwiperType | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const { trackPageView, setCurrentSlide } = useAnalytics();

  // 現在のスライドが横スワイプセクションかどうか
  const currentSlide = slides[currentSlideIndex];
  const isHorizontalSection = currentSlide?.horizontalSlides && currentSlide.horizontalSlides.length > 0;

  // 横スワイプセクションに入ったらSwiperのタッチを無効化
  useEffect(() => {
    if (swiperRef.current) {
      if (isHorizontalSection) {
        swiperRef.current.allowTouchMove = false;
        swiperRef.current.mousewheel?.disable();
      } else {
        swiperRef.current.allowTouchMove = true;
        swiperRef.current.mousewheel?.enable();
      }
    }
  }, [isHorizontalSection]);

  const goToNext = useCallback(() => {
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    }
  }, []);

  const goToPrev = useCallback(() => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev();
    }
  }, []);

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
    setCurrentSlide(slide.id);

    // Track page view
    trackPageView({
      slideId: slide.id,
      slideType: 'vertical',
      scrollDirection: newIndex > prevIndex ? 'next' : 'prev',
    });
  }, [trackPageView, setCurrentSlide]);

  // 横スワイプ完了時に次へ
  const handleHorizontalComplete = useCallback(() => {
    if (swiperRef.current) {
      // 縦スワイプを再有効化してから次へ
      swiperRef.current.allowTouchMove = true;
      swiperRef.current.mousewheel?.enable();
      swiperRef.current.slideNext();
    }
  }, []);

  // 横スワイプで前のセクションへ戻る
  const handleHorizontalPrev = useCallback(() => {
    if (swiperRef.current) {
      // 縦スワイプを再有効化してから前へ
      swiperRef.current.allowTouchMove = true;
      swiperRef.current.mousewheel?.enable();
      swiperRef.current.slidePrev();
    }
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      <ClickTracker slideId={currentSlide?.id || '01'} />
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={handleSlideChange}
        direction="vertical"
        slidesPerView={1}
        speed={600}
        mousewheel={{
          forceToAxis: true,
          thresholdDelta: 30,
          thresholdTime: 500,
        }}
        touchRatio={1.5}
        threshold={10}
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
            {/* 横スワイプ分岐がある場合 */}
            {slide.horizontalSlides && slide.horizontalSlides.length > 0 ? (
              <HorizontalSwiper
                slides={slide.horizontalSlides}
                onComplete={handleHorizontalComplete}
                onPrev={handleHorizontalPrev}
              />
            ) : (
              /* 通常の縦スワイプスライド */
              <div className="relative w-full h-full" style={{ touchAction: 'pan-y' }}>
                <Image
                  src={slide.image}
                  alt={`Slide ${slide.id}`}
                  fill
                  className="object-cover object-center"
                  priority={index < 2}
                />

              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* スワイプインジケーター - 横スワイプセクションでは非表示 */}
      {!isHorizontalSection && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40 animate-bounce pointer-events-none">
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

      {/* カスタムページネーション - 横スワイプセクション以外で表示 */}
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
}
