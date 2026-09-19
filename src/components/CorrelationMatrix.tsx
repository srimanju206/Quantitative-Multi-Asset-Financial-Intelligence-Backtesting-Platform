import React, { useEffect, useState } from 'react';
import { Grid, Layers, ShieldAlert, Info, ArrowUpRight, Activity } from 'lucide-react';
import { CorrelationResponse } from '../types';

export const CorrelationMatrix: React.FC = () => {
  const [data, setData] = useState<CorrelationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPair, setSelectedPair] = useState<{ assetA: string; assetB: string; val: number } | null>(null);

  useEffect(() => {
    fetch('/api/correlations')
      .then((res) => res.json())
      .then((json: CorrelationResponse) => {
        setData(json);
        setLoading(false);
        if (json.assets.length > 3) {
          setSelectedPair({
            assetA: json.assets[0],
            assetB: json.assets[3],
            val: json.heatmap[0][3]
          });
        }
      })
      .catch((err) => {
        console.error('Error fetching correlations:', err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center text-slate-400 text-xs flex items-center justify-center gap-2">
        <Activity className="w-4 h-4 animate-spin text-cyan-400" /> Computing rolling Pearson correlation matrix &amp; PCA...
      </div>
    );
  }

  // Color generator for correlation cell (-1 to +1)
  const getCellColor = (val: number) => {
    if (val === 1) return 'bg-cyan-600/70 text-white font-bold';
    if (val > 0.6) return 'bg-cyan-900/60 text-cyan-200';
    if (val > 0.2) return 'bg-cyan-950/40 text-cyan-300';
    if (val > -0.2) return 'bg-slate-900/80 text-slate-300';
    if (val > -0.5) return 'bg-rose-950/50 text-rose-300';
    return 'bg-rose-900/80 text-rose-100 font-bold';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              Dynamic Cross-Asset Correlation Matrix &amp; PCA Eigenvalues
            </h2>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-mono font-semibold">
              LOOKBACK: 126 TRADING DAYS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quantifies co-movements across Equities, Treasuries, Credit, Commodities, FX, and Crypto to assess portfolio diversification resilience.
          </p>
        </div>

        {/* Systemic Absorption Ratio */}
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex items-center gap-4 text-xs font-mono">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-sans">Absorption Ratio</div>
            <div className="text-base font-bold text-cyan-300 font-mono">{(data.absorptionRatio * 100).toFixed(0)}%</div>
          </div>
          <div className="h-7 w-px bg-slate-800" />
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-sans">Systemic Risk</div>
            <div className="text-xs font-bold text-amber-400 font-sans">Elevated Fragility</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Matrix Table (2 cols on lg) */}
        <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-300 tracking-wider">
              Pairwise Pearson Correlation Heatmap
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Click cell to inspect pair</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs font-mono">
              <thead>
                <tr>
                  <th className="p-2 text-left text-slate-500 text-[10px] font-sans">ASSET</th>
                  {data.assets.map((asset) => (
                    <th key={asset} className="p-2 text-slate-300 font-bold text-[11px]">
                      {asset}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {data.assets.map((rowAsset, rIdx) => (
                  <tr key={rowAsset} className="hover:bg-slate-800/30">
                    <td className="p-2 text-left font-bold text-slate-200 text-[11px] whitespace-nowrap bg-slate-950/40">
                      {rowAsset}
                    </td>
                    {data.heatmap[rIdx].map((val, cIdx) => {
                      const colAsset = data.assets[cIdx];
                      const isSelected = selectedPair?.assetA === rowAsset && selectedPair?.assetB === colAsset;
                      return (
                        <td
                          key={cIdx}
                          onClick={() => setSelectedPair({ assetA: rowAsset, assetB: colAsset, val })}
                          className={`p-2 cursor-pointer transition-all border border-slate-900/80 ${getCellColor(
                            val
                          )} ${isSelected ? 'ring-2 ring-cyan-400 font-black' : ''}`}
                        >
                          {val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Color Scale Legend */}
          <div className="flex items-center justify-between pt-2 text-[10px] text-slate-400 font-mono">
            <span>Strong Negative (-1.00)</span>
            <div className="w-48 h-2 rounded-full bg-gradient-to-r from-rose-600 via-slate-800 to-cyan-500 mx-2" />
            <span>Strong Positive (+1.00)</span>
          </div>
        </div>

        {/* Selected Pair & PCA Breakdown (1 col on lg) */}
        <div className="space-y-4">
          {/* Pair Inspector */}
          {selectedPair && (
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-4 rounded-xl space-y-2.5">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Pair Co-Movement Inspector
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-100 font-mono">
                  {selectedPair.assetA} &harr; {selectedPair.assetB}
                </span>
                <span
                  className={`text-base font-bold font-mono ${
                    selectedPair.val > 0.4
                      ? 'text-cyan-400'
                      : selectedPair.val < -0.2
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }`}
                >
                  {selectedPair.val > 0 ? `+${selectedPair.val.toFixed(2)}` : selectedPair.val.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {selectedPair.val < 0
                  ? 'Strong anti-correlation: Outstanding portfolio flight-to-safety hedging pair during equity market downturns.'
                  : selectedPair.val > 0.7
                  ? 'High correlation: High clustering risk. Holding both assets yields diminishing diversification benefit.'
                  : 'Moderate independence: Provides beneficial balance sheet stabilization with idiosyncratic variance.'}
              </p>
            </div>
          )}

          {/* PCA Principal Components */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" /> PCA Variance Explained
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Eigenvectors</span>
            </div>

            <div className="space-y-3">
              {data.pcaComponents.map((pc, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-200">{pc.name}</span>
                    <span className="font-mono text-cyan-400 font-bold">{pc.varianceExplained}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                      style={{ width: `${pc.varianceExplained}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{pc.interpretation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
