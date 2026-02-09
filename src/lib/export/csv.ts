import type { DashboardStats, TimeSeriesPoint, SlideStats } from '@/types/analytics';

export function generateCSV(headers: string[], rows: (string | number)[][]): string {
  const headerLine = headers.join(',');
  const dataLines = rows.map((row) =>
    row.map((cell) => {
      const str = String(cell);
      // Escape quotes and wrap in quotes if contains comma or quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  );
  return [headerLine, ...dataLines].join('\n');
}

export function downloadCSV(filename: string, csvContent: string): void {
  // Add BOM for Excel compatibility with Japanese characters
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatStatsAsCSV(
  stats: DashboardStats,
  timeSeries: TimeSeriesPoint[],
  dateRange: { from: string; to: string }
): string {
  const lines: string[] = [];

  // Header
  lines.push('SwipeLP Analytics Report');
  lines.push(`期間: ${dateRange.from} 〜 ${dateRange.to}`);
  lines.push(`生成日時: ${new Date().toLocaleString('ja-JP')}`);
  lines.push('');

  // Summary
  lines.push('=== 概要 ===');
  lines.push('');
  lines.push('指標,値');
  lines.push(`ページビュー,${stats.totalPageViews}`);
  lines.push(`ユニークユーザー,${stats.uniqueVisitors}`);
  lines.push(`平均滞在時間（秒）,${Math.floor(stats.avgSessionDuration / 1000)}`);
  lines.push(`直帰率（%）,${stats.bounceRate.toFixed(1)}`);
  lines.push(`CTAクリック率（%）,${stats.ctaClickRate.toFixed(1)}`);
  lines.push('');

  // Time Series
  if (timeSeries && timeSeries.length > 0) {
    lines.push('=== 日別推移 ===');
    lines.push('');
    lines.push('日付,ページビュー,ユニークユーザー,セッション');
    timeSeries.forEach((point) => {
      lines.push(`${point.date},${point.pageViews},${point.uniqueVisitors},${point.sessions}`);
    });
    lines.push('');
  }

  // Top Slides
  if (stats.topSlides && stats.topSlides.length > 0) {
    lines.push('=== 閲覧数の多いスライド ===');
    lines.push('');
    lines.push('スライドID,ビュー数');
    stats.topSlides.forEach((slide: SlideStats) => {
      lines.push(`${slide.slideId},${slide.views}`);
    });
    lines.push('');
  }

  // High Bounce Slides
  if (stats.highBounceSlides && stats.highBounceSlides.length > 0) {
    lines.push('=== 離脱率の高いスライド ===');
    lines.push('');
    lines.push('スライドID,離脱率（%）');
    stats.highBounceSlides.forEach((slide: SlideStats) => {
      lines.push(`${slide.slideId},${slide.bounceRate.toFixed(1)}`);
    });
  }

  return lines.join('\n');
}
