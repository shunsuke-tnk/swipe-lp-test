'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel, Pagination } from 'swiper/modules';
import Image from 'next/image';
import CTAButton from './CTAButton';
import HorizontalSwiper from './HorizontalSwiper';
import { slides } from '@/data/slides';
import type { Swiper as SwiperType } from 'swiper';

import 'swiper/css';
import 'swiper/css/pagination';

export default function VerticalSwiper() {
  const swiperRef = useRef<SwiperType | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

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

  const handleCTAAction = useCallback((action: string) => {
    switch (action) {
      case 'scroll-next':
        goToNext();
        break;
      case 'scroll-prev':
        goToPrev();
        break;
      default:
        break;
    }
  }, [goToNext, goToPrev]);

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    setCurrentSlideIndex(swiper.activeIndex);
  }, []);

  // 横スワイプ完了時に次へ
  const handleHorizontalComplete = useCallback(() => {
    if (swiperRef.current) {
      // 縦スワイプを再有効化してから次へ
      swiperRef.current.allowTouchMove = true;
      swiperRef.current.mousewheel?.enable();
      swiperRef.current.slideNext();
    }
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
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
        modules={[Mousewheel, Pagination]}
        pagination={{
          clickable: true,
          bulletClass: 'swiper-pagination-bullet !bg-white/40 !w-2 !h-2 !mx-1',
          bulletActiveClass: '!bg-white !w-2 !h-4 !rounded-full',
        }}
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

                {/* CTA オーバーレイボタン */}
                {slide.cta && (
                  <CTAButton
                    cta={slide.cta}
                    onAction={() => handleCTAAction(slide.cta!.action)}
                  />
                )}
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* スワイプインジケーター - 横スワイプセクションでは非表示 */}
      {!isHorizontalSection && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-bounce pointer-events-none">
          <div className="flex flex-col items-center text-white/60 text-xs">
            <svg
              className="w-6 h-6 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
            <span>Swipe</span>
          </div>
        </div>
      )}

      {/* 横スワイプセクションでは左右インジケーター */}
      {isHorizontalSection && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-pulse pointer-events-none">
          <div className="flex items-center gap-2 text-white/60 text-xs">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16l-4-4m0 0l4-4m-4 4h18"
              />
            </svg>
            <span>左右にスワイプ</span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
