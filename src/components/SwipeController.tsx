'use client';

interface SwipeControllerProps {
  onUp: () => void;
  onDown: () => void;
  onLeft: () => void;
  onRight: () => void;
  isHorizontalSection?: boolean;
}

export default function SwipeController({
  onUp,
  onDown,
  onLeft,
  onRight,
  isHorizontalSection = false,
}: SwipeControllerProps) {
  const buttonBaseClass =
    'w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95';
  const activeButtonClass = 'bg-white text-gray-900 shadow-lg hover:bg-gray-100';
  const inactiveButtonClass = 'bg-gray-700/50 text-gray-500 cursor-not-allowed';

  return (
    <div className="flex flex-col items-center gap-2">
      {/* 操作説明 */}
      <div className="text-gray-400 text-sm mb-2 text-center">
        {isHorizontalSection ? '↑ ↓ で縦移動 / ← → で横移動' : '↑ ↓ で縦スワイプ'}
      </div>

      {/* 十字キー配置 */}
      <div className="grid grid-cols-3 gap-2" style={{ width: '176px' }}>
        {/* 上段: 上ボタン */}
        <div />
        <button
          onClick={onUp}
          className={`${buttonBaseClass} ${activeButtonClass}`}
          aria-label="上へスワイプ"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <div />

        {/* 中段: 左・中央・右ボタン */}
        <button
          onClick={onLeft}
          className={`${buttonBaseClass} ${isHorizontalSection ? activeButtonClass : inactiveButtonClass}`}
          disabled={!isHorizontalSection}
          aria-label="左へスワイプ"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* 中央は空き */}
        <div className="w-14 h-14 rounded-full bg-gray-800/30 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-gray-600" />
        </div>

        <button
          onClick={onRight}
          className={`${buttonBaseClass} ${isHorizontalSection ? activeButtonClass : inactiveButtonClass}`}
          disabled={!isHorizontalSection}
          aria-label="右へスワイプ"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* 下段: 下ボタン */}
        <div />
        <button
          onClick={onDown}
          className={`${buttonBaseClass} ${activeButtonClass}`}
          aria-label="下へスワイプ"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div />
      </div>

      {/* キーボードショートカットの説明 */}
      <div className="text-gray-500 text-xs mt-4 text-center">
        キーボード: 矢印キー
      </div>
    </div>
  );
}
