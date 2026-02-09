'use client';

import { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, EffectCreative } from 'swiper/modules';
import Image from 'next/image';
import CTAButton from './CTAButton';
import type { Slide } from '@/data/slides';
import type { Swiper as SwiperType } from 'swiper';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-creative';

interface HorizontalSwiperProps {
  slides: NonNullable<Slide['horizontalSlides']>;
  onComplete?: () => void;
}

export default function HorizontalSwiper({ slides, onComplete }: HorizontalSwiperProps) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [isAtEnd, setIsAtEnd] = useState(false);

  const handleSlideChange = (swiper: SwiperType) => {
    // 最後のスライドかどうかをチェック
    setIsAtEnd(swiper.isEnd);
  };

  // CTAボタンからの次へ進むアクション
  const handleNextSlide = () => {
    if (swiperRef.current) {
      if (swiperRef.current.isEnd) {
        // 最後のスライドなら次のセクションへ
        if (onComplete) {
          onComplete();
        }
      } else {
        swiperRef.current.slideNext();
      }
    }
  };

  // 最後のスライドで更にスワイプしたら次のセクションへ
  const handleTouchEnd = () => {
    if (isAtEnd && swiperRef.current) {
      // 最後のスライドで右端に達している場合
      const swiper = swiperRef.current;
      if (swiper.translate <= swiper.maxTranslate()) {
        // 更にスワイプしようとしたら次のセクションへ
        if (onComplete) {
          setTimeout(() => {
            onComplete();
          }, 200);
        }
      }
    }
  };

  return (
    <div
      className="w-full h-full"
      style={{ touchAction: 'pan-x' }}
    >
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        direction="horizontal"
        slidesPerView={1}
        spaceBetween={0}
        speed={400}
        nested={true}
        // タッチ設定
        touchRatio={1}
        threshold={10}
        resistanceRatio={0.5}
        followFinger={true}
        // クリエイティブエフェクトでスムーズな遷移
        effect="creative"
        creativeEffect={{
          prev: {
            translate: ['-100%', 0, 0],
            opacity: 0.5,
          },
          next: {
            translate: ['100%', 0, 0],
            opacity: 0.5,
          },
        }}
        modules={[Pagination, EffectCreative]}
        pagination={{
          clickable: true,
          bulletClass: 'swiper-pagination-bullet !bg-white/50 !w-2 !h-2',
          bulletActiveClass: '!bg-white !w-3 !h-3',
        }}
        onSlideChange={handleSlideChange}
        onTouchEnd={handleTouchEnd}
        className="w-full h-full"
        style={{
          // @ts-expect-error CSS custom property
          '--swiper-pagination-bottom': '80px',
        }}
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id} className="relative">
            <div className="relative w-full h-full">
              <Image
                src={slide.image}
                alt={`Slide ${slide.id}`}
                fill
                className="object-cover object-center"
                priority
              />
              {slide.cta && (
                <CTAButton
                  cta={slide.cta}
                  onAction={handleNextSlide}
                />
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
