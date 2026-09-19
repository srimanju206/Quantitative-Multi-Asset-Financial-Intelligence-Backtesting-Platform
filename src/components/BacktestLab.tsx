import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Sliders,
  DollarSign,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ShieldCheck,
  Percent,
  CheckSquare,
  Square,
  Activity,
  Download,
  AlertCircle
} from 'lucide-react';
import { BacktestParams, BacktestResponse, StrategyType } from '../types';

interface BacktestLabProps {
  onRunComplete?: (result: BacktestResponse) => void;
}

const AVAILABLE_ASSETS = [
  { sym: 'SPY', name: 'S&P 500', cat: 'Equities' },
  { sym: 'QQQ', name: 'Nasdaq-100', cat: 'Equities' },
  { sym: 'NVDA', name: 'Nvidia Corp', cat: 'Equities' },
  { sym: 'MSFT', name: 'Microsoft', cat: 'Equities' },
  { sym: 'TLT', name: '20+ Yr Treasury', cat: 'Fixed Income' },
  { sym: 'IEF', name: '7-10 Yr Treasury', cat: 'Fixed Income' },
  { sym: 'HYG', name: 'High Yield Credit', cat: 'Fixed Income' },
  { sym: 'GLD', name: 'Gold Bullion', cat: 'Commodities' },
  { sym: 'USO', name: 'Crude Oil', cat: 'Commodities' },
  { sym: 'CPER', name: 'Copper Index', cat: 'Commodities' },
  { sym: 'EUR/USD', name: 'EUR / USD', cat: 'FX' },
  { sym: 'USD/JPY', name: 'USD / JPY', cat: 'FX' },
  { sym: 'BTC', name: 'Bitcoin', cat: 'Crypto' },
  { sym: 'ETH', name: 'Ethereum', cat: 'Crypto' },
];

export const BacktestLab: React.FC<BacktestLabProps> = ({ onRunComplete }) => {
  const [params, setParams] = useState<BacktestParams>({
    strategy: 'momentum',
    assets: ['SPY', 'QQQ', 'NVDA', 'TLT', 'GLD'],
    benchmark: 'SPY',
    initialCapital: 100000,
    lookbackDays: 252,
    slippageBps: 5,
    feeBps: 2,
    rebalanceFreq: 'weekly',
    stopLossPct: 8,
    takeProfitPct: 25,
    riskTargetVol: 12
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<BacktestResponse | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    portfolio: number;
    benchmark: number;
    drawdown: number;
  } | null>(null);

  const runBacktest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: BacktestResponse = await res.json();
      setResult(data);
      if (onRunComplete) onRunComplete(data);
    } catch (err) {
      console.error('Backtest error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runBacktest();
  }, []);

  const toggleAsset = (sym: string) => {
    if (params.assets.includes(sym)) {
      if (params.assets.length > 1) {
        setParams({ ...params, assets: params.assets.filter(a => a !== sym) });
      }
    } else {
      setParams({ ...params, assets: [...params.assets, sym] });
    }
  };

  const selectStrategyPreset = (strat: StrategyType) => {
    if (strat === 'momentum') {
      setParams({
        ...params,
        strategy: 'momentum',
        assets: ['SPY', 'QQQ', 'NVDA', 'BTC', 'GLD'],
        riskTargetVol: 16,
        rebalanceFreq: 'weekly'
      });
    } else if (strat === 'risk_parity') {
      setParams({
        ...params,
        strategy: 'risk_parity',
        assets: ['SPY', 'TLT', 'IEF', 'GLD', 'HYG'],
        riskTargetVol: 10,
        rebalanceFreq: 'monthly'
      });
    } else if (strat === 'mean_reversion') {
      setParams({
        ...params,
        strategy: 'mean_reversion',
        assets: ['SPY', 'QQQ', 'TLT', 'USO', 'EUR/USD'],
        riskTargetVol: 12,
        rebalanceFreq: 'daily'
      });
    } else {
      setParams({
        ...params,
        strategy: 'volatility_targeting',
        assets: ['SPY', 'QQQ', 'TLT', 'GLD'],
        riskTargetVol: 12,
        rebalanceFreq: 'weekly'
      });
    }
  };

  // Helper for rendering SVG charts
  const renderEquityChart = () => {
    if (!result || !result.equityCurve.length) return null;

    const data = result.equityCurve;
    const minVal = Math.min(...data.map(d => Math.min(d.portfolioValue, d.benchmarkValue))) * 0.95;
    const maxVal = Math.max(...data.map(d => Math.max(d.portfolioValue, d.benchmarkValue))) * 1.05;
    const range = maxVal - minVal || 1;

    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 30, bottom: 40, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const getX = (idx: number) => padding.left + (idx / (data.length - 1 || 1)) * chartW;
    const getY = (val: number) => padding.top + chartH - ((val - minVal) / range) * chartH;

    const portPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.portfolioValue).toFixed(1)}`).join(' ');
    const bmkPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.benchmarkValue).toFixed(1)}`).join(' ');

    const areaPath = `${portPath} L ${getX(data.length - 1)} ${padding.top + chartH} L ${getX(0)} ${padding.top + chartH} Z`;

    return (
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair"
          onMouseLeave={() => setHoveredPoint(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = e.clientX - rect.left;
            const normX = (relX - (padding.left / width) * rect.width) / ((chartW / width) * rect.width);
            const clamped = Math.max(0, Math.min(1, normX));
            const idx = Math.round(clamped * (data.length - 1));
            const pt = data[idx];
            if (pt) {
              setHoveredPoint({
                date: pt.date,
                portfolio: pt.portfolioValue,
                benchmark: pt.benchmarkValue,
                drawdown: pt.drawdownPct
              });
            }
          }}
        >
          <defs>
            <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="portStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((t, idx) => {
            const y = padding.top + chartH * (1 - t);
            const val = minVal + range * t;
            return (
              <g key={idx}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10" fontFamily="monospace">
                  ${(val / 1000).toFixed(0)}k
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#portGrad)" />

          {/* Benchmark Line (Slate Gray) */}
          <path d={bmkPath} fill="none" stroke="#64748b" strokeWidth="1.8" strokeDasharray="4 4" />

          {/* Strategy Line (Pink to Sky Blue Gradient) */}
          <path d={portPath} fill="none" stroke="url(#portStroke)" strokeWidth="2.5" strokeLinecap="round" />

          {/* Date ticks */}
          {[0, Math.floor(data.length / 3), Math.floor((data.length * 2) / 3), data.length - 1].map((idx) => {
            const d = data[idx];
            if (!d) return null;
            return (
              <text key={idx} x={getX(idx)} y={height - 12} textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">
                {d.date}
              </text>
            );
          })}
        </svg>

        {/* Hover inspection card */}
        {hoveredPoint && (
          <div className="absolute top-2 right-4 bg-slate-900/90 border border-slate-700 px-3 py-2 rounded-xl text-xs font-mono shadow-xl pointer-events-none">
            <div className="text-slate-400 text-[10px] mb-1 font-sans">{hoveredPoint.date}</div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-cyan-400 font-bold">Strategy:</span>
              <span className="text-slate-100 font-bold">${hoveredPoint.portfolio.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Benchmark:</span>
              <span className="text-slate-300">${hoveredPoint.benchmark.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Drawdown:</span>
              <span className={hoveredPoint.drawdown < -10 ? 'text-rose-400' : 'text-amber-400'}>
                {hoveredPoint.drawdown}%
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Strategy Presets Bar */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pink-400" />
            Quantitative Strategy Lab &amp; Execution Backtester
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Formulate multi-asset factor models, simulate slippage &amp; commissions, and benchmark against S&amp;P 500 with zero lookahead bias.
          </p>
        </div>

        {/* Strategy Presets */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
          <button
            id="preset-momentum"
            onClick={() => selectStrategyPreset('momentum')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              params.strategy === 'momentum' ? 'bg-gradient-to-r from-pink-600 to-sky-600 text-white font-semibold shadow-md shadow-pink-950/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dual Momentum
          </button>
          <button
            id="preset-risk-parity"
            onClick={() => selectStrategyPreset('risk_parity')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              params.strategy === 'risk_parity' ? 'bg-gradient-to-r from-pink-600 to-sky-600 text-white font-semibold shadow-md shadow-pink-950/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Risk Parity (Inverse Vol)
          </button>
          <button
            id="preset-mean-rev"
            onClick={() => selectStrategyPreset('mean_reversion')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              params.strategy === 'mean_reversion' ? 'bg-gradient-to-r from-pink-600 to-sky-600 text-white font-semibold shadow-md shadow-pink-950/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mean Reversion (Z-Score)
          </button>
          <button
            id="preset-vol-target"
            onClick={() => selectStrategyPreset('volatility_targeting')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              params.strategy === 'volatility_targeting' ? 'bg-gradient-to-r from-pink-600 to-sky-600 text-white font-semibold shadow-md shadow-pink-950/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vol Target Equal Weight
          </button>
        </div>
      </div>

      {/* Control Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Asset Selection Matrix (2 cols on lg) */}
        <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" /> Active Asset Universe ({params.assets.length} Selected)
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Cross-Asset Basket</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AVAILABLE_ASSETS.map((asset) => {
              const isSelected = params.assets.includes(asset.sym);
              return (
                <button
                  key={asset.sym}
                  id={`asset-toggle-${asset.sym}`}
                  onClick={() => toggleAsset(asset.sym)}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs border transition-all text-left ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-200 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-bold font-mono">{asset.sym}</div>
                    <div className="text-[10px] text-slate-500">{asset.name}</div>
                  </div>
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Backtest Hyperparameters */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-4 rounded-xl space-y-3 text-xs">
          <span className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-indigo-400" /> Risk &amp; Sizing Rules
          </span>

          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Initial Capital</span>
                <span className="font-mono text-slate-200 font-bold">${params.initialCapital.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="500000"
                step="10000"
                value={params.initialCapital}
                onChange={(e) => setParams({ ...params, initialCapital: Number(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Annual Vol Target</span>
                <span className="font-mono text-cyan-400 font-bold">{params.riskTargetVol}%</span>
              </div>
              <input
                type="range"
                min="6"
                max="28"
                step="1"
                value={params.riskTargetVol}
                onChange={(e) => setParams({ ...params, riskTargetVol: Number(e.target.value) })}
                className="w-full accent-indigo-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Lookback Window</span>
                <span className="font-mono text-slate-200 font-bold">{params.lookbackDays} Days (~{(params.lookbackDays / 252).toFixed(1)}y)</span>
              </div>
              <select
                value={params.lookbackDays}
                onChange={(e) => setParams({ ...params, lookbackDays: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200"
              >
                <option value={126}>126 Trading Days (6 Months)</option>
                <option value={252}>252 Trading Days (1 Year)</option>
                <option value={504}>504 Trading Days (2 Years)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Execution & Slippage Costs */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between space-y-3 text-xs">
          <div>
            <span className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5 mb-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Market Microstructure
            </span>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span>Slippage Model:</span>
                <span className="font-mono text-slate-200">{params.slippageBps} bps</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Commission Fee:</span>
                <span className="font-mono text-slate-200">{params.feeBps} bps</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Rebalance Interval:</span>
                <span className="font-mono text-cyan-300 capitalize">{params.rebalanceFreq}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Benchmark:</span>
                <span className="font-mono text-slate-200 font-semibold">{params.benchmark}</span>
              </div>
            </div>
          </div>

          <button
            id="btn-run-backtest"
            disabled={loading}
            onClick={runBacktest}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-sky-400 hover:from-pink-400 hover:to-sky-300 text-white font-bold text-xs shadow-lg shadow-pink-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Simulating Paths...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" /> Run Quantitative Backtest
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-4">
          {/* Institutional Performance Scorecard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">CAGR (Annual)</div>
              <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                +{result.summary.cagr}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Bmk: +{result.summary.benchmarkCagr}%</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">Sharpe Ratio</div>
              <div className="text-base font-bold font-mono text-cyan-300 mt-0.5">
                {result.summary.sharpeRatio}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Rf: 4.2% Cash</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">Sortino Ratio</div>
              <div className="text-base font-bold font-mono text-indigo-300 mt-0.5">
                {result.summary.sortinoRatio}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Downside Vol</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">Max Drawdown</div>
              <div className="text-base font-bold font-mono text-rose-400 mt-0.5">
                {result.summary.maxDrawdownPct}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Calmar: {result.summary.calmarRatio}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">Jensen's Alpha</div>
              <div className="text-base font-bold font-mono text-emerald-300 mt-0.5">
                {result.summary.alpha > 0 ? `+${result.summary.alpha}%` : `${result.summary.alpha}%`}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Beta: {result.summary.beta}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">Win Rate</div>
              <div className="text-base font-bold font-mono text-slate-100 mt-0.5">
                {result.summary.winRate}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">PF: {result.summary.profitFactor}x</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">1-Day 95% VaR</div>
              <div className="text-base font-bold font-mono text-amber-300 mt-0.5">
                -{result.summary.var95DailyPct}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">CVaR: -{result.summary.cvar95DailyPct}%</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] text-slate-400 uppercase">Portfolio Value</div>
              <div className="text-base font-bold font-mono text-white mt-0.5">
                ${(result.summary.finalValue / 1000).toFixed(1)}k
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{result.summary.totalTrades} Trades</div>
            </div>
          </div>

          {/* Equity Curve & Underwater Drawdown Chart */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Portfolio Cumulative Wealth vs. Benchmark ({params.benchmark})
                </h3>
                <span className="text-xs text-slate-400">
                  Mark-to-market daily net-of-fees trajectory over lookback window.
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-cyan-400 rounded-full" />
                  <span className="text-slate-200">Strategy (+{result.summary.totalReturnPct}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-slate-500 rounded-full border-b border-dashed" />
                  <span className="text-slate-400">{params.benchmark} (+{result.summary.benchmarkReturnPct}%)</span>
                </div>
              </div>
            </div>

            {renderEquityChart()}
          </div>

          {/* Monthly Returns Heatmap & Execution Log */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Monthly Return Matrix */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs font-bold uppercase text-slate-300 tracking-wider mb-3 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-400" /> Monthly Return Matrix
              </div>
              <div className="grid grid-cols-3 gap-2">
                {result.monthlyReturns.map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg text-center border font-mono text-xs ${
                      m.returnPct > 0
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                        : m.returnPct < 0
                        ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="text-[10px] text-slate-400 font-sans">{m.month}</div>
                    <div className="font-bold">{m.returnPct > 0 ? `+${m.returnPct}%` : `${m.returnPct}%`}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Execution Trades Log (2 cols on lg) */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-400" /> Recent Algorithmic Rebalance Executions
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Total {result.summary.totalTrades} Orders</span>
              </div>

              <div className="overflow-x-auto max-h-56 scrollbar-thin">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase sticky top-0">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Asset</th>
                      <th className="p-2">Side</th>
                      <th className="p-2">Fill Price</th>
                      <th className="p-2">Units</th>
                      <th className="p-2">Gross Value</th>
                      <th className="p-2">Slip/Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {result.recentTrades.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/40">
                        <td className="p-2 text-slate-400">{t.date}</td>
                        <td className="p-2 font-bold text-slate-100">{t.symbol}</td>
                        <td className="p-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              t.side === 'BUY' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {t.side}
                          </span>
                        </td>
                        <td className="p-2">${t.price}</td>
                        <td className="p-2">{t.shares}</td>
                        <td className="p-2 text-slate-200">${t.value.toLocaleString()}</td>
                        <td className="p-2 text-[10px] text-slate-400">${(t.fee + t.slippage).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
