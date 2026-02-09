'use client';

import { useState, useRef, useEffect } from 'react';
import type { DatePreset } from '@/hooks/useDateRange';

interface DateRangePickerProps {
  from: string;
  to: string;
  preset: DatePreset;
  error: string | null;
  onPresetChange: (preset: DatePreset) => void;
  onCustomRangeChange: (from: string, to: string) => void;
}

const presetOptions: { value: DatePreset; label: string }[] = [
  { value: 'today', label: '今日' },
  { value: '7d', label: '7日間' },
  { value: '30d', label: '30日間' },
  { value: 'custom', label: 'カスタム' },
];

export default function DateRangePicker({
  from,
  to,
  preset,
  error,
  onPresetChange,
  onCustomRangeChange,
}: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(preset === 'custom');
  const [tempFrom, setTempFrom] = useState(from);
  const [tempTo, setTempTo] = useState(to);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempFrom(from);
    setTempTo(to);
  }, [from, to]);

  useEffect(() => {
    setShowCustom(preset === 'custom');
  }, [preset]);

  const handlePresetClick = (value: DatePreset) => {
    if (value === 'custom') {
      setShowCustom(true);
      onPresetChange('custom');
    } else {
      setShowCustom(false);
      onPresetChange(value);
    }
  };

  const handleApplyCustom = () => {
    onCustomRangeChange(tempFrom, tempTo);
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center" ref={dropdownRef}>
      {/* Preset buttons */}
      <div className="flex gap-1 sm:gap-2 flex-wrap">
        {presetOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handlePresetClick(option.value)}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              preset === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Custom date range inputs */}
      {showCustom && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={tempFrom}
              onChange={(e) => setTempFrom(e.target.value)}
              className="px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500 text-sm">〜</span>
            <input
              type="date"
              value={tempTo}
              onChange={(e) => setTempTo(e.target.value)}
              className="px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleApplyCustom}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            適用
          </button>
        </div>
      )}

      {/* Current range display (for non-custom presets) */}
      {!showCustom && (
        <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">
          {formatDisplayDate(from)} 〜 {formatDisplayDate(to)}
        </span>
      )}

      {/* Error message */}
      {error && (
        <span className="text-xs sm:text-sm text-red-500">{error}</span>
      )}
    </div>
  );
}
