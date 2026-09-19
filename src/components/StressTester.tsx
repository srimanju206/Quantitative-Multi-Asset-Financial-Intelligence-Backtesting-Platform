import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, ArrowDownRight, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';
import { StressTestResponse } from '../types';

export const StressTester: React.FC = () => {
  const [scenario, setScenario] = useState<string>('covid2020');
  const [allocation, setAllocation] = useState<Record<string, number>>({
    SPY: 30,
    QQQ: 20,
    NVDA: 15,
    TLT: 15,
    GLD: 10,
    BTC: 10,
  });

  const [result, setResult] = useState<StressTestResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const runStressTest = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stress-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, portfolioAllocation: allocation }),
      });
      const data: StressTestResponse = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Stress test error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runStressTest();
  }, [scenario]);

  const updateWeight = (sym: string, val: number) => {
    setAllocation({ ...allocation, [sym]: val });
  };

  const totalAllocWeight = Object.values(allocation).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-slate-100">
              Macro Crisis Replay &amp; Extreme Tail-Risk Stress Testing
            </h2>
            <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-mono font-semibold">
              CONDITIONAL VALUE AT RISK (CVaR)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate your portfolio's solvency and factor breakdown against acute historical shocks and hypothetical stagflationary crises.
          </p>
        </div>

        {/* Crisis Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setScenario('covid2020')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              scenario === 'covid2020' ? 'bg-rose-700 text-white font-semibold shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2020 COVID Shock
          </button>
          <button
            onClick={() => setScenario('gfc2008')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              scenario === 'gfc2008' ? 'bg-rose-700 text-white font-semibold shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2008 Lehman GFC
          </button>
          <button
            onClick={() => setScenario('rateHike2022')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              scenario === 'rateHike2022' ? 'bg-rose-700 text-white font-semibold shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2022 Rate Spike
          </button>
          <button
            onClick={() => setScenario('geopolitics2026')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
              scenario === 'geopolitics2026' ? 'bg-rose-700 text-white font-semibold shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2026 Tech/Energy Blockade
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Allocation Controls */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" /> Allocation Weights
            </span>
            <span
              className={`text-xs font-mono font-bold ${
                totalAllocWeight === 100 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              Sum: {totalAllocWeight}%
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {Object.entries(allocation).map(([sym, weight]) => (
              <div key={sym} className="space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span className="font-bold text-slate-200 font-mono">{sym}</span>
                  <span className="font-mono text-cyan-300 font-semibold">{weight}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={weight}
                  onChange={(e) => updateWeight(sym, Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            ))}
          </div>

          <button
            onClick={runStressTest}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-700 to-amber-700 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Recalculate Shock Impact
          </button>
        </div>

        {/* Results & Waterfall Breakdown (2 cols on lg) */}
        {result && (
          <div className="lg:col-span-2 space-y-4">
            {/* Scenario Summary Banner */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                  Scenario: {result.scenario.historicalPeriod}
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-0.5">{result.scenario.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{result.scenario.description}</p>
              </div>

              <div className="bg-rose-950/70 border border-rose-800/80 p-3.5 rounded-xl text-right shrink-0 min-w-[150px]">
                <div className="text-[10px] text-rose-300 uppercase font-mono font-semibold">Total Portfolio Drawdown</div>
                <div className="text-2xl font-black font-mono text-rose-400 mt-0.5">
                  {result.totalPortfolioImpactPct}%
                </div>
              </div>
            </div>

            {/* Asset Contribution Breakdown */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl space-y-3">
              <span className="text-xs font-bold uppercase text-slate-300 tracking-wider">
                Asset-by-Asset Drawdown Contribution
              </span>

              <div className="space-y-2.5">
                {result.assetContributions.map((item) => (
                  <div key={item.symbol} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="font-bold text-slate-200">
                        {item.symbol} ({item.weightPct}%)
                      </span>
                      <span className={item.contributionPct < 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {item.contributionPct > 0 ? `+${item.contributionPct}%` : `${item.contributionPct}%`}
                        <span className="text-slate-500 font-normal text-[10px] ml-1.5">
                          (Asset Shock: {item.shockPct}%)
                        </span>
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden flex">
                      {item.contributionPct < 0 ? (
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.abs(item.contributionPct) * 4)}%` }}
                        />
                      ) : (
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${Math.min(100, item.contributionPct * 4)}%` }}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tail Risk Playbook */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-start gap-3 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-200">Systematic Mitigation Recommendation</div>
                <p className="text-slate-400 mt-0.5 leading-relaxed">{result.mitigationPlaybook}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
