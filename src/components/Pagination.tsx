'use client';

interface PaginationProps {
  current: number;
  total: number;
  direction?: 'vertical' | 'horizontal';
  onDotClick?: (index: number) => void;
  className?: string;
}

export default function Pagination({
  current,
  total,
  direction = 'vertical',
  onDotClick,
  className = '',
}: PaginationProps) {
  return (
    <div className={`absolute left-0 right-0 z-50 pointer-events-none ${direction === 'horizontal' ? 'bottom-20' : 'bottom-24'} ${className}`}>
      <div className="flex flex-col items-center gap-2">
        {/* ドットインジケーター - シャドウ付きで視認性向上 */}
        <div
          className="flex items-center gap-2 pointer-events-auto bg-black/50 px-3 py-2 rounded-full backdrop-blur-md"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
        >
          {Array.from({ length: total }, (_, index) => (
            <button
              key={index}
              onClick={() => onDotClick?.(index)}
              disabled={!onDotClick}
              className={`
                rounded-full transition-all duration-300 ease-out
                ${index === current
                  ? direction === 'horizontal'
                    ? 'w-6 h-2 bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]'
                    : 'w-2 h-6 bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]'
                  : 'w-2 h-2 bg-white/60 hover:bg-white/80'
                }
                ${onDotClick ? 'cursor-pointer' : 'cursor-default'}
              `}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === current ? 'true' : 'false'}
            />
          ))}
        </div>

        {/* 数字表示 - より濃い背景とシャドウ */}
        <div
          className="flex items-center gap-1 text-white text-xs font-medium bg-black/60 px-3 py-1 rounded-full backdrop-blur-md"
          style={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
          }}
        >
          <span className="font-bold">{current + 1}</span>
          <span className="text-white/80">/</span>
          <span className="text-white/80">{total}</span>
        </div>
      </div>
    </div>
  );
}
