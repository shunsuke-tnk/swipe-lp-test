'use client';

interface MobileHeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export default function MobileHeader({ onMenuClick, title = 'SwipeLP' }: MobileHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 lg:hidden">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="メニューを開く"
      >
        <svg
          className="w-6 h-6 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <div className="w-10" /> {/* Spacer for centering */}
    </div>
  );
}
