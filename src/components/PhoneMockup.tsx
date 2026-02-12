'use client';

import { ReactNode } from 'react';

interface PhoneMockupProps {
  children: ReactNode;
}

export default function PhoneMockup({ children }: PhoneMockupProps) {
  return (
    <div className="relative">
      {/* iPhone風フレーム */}
      <div
        className="relative bg-black rounded-[50px] p-3 shadow-2xl"
        style={{
          width: '375px',
          height: '812px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* ノッチ */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 bg-black rounded-b-3xl z-20"
          style={{
            width: '150px',
            height: '30px',
            top: '12px',
          }}
        >
          {/* カメラ */}
          <div
            className="absolute right-8 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-800"
            style={{
              boxShadow: 'inset 0 0 3px rgba(255,255,255,0.2)',
            }}
          />
        </div>

        {/* 画面コンテンツエリア */}
        <div
          className="relative w-full h-full bg-black rounded-[38px] overflow-hidden"
          style={{
            boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
          }}
        >
          {children}
        </div>

        {/* 下部のホームインジケーター */}
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full z-20"
        />
      </div>
    </div>
  );
}
