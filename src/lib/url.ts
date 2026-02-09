'use client';

export function getURLParams(): URLSearchParams {
  if (typeof window === 'undefined') {
    return new URLSearchParams();
  }
  return new URLSearchParams(window.location.search);
}

export function updateURLParams(params: Record<string, string | null>): void {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);

  Object.entries(params).forEach(([key, value]) => {
    if (value === null) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });

  window.history.replaceState({}, '', url.toString());
}

export function syncDateRangeToURL(from: string, to: string, preset?: string): void {
  if (preset && preset !== 'custom') {
    updateURLParams({ preset, from: null, to: null });
  } else {
    updateURLParams({ from, to, preset: null });
  }
}

export function getDateRangeFromURL(): {
  from: string | null;
  to: string | null;
  preset: string | null;
} {
  const params = getURLParams();
  return {
    from: params.get('from'),
    to: params.get('to'),
    preset: params.get('preset'),
  };
}

export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function parseDateFromInput(dateString: string): Date {
  return new Date(dateString + 'T00:00:00');
}

export function calculateDateRange(preset: string): { from: string; to: string } {
  const now = new Date();
  const to = formatDateForInput(now);

  switch (preset) {
    case 'today':
      return { from: to, to };
    case '7d':
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { from: formatDateForInput(sevenDaysAgo), to };
    case '30d':
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { from: formatDateForInput(thirtyDaysAgo), to };
    default:
      const defaultDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { from: formatDateForInput(defaultDaysAgo), to };
  }
}

export function validateDateRange(
  from: string,
  to: string,
  maxDays: number = 90
): { valid: boolean; error?: string } {
  const fromDate = parseDateFromInput(from);
  const toDate = parseDateFromInput(to);
  const now = new Date();

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return { valid: false, error: '無効な日付形式です' };
  }

  if (fromDate > toDate) {
    return { valid: false, error: '開始日は終了日より前である必要があります' };
  }

  if (toDate > now) {
    return { valid: false, error: '未来の日付は選択できません' };
  }

  const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > maxDays) {
    return { valid: false, error: `最大${maxDays}日間まで選択できます` };
  }

  return { valid: true };
}
