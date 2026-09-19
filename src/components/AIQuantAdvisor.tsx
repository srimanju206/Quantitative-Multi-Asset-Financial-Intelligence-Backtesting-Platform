import React, { useState } from 'react';
import { Sparkles, RefreshCw, Bot, ShieldCheck, ChevronRight, CheckCircle2, FileText } from 'lucide-react';
import { AIAnalysisResponse } from '../types';

interface AIQuantAdvisorProps {
  currentMetrics?: any;
}

export const AIQuantAdvisor: React.FC<AIQuantAdvisorProps> = ({ currentMetrics }) => {
  const [memo, setMemo] = useState<AIAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [focusArea, setFocusArea] = useState<string>('comprehensive');

  const generateMemo = async (focus = focusArea) => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/quant-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backtestMetrics: currentMetrics || {
            strategy: 'Dual Momentum & Risk Parity',
            totalReturnPct: 34.2,
            cagr: 21.5,
            benchmarkCagr: 12.8,
            sharpeRatio: 1.68,
            sortinoRatio: 2.14,
            maxDrawdownPct: -11.4,
            alpha: 5.8,
            beta: 0.92,
            annualizedVolatilityPct: 13.8,
            var95DailyPct: 1.65,
            cvar95DailyPct: 2.35
          },
          portfolioWeights: { SPY: '25%', QQQ: '25%', NVDA: '15%', TLT: '15%', GLD: '10%', BTC: '10%' },
          marketRegime: 'Bull Low-Vol',
          stressTestResults: { totalPortfolioImpactPct: -22.4 },
          focus
        })
      });
      const data: AIAnalysisResponse = await res.json();
      setMemo(data);
    } catch (err) {
      console.error('Failed to generate AI quant memo:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">
              AI Quantitative Strategist &amp; Risk Committee Memo
            </h2>
            <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono font-semibold">
              GEMINI 3.8 FLASH ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Institutional hedge fund analysis evaluating factor crowding, left-tail tail risk, volatility targeting, and regime transitions.
          </p>
        </div>

        <button
          id="btn-generate-ai-memo"
          onClick={() => generateMemo()}
          disabled={loading}
          className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-950/60 flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shrink-0"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Synthesizing Strategy...
            </>
          ) : (
            <>
              <Bot className="w-4 h-4" /> Generate Quantitative Audit Memo
            </>
          )}
        </button>
      </div>

      {/* Memo Container */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Investment Committee Memorandum
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>Model: {memo?.generatedBy || 'gemini-3.8-flash'}</span>
            <span>&bull;</span>
            <span>Classification: Internal Quantitative Review</span>
          </div>
        </div>

        {memo ? (
          <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-4">
            <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-300 bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 font-mono">
              {memo.analysis}
            </div>
            {memo.note && (
              <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/60 text-indigo-300 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>{memo.note}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 border border-indigo-800 flex items-center justify-center mx-auto text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">No Memorandum Generated Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Click the "Generate Quantitative Audit Memo" button above to run Gemini 3.8 Flash multi-factor analysis on your backtest metrics and stress tests.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
