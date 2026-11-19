import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Plus,
  Layers,
  Palette,
} from 'lucide-react';
import {
  CustomerInquiry,
  FabricChoice,
  Order,
  Product,
  StyleTrendReport,
} from '../types';
import { storage } from '../utils/storage';

interface HabeshaStyleTrendPanelProps {
  orders: Order[];
  products: Product[];
  inquiries: CustomerInquiry[];
  adminToken: string | null;
  onDraftProductFromTrend: (preset: {
    name: string;
    fabric: FabricChoice;
    description: string;
  }) => void;
}

export const HabeshaStyleTrendPanel: React.FC<HabeshaStyleTrendPanelProps> = ({
  orders,
  products,
  inquiries,
  adminToken,
  onDraftProductFromTrend,
}) => {
  const [report, setReport] = useState<StyleTrendReport | null>(() =>
    storage.loadTrendReport()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const salesSnapshot = useMemo(() => {
    const items = orders.flatMap((o) => o.items);
    const unitsSold = items.reduce((s, i) => s + i.quantity, 0);

    const fabricCounts: Record<string, number> = {};
    const tibebCounts: Record<string, number> = {};
    items.forEach((item) => {
      fabricCounts[item.selectedFabric] =
        (fabricCounts[item.selectedFabric] || 0) + item.quantity;
      tibebCounts[item.selectedTibebColor] =
        (tibebCounts[item.selectedTibebColor] || 0) + item.quantity;
    });

    const topFabric =
      Object.entries(fabricCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      'Silk-Blend Shemma';
    const topTibeb =
      Object.entries(tibebCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      'Burnished Gold & Obsidian';

    return {
      orderCount: orders.length,
      unitsSold,
      inquiryCount: inquiries.length,
      topFabric,
      topTibeb,
    };
  }, [orders, inquiries]);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (adminToken && adminToken !== 'cookie-session') {
        headers.Authorization = `Bearer ${adminToken}`;
      }

      const response = await fetch('/api/trends/analyze', {
        method: 'POST',
        credentials: 'same-origin',
        headers,
        body: JSON.stringify({
          orders,
          products,
          inquiries,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.error || 'Unable to complete style trend analysis.'
        );
      }

      const nextReport: StyleTrendReport = {
        executiveSummary: data.executiveSummary,
        risingWeavingPatterns: data.risingWeavingPatterns || [],
        trendingColorCombinations: data.trendingColorCombinations || [],
        atelierActionPlan: data.atelierActionPlan || [],
        generatedAt: data.generatedAt || new Date().toISOString(),
        model: data.model,
      };

      setReport(nextReport);
      storage.saveTrendReport(nextReport);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to reach the trend analysis service.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resolveFabricChoice = (text: string): FabricChoice => {
    const lower = text.toLowerCase();
    if (lower.includes('silk')) return 'Silk-Blend Shemma';
    if (lower.includes('gabi')) return 'Heavy Gabi Weave';
    if (lower.includes('brass') || lower.includes('gold filigree')) {
      return 'Solid Brass & Gold Filigree';
    }
    return 'Hand-Spun Cotton (Menen)';
  };

  return (
    <div className="space-y-6">
      {/* Header & Trigger Card */}
      <div className="bg-white border border-[#E6E0D4] rounded-lg p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-medium text-[#A67F1A]">
            <TrendingUp className="w-4 h-4" />
            <span>Habesha Style Trend Intelligence</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1817]">
            Weaving &amp; Tibeb Color Forecast
          </h2>
          <p className="text-xs sm:text-sm text-[#6B655E] leading-relaxed">
            Analyzes live order volume, fabric selections, Tibeb color choices, and bespoke inquiries to forecast which Ethiopian weaving motifs and palettes to pre-loom next.
          </p>
        </div>

        <button
          type="button"
          disabled={isLoading}
          onClick={handleAnalyze}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1A1817] hover:bg-[#2F2B29] disabled:opacity-60 text-[#FAF8F5] text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw
            className={`w-4 h-4 text-[#C59B27] ${isLoading ? 'animate-spin' : ''}`}
          />
          <span>
            {isLoading
              ? 'Analyzing Sales Data...'
              : report
              ? 'Refresh Trend Analysis'
              : 'Analyze Sales & Style Trends'}
          </span>
        </button>
      </div>

      {/* Live Input Dataset Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E6E0D4] rounded-lg p-4">
          <div className="text-[11px] text-[#6B655E]">Orders Analyzed</div>
          <div className="mt-1 font-serif text-xl font-semibold text-[#1A1817] tabular-nums">
            {salesSnapshot.orderCount}
          </div>
        </div>
        <div className="bg-white border border-[#E6E0D4] rounded-lg p-4">
          <div className="text-[11px] text-[#6B655E]">Garments Sold</div>
          <div className="mt-1 font-serif text-xl font-semibold text-[#1A1817] tabular-nums">
            {salesSnapshot.unitsSold}
          </div>
        </div>
        <div className="bg-white border border-[#E6E0D4] rounded-lg p-4">
          <div className="text-[11px] text-[#6B655E]">Leading Textile</div>
          <div className="mt-1 text-sm font-semibold text-[#1A1817] truncate">
            {salesSnapshot.topFabric}
          </div>
        </div>
        <div className="bg-white border border-[#E6E0D4] rounded-lg p-4">
          <div className="text-[11px] text-[#6B655E]">Top Ordered Tibeb</div>
          <div className="mt-1 text-sm font-semibold text-[#1A1817] truncate">
            {salesSnapshot.topTibeb}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-white border border-[#A64B2A]/40 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#A64B2A] shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-semibold text-[#1A1817]">
                Trend Analysis Unavailable
              </div>
              <p className="text-[#6B655E] mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAnalyze}
            className="px-4 py-2 text-xs font-semibold bg-[#1A1817] text-white rounded-md hover:bg-[#2F2B29] shrink-0 cursor-pointer"
          >
            Retry Analysis
          </button>
        </div>
      )}

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E6E0D4] rounded-lg p-6 space-y-3 animate-pulse">
            <div className="h-4 w-48 bg-[#EAE3D7] rounded" />
            <div className="h-3 w-full bg-[#F3EFE8] rounded" />
            <div className="h-3 w-4/5 bg-[#F3EFE8] rounded" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="bg-white border border-[#E6E0D4] rounded-lg p-5 space-y-3 animate-pulse"
              >
                <div className="h-4 w-36 bg-[#EAE3D7] rounded" />
                <div className="h-3 w-full bg-[#F3EFE8] rounded" />
                <div className="h-3 w-2/3 bg-[#F3EFE8] rounded" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !report && !error && (
        <div className="bg-white border border-[#E6E0D4] rounded-lg p-12 text-center space-y-3">
          <Layers className="w-8 h-8 text-[#C59B27] mx-auto" strokeWidth={1.5} />
          <h3 className="font-serif text-2xl font-semibold text-[#1A1817]">
            Ready to Analyze Atelier Sales
          </h3>
          <p className="text-xs sm:text-sm text-[#6B655E] max-w-md mx-auto leading-relaxed">
            Run an AI trend briefing across your {salesSnapshot.orderCount} orders and{' '}
            {salesSnapshot.inquiryCount} bespoke customer inquiries to uncover rising weaving patterns and high-demand Tibeb colorways.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleAnalyze}
              className="px-5 py-2.5 bg-[#C59B27] hover:bg-[#B0881E] text-[#1A1817] text-xs font-semibold rounded-md transition-colors cursor-pointer"
            >
              Generate Habesha Style Forecast
            </button>
          </div>
        </div>
      )}

      {/* Populated AI Forecast Results */}
      {!isLoading && report && (
        <div className="space-y-6">
          {/* Executive Briefing */}
          <div className="bg-white border border-[#E6E0D4] rounded-lg p-6 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B655E]">
              <span className="font-semibold text-[#164A3B]">
                Atelier Style Briefing
              </span>
              <span className="font-mono">
                Updated{' '}
                {new Date(report.generatedAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p className="text-sm text-[#1A1817] leading-relaxed">
              {report.executiveSummary}
            </p>
          </div>

          {/* Rising Weaving Patterns */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1A1817]">
              <Layers className="w-4 h-4 text-[#C59B27]" />
              <span>Rising Weaving Patterns &amp; Silhouettes</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {report.risingWeavingPatterns.map((pattern, idx) => (
                <div
                  key={`${pattern.patternName}-${idx}`}
                  className="bg-white border border-[#E6E0D4] rounded-lg p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="text-xs text-[#6B655E]">
                      <span className="font-semibold text-[#A67F1A]">
                        {pattern.momentumLabel}
                      </span>
                      <span className="mx-1.5" aria-hidden="true">
                        ·
                      </span>
                      <span>{pattern.fabricPairing}</span>
                    </div>

                    <h3 className="font-serif text-xl font-semibold text-[#1A1817] leading-snug">
                      {pattern.patternName}
                    </h3>

                    <p className="text-xs text-[#4A453F] leading-relaxed">
                      {pattern.demandSignal}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#F0EAE0] flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#6B655E]">
                      {pattern.loomRecommendation}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onDraftProductFromTrend({
                          name: pattern.patternName,
                          fabric: resolveFabricChoice(pattern.fabricPairing),
                          description: `${pattern.demandSignal} ${pattern.loomRecommendation}`,
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-[#FAF8F5] hover:bg-[#F3EFE8] border border-[#E6E0D4] hover:border-[#C59B27] rounded text-[#1A1817] shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-[#C59B27]" />
                      <span>Draft</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Color Combinations */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1A1817]">
              <Palette className="w-4 h-4 text-[#C59B27]" />
              <span>Gaining-Momentum Tibeb Color Combinations</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {report.trendingColorCombinations.map((combo, idx) => (
                <div
                  key={`${combo.paletteName}-${idx}`}
                  className="bg-white border border-[#E6E0D4] rounded-lg p-5 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-md border border-black/10 shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${combo.primaryColorHex} 50%, ${combo.accentColorHex} 50%)`,
                      }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <h3 className="font-serif text-lg font-semibold text-[#1A1817] leading-tight truncate">
                        {combo.paletteName}
                      </h3>
                      <div className="text-[11px] text-[#6B655E] mt-0.5">
                        {combo.targetOccasion}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#4A453F] leading-relaxed">
                    {combo.rationale}
                  </p>

                  <div className="pt-2 border-t border-[#F0EAE0] flex items-center gap-3 text-[11px] font-mono text-[#6B655E]">
                    <span>{combo.primaryColorHex}</span>
                    <span>/</span>
                    <span>{combo.accentColorHex}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Atelier Action Plan */}
          {report.atelierActionPlan.length > 0 && (
            <div className="bg-white border border-[#E6E0D4] rounded-lg p-6 space-y-3">
              <h3 className="font-serif text-lg font-semibold text-[#1A1817]">
                Recommended Shiro Meda Loom Actions
              </h3>
              <ol className="space-y-2.5">
                {report.atelierActionPlan.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-xs sm:text-sm text-[#4A453F]"
                  >
                    <span className="font-mono text-xs font-semibold text-[#A67F1A] mt-0.5 shrink-0">
                      0{idx + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
