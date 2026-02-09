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
    <div className={`absolute left-0 right-0 z-50 pointer-events-none bottom-2 pb-[env(safe-area-inset-bottom)] ${className}`}>
      <div className="flex justify-center">
        {/* ドットインジケーター - 小さくシンプルに */}
        <div
          className="flex items-center gap-1.5 pointer-events-auto bg-black/40 px-2.5 py-1.5 rounded-full backdrop-blur-sm"
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
                    ? 'w-4 h-1.5 bg-white'
                    : 'w-1.5 h-4 bg-white'
                  : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/70'
                }
                ${onDotClick ? 'cursor-pointer' : 'cursor-default'}
              `}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === current ? 'true' : 'false'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
