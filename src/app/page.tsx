'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import VerticalSwiper, { VerticalSwiperHandle } from '@/components/VerticalSwiper';
import PhoneMockup from '@/components/PhoneMockup';
import SwipeController from '@/components/SwipeController';
import { useIsDesktop } from '@/hooks/useMediaQuery';

export default function Home() {
  const isDesktop = useIsDesktop();
  const swiperRef = useRef<VerticalSwiperHandle>(null);
  const [isHorizontalSection, setIsHorizontalSection] = useState(false);

  const handleSlideInfoChange = useCallback((info: { isHorizontalSection: boolean }) => {
    setIsHorizontalSection(info.isHorizontalSection);
  }, []);

  const handleUp = useCallback(() => {
    swiperRef.current?.goToPrev();
  }, []);

  const handleDown = useCallback(() => {
    swiperRef.current?.goToNext();
  }, []);

  const handleLeft = useCallback(() => {
    swiperRef.current?.goHorizontalPrev();
  }, []);

  const handleRight = useCallback(() => {
    swiperRef.current?.goHorizontalNext();
  }, []);

  // キーボード操作のサポート
  useEffect(() => {
    if (!isDesktop) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handleUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleDown();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleRight();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDesktop, handleUp, handleDown, handleLeft, handleRight]);

  // モバイル表示: フルスクリーン
  if (!isDesktop) {
    return (
      <main className="w-screen h-screen overflow-hidden">
        <VerticalSwiper ref={swiperRef} onSlideInfoChange={handleSlideInfoChange} />
      </main>
    );
  }

  // PC表示: スマホモックアップ + コントローラー
  return (
    <main className="w-screen h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full h-full flex items-center justify-center gap-16">
        {/* 左側: スマホモックアップ */}
        <PhoneMockup>
          <VerticalSwiper ref={swiperRef} onSlideInfoChange={handleSlideInfoChange} />
        </PhoneMockup>

        {/* 右側: コントローラー */}
        <div className="flex flex-col items-center">
          <h2 className="text-white text-lg font-medium mb-6">スワイプ操作</h2>
          <SwipeController
            onUp={handleUp}
            onDown={handleDown}
            onLeft={handleLeft}
            onRight={handleRight}
            isHorizontalSection={isHorizontalSection}
          />
        </div>
      </div>
    </main>
  );
}
