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
        {/* ドットインジケーター */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {Array.from({ length: total }, (_, index) => (
            <button
              key={index}
              onClick={() => onDotClick?.(index)}
              disabled={!onDotClick}
              className={`
                rounded-full transition-all duration-300 ease-out
                ${index === current
                  ? direction === 'horizontal'
                    ? 'w-6 h-2 bg-white'
                    : 'w-2 h-6 bg-white'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                }
                ${onDotClick ? 'cursor-pointer' : 'cursor-default'}
              `}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === current ? 'true' : 'false'}
            />
          ))}
        </div>

        {/* 数字表示 */}
        <div className="flex items-center gap-1 text-white/70 text-xs font-medium bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
          <span className="text-white font-bold">{current + 1}</span>
          <span>/</span>
          <span>{total}</span>
        </div>
      </div>
    </div>
  );
}
