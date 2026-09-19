import React, { useState, useEffect } from 'react';
import { Dices, RefreshCw, Sliders, TrendingUp, ShieldAlert, Percent } from 'lucide-react';
import { MonteCarloResponse } from '../types';

export const MonteCarloSim: React.FC = () => {
  const [initialValue, setInitialValue] = useState<number>(100000);
  const [expectedReturn, setExpectedReturn] = useState<number>(11.5);
  const [volatility, setVolatility] = useState<number>(15.0);
  const [daysAhead, setDaysAhead] = useState<number>(252);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<MonteCarloResponse | null>(null);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/monte-carlo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialValue,
          expectedAnnualReturnPct: expectedReturn,
          annualVolatilityPct: volatility,
          daysAhead,
          numSimulations: 500
        }),
      });
      const data: MonteCarloResponse = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Monte carlo simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, []);

  const renderPathsChart = () => {
    if (!result || !result.samplePaths.length) return null;

    const paths = result.samplePaths;
    const allVals = paths.flatMap(p => p);
    const minVal = Math.min(...allVals) * 0.95;
    const maxVal = Math.max(...allVals) * 1.05;
    const range = maxVal - minVal || 1;

    const width = 800;
    const height = 320;
    const padding = { top: 20, right: 40, bottom: 30, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const numPoints = paths[0].length;
    const getX = (idx: number) => padding.left + (idx / (numPoints - 1 || 1)) * chartW;
    const getY = (val: number) => padding.top + chartH - ((val - minVal) / range) * chartH;

    return (
      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
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

          {/* Initial Value line */}
          <line
            x1={padding.left}
            y1={getY(initialValue)}
            x2={width - padding.right}
            y2={getY(initialValue)}
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Sample stochastic paths */}
          {paths.map((p, idx) => {
            const pathStr = p.map((val, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(val).toFixed(1)}`).join(' ');
            return (
              <path
                key={idx}
                d={pathStr}
                fill="none"
                stroke={idx % 2 === 0 ? '#38bdf8' : '#818cf8'}
                strokeWidth="1"
                opacity="0.35"
              />
            );
          })}

          {/* Median 50th percentile label */}
          <line
            x1={padding.left}
            y1={getY(result.percentiles.p50)}
            x2={width - padding.right}
            y2={getY(result.percentiles.p50)}
            stroke="#10b981"
            strokeWidth="2.2"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              Monte Carlo Jump-Diffusion Stochastic Wealth Simulator
            </h2>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-mono font-semibold">
              500 STOCHASTIC PATHS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulates Geometric Brownian Motion with random jump-diffusion events to model realistic non-normal financial returns.
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading}
          className="py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950/50 flex items-center gap-2 transition-all shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Run Simulation
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl space-y-4 text-xs">
          <span className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-cyan-400" /> Simulation Parameters
          </span>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Initial Wealth:</span>
                <span className="font-mono text-slate-100 font-bold">${initialValue.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="500000"
                step="10000"
                value={initialValue}
                onChange={(e) => setInitialValue(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Expected Drift (μ):</span>
                <span className="font-mono text-emerald-400 font-bold">+{expectedReturn}%</span>
              </div>
              <input
                type="range"
                min="2"
                max="30"
                step="0.5"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Volatility (σ):</span>
                <span className="font-mono text-indigo-400 font-bold">{volatility}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="1"
                value={volatility}
                onChange={(e) => setVolatility(Number(e.target.value))}
                className="w-full accent-indigo-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Time Horizon:</span>
                <span className="font-mono text-slate-200">{daysAhead} Days ({(daysAhead / 252).toFixed(1)} yr)</span>
              </div>
              <select
                value={daysAhead}
                onChange={(e) => setDaysAhead(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
              >
                <option value={126}>126 Days (6 Months)</option>
                <option value={252}>252 Days (1 Year)</option>
                <option value={504}>504 Days (2 Years)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results & Trajectories (3 cols on lg) */}
        {result && (
          <div className="lg:col-span-3 space-y-4">
            {/* Percentile Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] text-rose-400 uppercase font-mono">5th Percentile (Left Tail)</div>
                <div className="text-base font-bold font-mono text-rose-300 mt-0.5">
                  ${result.percentiles.p5.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {(((result.percentiles.p5 - initialValue) / initialValue) * 100).toFixed(1)}%
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] text-amber-400 uppercase font-mono">25th Percentile</div>
                <div className="text-base font-bold font-mono text-slate-200 mt-0.5">
                  ${result.percentiles.p25.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {(((result.percentiles.p25 - initialValue) / initialValue) * 100).toFixed(1)}%
                </div>
              </div>

              <div className="bg-slate-900 border border-cyan-500/50 p-3 rounded-xl shadow-md shadow-cyan-950/30">
                <div className="text-[10px] text-cyan-400 uppercase font-mono font-bold">50th (Median Expectation)</div>
                <div className="text-base font-bold font-mono text-cyan-300 mt-0.5">
                  ${result.percentiles.p50.toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono font-bold">
                  +{result.expectedGainPct}%
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase font-mono">75th Percentile</div>
                <div className="text-base font-bold font-mono text-slate-200 mt-0.5">
                  ${result.percentiles.p75.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  +{(((result.percentiles.p75 - initialValue) / initialValue) * 100).toFixed(1)}%
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
                <div className="text-[10px] text-emerald-400 uppercase font-mono">95th (Right Tail Bull)</div>
                <div className="text-base font-bold font-mono text-emerald-300 mt-0.5">
                  ${result.percentiles.p95.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  +{(((result.percentiles.p95 - initialValue) / initialValue) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Stochastic Paths SVG Chart */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">Terminal Stochastic Distribution Fan Chart</span>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="flex items-center gap-1 text-emerald-400"><span className="w-2.5 h-1 bg-emerald-500 rounded" /> Median</span>
                  <span className="flex items-center gap-1 text-amber-400"><span className="w-2.5 h-1 bg-amber-500 rounded border-dashed" /> Baseline</span>
                </div>
              </div>

              {renderPathsChart()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
