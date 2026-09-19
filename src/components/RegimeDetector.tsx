import React, { useEffect, useState } from 'react';
import { Compass, Activity, ShieldAlert, CheckCircle, TrendingUp, AlertTriangle, Layers } from 'lucide-react';
import { RegimeResponse } from '../types';

export const RegimeDetector: React.FC = () => {
  const [data, setData] = useState<RegimeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/regimes')
      .then((res) => res.json())
      .then((json: RegimeResponse) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load regime data:', err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center text-slate-400 text-xs flex items-center justify-center gap-2">
        <Activity className="w-4 h-4 animate-spin text-cyan-400" /> Computing Markov state transitions...
      </div>
    );
  }

  // Factor tilts matrix
  const factorTilts = [
    { factor: 'Momentum', tilt: 'Overweight (+1.5σ)', status: 'bull', rationale: 'Strong positive trend persistence across large-cap tech & equities.' },
    { factor: 'Quality / Free Cash Flow', tilt: 'Overweight (+2.0σ)', status: 'bull', rationale: 'Balance sheet resilience buffers against delayed rate-cut uncertainty.' },
    { factor: 'Low Volatility', tilt: 'Neutral (0.0σ)', status: 'neutral', rationale: 'Market realized volatility remains subdued at ~13.8%.' },
    { factor: 'Deep Value / Cyclicals', tilt: 'Underweight (-1.2σ)', status: 'bear', rationale: 'Operating leverage exposed to tariff and manufacturing friction.' },
    { factor: 'High Beta / Small Caps', tilt: 'Underweight (-1.8σ)', status: 'bear', rationale: 'Refinancing headwinds for floating-rate debt maturities.' },
    { factor: 'Macro Safe Haven (Gold)', tilt: 'Overweight (+1.0σ)', status: 'bull', rationale: 'Central bank de-dollarization and geopolitical insurance.' },
  ];

  const timeline = data.timeline;
  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 30, left: 55 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const minP = Math.min(...timeline.map(t => t.price)) * 0.96;
  const maxP = Math.max(...timeline.map(t => t.price)) * 1.04;
  const rangeP = maxP - minP || 1;

  const getX = (idx: number) => padding.left + (idx / (timeline.length - 1 || 1)) * chartW;
  const getY = (price: number) => padding.top + chartH - ((price - minP) / rangeP) * chartH;

  const linePath = timeline.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(pt.price).toFixed(1)}`).join(' ');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              Macro Regime Detection &amp; Hidden Markov State Filter
            </h2>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono font-semibold">
              ACTIVE REGIME: {data.currentRegime.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Machine-learning clustering on 20-day realized volatility, cross-asset momentum, and systemic dispersion.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono">Current Realized Vol</div>
            <div className="text-sm font-bold font-mono text-emerald-400">{data.currentVol}% Ann.</div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono">Regime Stability</div>
            <div className="text-sm font-bold font-mono text-cyan-400">88.4% Likelihood</div>
          </div>
        </div>
      </div>

      {/* Probability Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.regimeProbabilities.map((reg, idx) => {
          const isCurrent = idx === 0;
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all backdrop-blur-md ${
                isCurrent
                  ? 'bg-slate-900/90 border-cyan-500/70 shadow-lg shadow-cyan-950/40'
                  : 'bg-slate-900/70 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200">{reg.name}</span>
                <span className={`text-xs font-mono font-bold ${isCurrent ? 'text-cyan-400' : 'text-slate-400'}`}>
                  {(reg.probability * 100).toFixed(0)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full ${
                    idx === 0 ? 'bg-emerald-400' : idx === 1 ? 'bg-blue-400' : idx === 2 ? 'bg-rose-500' : 'bg-amber-400'
                  }`}
                  style={{ width: `${reg.probability * 100}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">{reg.factorRecommendation}</p>
            </div>
          );
        })}
      </div>

      {/* Historical S&P 500 Regime Transition Chart */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              S&amp;P 500 Benchmark Price with Colored Regime State Bands
            </h3>
            <span className="text-xs text-slate-400">
              Visualizes how market regimes shift across bull low-vol (green), bull high-vol (blue), choppy (yellow), and bear (red).
            </span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Bull Low-Vol</span>
            <span className="flex items-center gap-1 text-blue-400"><span className="w-2 h-2 rounded-full bg-blue-500" /> Bull High-Vol</span>
            <span className="flex items-center gap-1 text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-500" /> Choppy</span>
            <span className="flex items-center gap-1 text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-500" /> Bear Crisis</span>
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            {/* Regime background vertical bars */}
            {timeline.map((pt, i) => {
              if (i === 0) return null;
              const xPrev = getX(i - 1);
              const xCurr = getX(i);
              const barW = Math.max(1, xCurr - xPrev);
              return (
                <rect
                  key={i}
                  x={xPrev}
                  y={padding.top}
                  width={barW}
                  height={chartH}
                  fill={pt.color}
                  opacity="0.12"
                />
              );
            })}

            {/* Price Line */}
            <path d={linePath} fill="none" stroke="#f8fafc" strokeWidth="2.2" strokeLinecap="round" />

            {/* Grid y-axis */}
            {[0, 0.5, 1.0].map((t, idx) => {
              const y = padding.top + chartH * (1 - t);
              const val = minP + rangeP * t;
              return (
                <g key={idx}>
                  <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                  <text x={padding.left - 6} y={y + 4} textAnchor="end" fill="#64748b" fontSize="10" fontFamily="monospace">
                    ${val.toFixed(0)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Systematic Factor Tilt Recommendations */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          Algorithmic Factor Tilt Playbook (Markov State Prescribed)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {factorTilts.map((item, idx) => (
            <div key={idx} className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">{item.factor}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    item.status === 'bull'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : item.status === 'bear'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.tilt}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">{item.rationale}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
