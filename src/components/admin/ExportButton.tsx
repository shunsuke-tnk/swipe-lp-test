'use client';

import { useState } from 'react';
import { downloadCSV, formatStatsAsCSV } from '@/lib/export/csv';
import { generatePDF } from '@/lib/export/pdf';
import type { DashboardStats, TimeSeriesPoint } from '@/types/analytics';

interface ExportButtonProps {
  stats: DashboardStats | null;
  timeSeries: TimeSeriesPoint[];
  dateRange: { from: string; to: string };
  contentId: string;
}

export default function ExportButton({
  stats,
  timeSeries,
  dateRange,
  contentId,
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleCSVExport = () => {
    if (!stats) return;

    const csvContent = formatStatsAsCSV(stats, timeSeries, dateRange);
    const filename = `swipelp-analytics-${dateRange.from}-${dateRange.to}.csv`;
    downloadCSV(filename, csvContent);
    setIsOpen(false);
  };

  const handlePDFExport = async () => {
    if (!stats) return;

    setIsExporting(true);
    try {
      const filename = `swipelp-analytics-${dateRange.from}-${dateRange.to}.pdf`;
      await generatePDF(contentId, filename, 'SwipeLP Analytics Report');
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDFの生成に失敗しました');
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  if (!stats) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white border border-gray-300 rounded-lg text-xs md:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {isExporting ? (
          <>
            <span className="animate-spin">⏳</span>
            <span className="hidden sm:inline">エクスポート中...</span>
          </>
        ) : (
          <>
            <span>📥</span>
            <span className="hidden sm:inline">エクスポート</span>
          </>
        )}
      </button>

      {isOpen && !isExporting && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <button
              onClick={handleCSVExport}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-t-lg"
            >
              <span>📊</span>
              CSVダウンロード
            </button>
            <button
              onClick={handlePDFExport}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-b-lg border-t border-gray-100"
            >
              <span>📄</span>
              PDFダウンロード
            </button>
          </div>
        </>
      )}
    </div>
  );
}
