'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getDateRangeFromURL,
  syncDateRangeToURL,
  calculateDateRange,
  validateDateRange,
} from '@/lib/url';

export type DatePreset = 'today' | '7d' | '30d' | 'custom';

export interface DateRangeState {
  from: string;
  to: string;
  preset: DatePreset;
  error: string | null;
}

export interface UseDateRangeReturn extends DateRangeState {
  setPreset: (preset: DatePreset) => void;
  setCustomRange: (from: string, to: string) => void;
  isValid: boolean;
}

export function useDateRange(initialPreset: DatePreset = '7d'): UseDateRangeReturn {
  const [state, setState] = useState<DateRangeState>(() => {
    const { from, to } = calculateDateRange(initialPreset);
    return {
      from,
      to,
      preset: initialPreset,
      error: null,
    };
  });

  // Initialize from URL on mount
  useEffect(() => {
    const urlParams = getDateRangeFromURL();

    if (urlParams.preset && ['today', '7d', '30d'].includes(urlParams.preset)) {
      const { from, to } = calculateDateRange(urlParams.preset);
      setState({
        from,
        to,
        preset: urlParams.preset as DatePreset,
        error: null,
      });
    } else if (urlParams.from && urlParams.to) {
      const validation = validateDateRange(urlParams.from, urlParams.to);
      if (validation.valid) {
        setState({
          from: urlParams.from,
          to: urlParams.to,
          preset: 'custom',
          error: null,
        });
      }
    }
  }, []);

  const setPreset = useCallback((preset: DatePreset) => {
    if (preset === 'custom') {
      setState((prev) => ({ ...prev, preset: 'custom' }));
      return;
    }

    const { from, to } = calculateDateRange(preset);
    setState({
      from,
      to,
      preset,
      error: null,
    });
    syncDateRangeToURL(from, to, preset);
  }, []);

  const setCustomRange = useCallback((from: string, to: string) => {
    const validation = validateDateRange(from, to);

    if (!validation.valid) {
      setState((prev) => ({
        ...prev,
        error: validation.error || 'Invalid date range',
      }));
      return;
    }

    setState({
      from,
      to,
      preset: 'custom',
      error: null,
    });
    syncDateRangeToURL(from, to);
  }, []);

  return {
    ...state,
    setPreset,
    setCustomRange,
    isValid: state.error === null,
  };
}
