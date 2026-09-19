import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Lazy-initialize Gemini AI client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
    try {
      geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
      console.warn('Failed to initialize Gemini client:', err);
    }
  }
  return geminiClient;
}

// Market Asset universe
interface AssetMeta {
  symbol: string;
  name: string;
  category: 'Equities' | 'Fixed Income' | 'Commodities' | 'FX' | 'Crypto';
  basePrice: number;
  annualDrift: number;
  annualVol: number;
  betaSPY: number;
  description: string;
}

const ASSETS: AssetMeta[] = [
  { symbol: 'SPY', name: 'S&P 500 ETF Trust', category: 'Equities', basePrice: 580.4, annualDrift: 0.10, annualVol: 0.15, betaSPY: 1.0, description: 'Core US large-cap benchmark' },
  { symbol: 'QQQ', name: 'Invesco QQQ (Nasdaq-100)', category: 'Equities', basePrice: 495.2, annualDrift: 0.14, annualVol: 0.21, betaSPY: 1.25, description: 'Mega-cap tech and growth proxy' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', category: 'Equities', basePrice: 135.8, annualDrift: 0.28, annualVol: 0.46, betaSPY: 1.95, description: 'AI compute and semiconductor bellwether' },
  { symbol: 'MSFT', name: 'Microsoft Corp', category: 'Equities', basePrice: 425.6, annualDrift: 0.13, annualVol: 0.20, betaSPY: 1.10, description: 'Enterprise software & cloud leader' },
  { symbol: 'TLT', name: 'iShares 20+ Year Treasury', category: 'Fixed Income', basePrice: 94.2, annualDrift: 0.04, annualVol: 0.16, betaSPY: -0.25, description: 'Long duration sovereign safe-haven proxy' },
  { symbol: 'IEF', name: 'iShares 7-10 Year Treasury', category: 'Fixed Income', basePrice: 96.5, annualDrift: 0.035, annualVol: 0.09, betaSPY: -0.15, description: 'Benchmark intermediate US debt' },
  { symbol: 'HYG', name: 'iShares High Yield Corp', category: 'Fixed Income', basePrice: 77.8, annualDrift: 0.065, annualVol: 0.11, betaSPY: 0.55, description: 'Credit spread and default risk barometer' },
  { symbol: 'GLD', name: 'SPDR Gold Shares', category: 'Commodities', basePrice: 242.5, annualDrift: 0.09, annualVol: 0.15, betaSPY: 0.08, description: 'Monetary hedge and bullion store-of-value' },
  { symbol: 'USO', name: 'United States Oil Fund', category: 'Commodities', basePrice: 74.3, annualDrift: 0.05, annualVol: 0.35, betaSPY: 0.35, description: 'WTI sweet light crude oil' },
  { symbol: 'CPER', name: 'United States Copper Index', category: 'Commodities', basePrice: 28.6, annualDrift: 0.07, annualVol: 0.25, betaSPY: 0.65, description: 'Industrial economic bellwether (Dr. Copper)' },
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', category: 'FX', basePrice: 1.085, annualDrift: 0.01, annualVol: 0.08, betaSPY: 0.20, description: 'Global macro foreign exchange pair' },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', category: 'FX', basePrice: 154.2, annualDrift: 0.02, annualVol: 0.10, betaSPY: 0.15, description: 'Carry trade funding currency cross' },
  { symbol: 'BTC', name: 'Bitcoin / USD', category: 'Crypto', basePrice: 87500.0, annualDrift: 0.35, annualVol: 0.58, betaSPY: 1.40, description: 'Digital liquidity asset & high-beta store of value' },
  { symbol: 'ETH', name: 'Ethereum / USD', category: 'Crypto', basePrice: 3200.0, annualDrift: 0.32, annualVol: 0.68, betaSPY: 1.65, description: 'Smart contract compute network asset' }
];

// Seeded pseudorandom number generator for realistic reproducible quantitative data
function createRng(seed = 42) {
  let s = seed;
  return function() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Generate Box-Muller standard normals
function gaussianRandom(rng: () => number): number {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Pre-generate historical daily prices for all assets for 500 trading days
interface DailyBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  returnPct: number;
}

const HISTORICAL_DATA: Record<string, DailyBar[]> = {};

function initHistoricalData() {
  const numDays = 504; // ~2 years
  const today = new Date('2026-09-18');

  // Generate dates backward
  const dates: string[] = [];
  let d = new Date(today);
  while (dates.length < numDays) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.unshift(d.toISOString().slice(0, 10));
    }
    d.setDate(d.getDate() - 1);
  }

  // Common market factor shock
  const rngMarket = createRng(1001);
  const marketShocks: number[] = [];
  for (let i = 0; i < numDays; i++) {
    marketShocks.push(gaussianRandom(rngMarket));
  }

  ASSETS.forEach((asset, aIdx) => {
    const rng = createRng(2000 + aIdx * 77);
    const dt = 1 / 252;
    const dailyDrift = (asset.annualDrift - 0.5 * Math.pow(asset.annualVol, 2)) * dt;
    const dailyVol = asset.annualVol * Math.sqrt(dt);

    let price = asset.basePrice;
    const bars: DailyBar[] = [];

    // Simulate backwards or forwards
    const prices: number[] = [price];
    for (let i = 0; i < numDays - 1; i++) {
      // Systematic component + idiosyncratic component
      const mktShock = marketShocks[i];
      const idioShock = gaussianRandom(rng);
      const combinedShock = asset.betaSPY * 0.65 * mktShock + Math.sqrt(Math.max(0.1, 1 - Math.pow(asset.betaSPY * 0.65, 2))) * idioShock;
      const ret = dailyDrift + dailyVol * combinedShock;
      price = Math.max(0.1, price * Math.exp(ret));
      prices.push(price);
    }

    // Normalizing so final price is close to basePrice
    const factor = asset.basePrice / prices[prices.length - 1];
    const adjustedPrices = prices.map(p => p * factor);

    for (let i = 0; i < numDays; i++) {
      const curPrice = adjustedPrices[i];
      const prevPrice = i > 0 ? adjustedPrices[i - 1] : curPrice;
      const dayVol = curPrice * (asset.annualVol / Math.sqrt(252)) * 0.7;
      const open = i > 0 ? prevPrice * (1 + (rng() - 0.5) * 0.004) : curPrice;
      const high = Math.max(open, curPrice) + Math.abs(gaussianRandom(rng)) * dayVol * 0.6;
      const low = Math.min(open, curPrice) - Math.abs(gaussianRandom(rng)) * dayVol * 0.6;
      const close = curPrice;
      const volume = Math.floor(1000000 * (1 + (rng() - 0.5) * 0.5) * (asset.category === 'Crypto' ? 0.01 : 1));
      const returnPct = prevPrice > 0 ? (close - prevPrice) / prevPrice : 0;

      bars.push({
        date: dates[i],
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume,
        returnPct: Number(returnPct.toFixed(6))
      });
    }

    HISTORICAL_DATA[asset.symbol] = bars;
  });
}

initHistoricalData();

// API Endpoints
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    capabilities: ['backtest', 'regimes', 'correlations', 'stress_test', 'monte_carlo', 'ai_intelligence'],
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY')
  });
});

app.get('/api/assets', (req: Request, res: Response) => {
  res.json({
    assets: ASSETS,
    count: ASSETS.length
  });
});

app.get('/api/market-data', (req: Request, res: Response) => {
  const symbol = (req.query.symbol as string) || 'SPY';
  const data = HISTORICAL_DATA[symbol] || HISTORICAL_DATA['SPY'];
  const assetMeta = ASSETS.find(a => a.symbol === symbol) || ASSETS[0];

  res.json({
    symbol,
    assetMeta,
    bars: data
  });
});

// Quantitative Backtesting Engine
app.post('/api/backtest', (req: Request, res: Response) => {
  try {
    const {
      strategy = 'momentum',
      assets = ['SPY', 'QQQ', 'NVDA', 'TLT', 'GLD'],
      benchmark = 'SPY',
      initialCapital = 100000,
      lookbackDays = 252,
      slippageBps = 5,
      feeBps = 2,
      rebalanceFreq = 'weekly', // daily, weekly, monthly
      stopLossPct = 8,
      takeProfitPct = 25,
      riskTargetVol = 12 // Annualized volatility target %
    } = req.body;

    const benchmarkBars = HISTORICAL_DATA[benchmark] || HISTORICAL_DATA['SPY'];
    const totalBarsCount = benchmarkBars.length;
    const startIndex = Math.max(20, totalBarsCount - Math.min(lookbackDays, totalBarsCount));
    const activeDates = benchmarkBars.slice(startIndex).map(b => b.date);

    // Strategy simulation
    let cash = initialCapital;
    let portfolioValue = initialCapital;
    let benchmarkShares = initialCapital / benchmarkBars[startIndex].close;

    // Track holdings: symbol -> shares
    const holdings: Record<string, number> = {};
    assets.forEach((sym: string) => { holdings[sym] = 0; });

    interface TradeRecord {
      id: string;
      date: string;
      symbol: string;
      side: 'BUY' | 'SELL';
      price: number;
      shares: number;
      value: number;
      fee: number;
      slippage: number;
      reason: string;
    }

    const trades: TradeRecord[] = [];
    const equityCurve: Array<{
      date: string;
      portfolioValue: number;
      benchmarkValue: number;
      cash: number;
      drawdownPct: number;
      dailyReturnPct: number;
      leverage: number;
    }> = [];

    let peakValue = initialCapital;

    // Rebalancing interval in trading days
    const rebalInterval = rebalanceFreq === 'daily' ? 1 : rebalanceFreq === 'monthly' ? 21 : 5;

    for (let i = startIndex; i < totalBarsCount; i++) {
      const curDate = benchmarkBars[i].date;
      const dayIndex = i - startIndex;

      // 1. Mark to market portfolio value before trades
      let currentHoldingVal = 0;
      assets.forEach((sym: string) => {
        const bar = HISTORICAL_DATA[sym]?.[i];
        if (bar) {
          currentHoldingVal += holdings[sym] * bar.close;
        }
      });
      portfolioValue = cash + currentHoldingVal;

      // 2. Determine target weights based on strategy
      const targetWeights: Record<string, number> = {};

      if (dayIndex % rebalInterval === 0 || dayIndex === 0) {
        if (strategy === 'momentum') {
          // Cross-sectional 20-day vs 60-day momentum score
          const scores: { sym: string; score: number }[] = [];
          assets.forEach((sym: string) => {
            const bars = HISTORICAL_DATA[sym];
            if (bars && i >= 60) {
              const pCurrent = bars[i].close;
              const p20 = bars[i - 20].close;
              const p60 = bars[i - 60].close;
              const mom20 = (pCurrent - p20) / p20;
              const mom60 = (pCurrent - p60) / p60;
              scores.push({ sym, score: 0.6 * mom20 + 0.4 * mom60 });
            } else {
              scores.push({ sym, score: 0 });
            }
          });

          // Rank top half assets
          scores.sort((a, b) => b.score - a.score);
          const topN = Math.max(1, Math.floor(scores.length / 2));
          scores.forEach((item, idx) => {
            if (idx < topN && item.score > -0.02) {
              targetWeights[item.sym] = 1 / topN;
            } else {
              targetWeights[item.sym] = 0;
            }
          });
        } else if (strategy === 'mean_reversion') {
          // Buy oversold (RSI / 20-day deviation), sell overbought
          const deviations: { sym: string; zScore: number }[] = [];
          assets.forEach((sym: string) => {
            const bars = HISTORICAL_DATA[sym];
            if (bars && i >= 20) {
              const slice = bars.slice(i - 20, i).map(b => b.close);
              const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
              const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / slice.length;
              const std = Math.sqrt(variance);
              const z = (bars[i].close - mean) / (std || 1);
              deviations.push({ sym, zScore: z });
            } else {
              deviations.push({ sym, zScore: 0 });
            }
          });

          // Allocate to oversold (lowest z-score)
          const oversold = deviations.filter(d => d.zScore < -0.5);
          if (oversold.length > 0) {
            const w = 1 / oversold.length;
            oversold.forEach(item => { targetWeights[item.sym] = w; });
            deviations.filter(d => d.zScore >= -0.5).forEach(item => { targetWeights[item.sym] = 0; });
          } else {
            // Defensive hold in cash or safe assets (TLT/GLD)
            assets.forEach((sym: string) => {
              targetWeights[sym] = (sym === 'TLT' || sym === 'GLD') ? 0.4 : 0.05;
            });
          }
        } else if (strategy === 'risk_parity') {
          // Inverse realized volatility weighting
          const invVols: { sym: string; invVol: number }[] = [];
          assets.forEach((sym: string) => {
            const bars = HISTORICAL_DATA[sym];
            if (bars && i >= 30) {
              const retSlice = bars.slice(i - 30, i).map(b => b.returnPct);
              const meanRet = retSlice.reduce((a, b) => a + b, 0) / retSlice.length;
              const varRet = retSlice.reduce((a, b) => a + Math.pow(b - meanRet, 2), 0) / retSlice.length;
              const vol = Math.sqrt(varRet * 252) || 0.15;
              invVols.push({ sym, invVol: 1 / vol });
            } else {
              invVols.push({ sym, invVol: 1 });
            }
          });
          const sumInv = invVols.reduce((acc, curr) => acc + curr.invVol, 0);
          invVols.forEach(item => {
            targetWeights[item.sym] = item.invVol / (sumInv || 1);
          });
        } else {
          // Equal Weight Volatility Target
          const baseWeight = 1 / assets.length;
          assets.forEach((sym: string) => {
            targetWeights[sym] = baseWeight;
          });
        }

        // Apply Volatility Target Scaling
        const targetVolRatio = Math.min(1.2, Math.max(0.5, (riskTargetVol / 100) / 0.16));
        assets.forEach((sym: string) => {
          targetWeights[sym] = (targetWeights[sym] || 0) * targetVolRatio;
        });

        // Execute trades to reach target weights
        assets.forEach((sym: string) => {
          const bar = HISTORICAL_DATA[sym]?.[i];
          if (!bar) return;

          const targetDollar = portfolioValue * (targetWeights[sym] || 0);
          const currentDollar = holdings[sym] * bar.close;
          const deltaDollar = targetDollar - currentDollar;

          if (Math.abs(deltaDollar) > portfolioValue * 0.015) { // Rebalance threshold 1.5%
            const slipCostRate = (slippageBps / 10000);
            const feeCostRate = (feeBps / 10000);

            if (deltaDollar > 0 && cash > 50) {
              // BUY
              const effectivePrice = bar.close * (1 + slipCostRate);
              const dollarToSpend = Math.min(cash * 0.98, deltaDollar);
              const sharesToBuy = Math.floor(dollarToSpend / effectivePrice);

              if (sharesToBuy > 0) {
                const totalCost = sharesToBuy * effectivePrice;
                const fee = totalCost * feeCostRate;
                const slip = sharesToBuy * (effectivePrice - bar.close);

                cash -= (totalCost + fee);
                holdings[sym] += sharesToBuy;

                trades.push({
                  id: `trd-${trades.length + 1}`,
                  date: curDate,
                  symbol: sym,
                  side: 'BUY',
                  price: Number(effectivePrice.toFixed(2)),
                  shares: sharesToBuy,
                  value: Number(totalCost.toFixed(2)),
                  fee: Number(fee.toFixed(2)),
                  slippage: Number(slip.toFixed(2)),
                  reason: `${strategy.toUpperCase()} Allocation`
                });
              }
            } else if (deltaDollar < 0 && holdings[sym] > 0) {
              // SELL
              const effectivePrice = bar.close * (1 - slipCostRate);
              const sharesToSell = Math.min(holdings[sym], Math.ceil(Math.abs(deltaDollar) / bar.close));

              if (sharesToSell > 0) {
                const proceeds = sharesToSell * effectivePrice;
                const fee = proceeds * feeCostRate;
                const slip = sharesToSell * (bar.close - effectivePrice);

                cash += (proceeds - fee);
                holdings[sym] -= sharesToSell;

                trades.push({
                  id: `trd-${trades.length + 1}`,
                  date: curDate,
                  symbol: sym,
                  side: 'SELL',
                  price: Number(effectivePrice.toFixed(2)),
                  shares: sharesToSell,
                  value: Number(proceeds.toFixed(2)),
                  fee: Number(fee.toFixed(2)),
                  slippage: Number(slip.toFixed(2)),
                  reason: `Rebalance / Risk Trim`
                });
              }
            }
          }
        });
      }

      // Recompute end of day portfolio value
      let eodHoldingVal = 0;
      assets.forEach((sym: string) => {
        const bar = HISTORICAL_DATA[sym]?.[i];
        if (bar) eodHoldingVal += holdings[sym] * bar.close;
      });
      const endVal = cash + eodHoldingVal;
      const prevEndVal = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].portfolioValue : initialCapital;
      const dailyRet = (endVal - prevEndVal) / prevEndVal;

      if (endVal > peakValue) peakValue = endVal;
      const drawdownPct = ((endVal - peakValue) / peakValue) * 100;
      const benchmarkValue = benchmarkShares * benchmarkBars[i].close;

      equityCurve.push({
        date: curDate,
        portfolioValue: Number(endVal.toFixed(2)),
        benchmarkValue: Number(benchmarkValue.toFixed(2)),
        cash: Number(cash.toFixed(2)),
        drawdownPct: Number(drawdownPct.toFixed(2)),
        dailyReturnPct: Number((dailyRet * 100).toFixed(4)),
        leverage: Number((eodHoldingVal / (endVal || 1)).toFixed(2))
      });
    }

    // Quantitative Performance Metrics
    const finalVal = equityCurve[equityCurve.length - 1].portfolioValue;
    const finalBmkVal = equityCurve[equityCurve.length - 1].benchmarkValue;
    const totalReturnPct = ((finalVal - initialCapital) / initialCapital) * 100;
    const bmkReturnPct = ((finalBmkVal - initialCapital) / initialCapital) * 100;

    const years = equityCurve.length / 252;
    const cagr = (Math.pow(finalVal / initialCapital, 1 / (years || 1)) - 1) * 100;
    const bmkCagr = (Math.pow(finalBmkVal / initialCapital, 1 / (years || 1)) - 1) * 100;

    const dailyReturns = equityCurve.map(e => e.dailyReturnPct / 100);
    const meanDaily = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const varianceDaily = dailyReturns.reduce((a, b) => a + Math.pow(b - meanDaily, 2), 0) / (dailyReturns.length - 1 || 1);
    const annVol = Math.sqrt(varianceDaily * 252) * 100;

    // Downside volatility for Sortino
    const downsideVar = dailyReturns.filter(r => r < 0).reduce((a, b) => a + Math.pow(b, 2), 0) / (dailyReturns.length - 1 || 1);
    const downsideVol = Math.sqrt(downsideVar * 252) * 100;

    const riskFreeRate = 4.2; // 4.2% annualized cash yield
    const excessReturn = cagr - riskFreeRate;
    const sharpeRatio = annVol > 0 ? excessReturn / annVol : 0;
    const sortinoRatio = downsideVol > 0 ? excessReturn / downsideVol : 0;

    const maxDrawdownPct = Math.min(...equityCurve.map(e => e.drawdownPct));
    const calmarRatio = Math.abs(maxDrawdownPct) > 0 ? cagr / Math.abs(maxDrawdownPct) : 0;

    // Beta and Alpha calculation against benchmark
    const bmkReturns = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const prevB = equityCurve[i - 1].benchmarkValue;
      const curB = equityCurve[i].benchmarkValue;
      bmkReturns.push((curB - prevB) / (prevB || 1));
    }
    const portReturns = dailyReturns.slice(1);
    let cov = 0, bmkVar = 0;
    const bmkMean = bmkReturns.reduce((a, b) => a + b, 0) / (bmkReturns.length || 1);
    for (let k = 0; k < portReturns.length; k++) {
      cov += (portReturns[k] - meanDaily) * (bmkReturns[k] - bmkMean);
      bmkVar += Math.pow(bmkReturns[k] - bmkMean, 2);
    }
    const beta = bmkVar > 0 ? cov / bmkVar : 1;
    const alpha = cagr - (riskFreeRate + beta * (bmkCagr - riskFreeRate));

    // Win Rate & Profit Factor
    const winningDays = dailyReturns.filter(r => r > 0);
    const losingDays = dailyReturns.filter(r => r < 0);
    const winRate = (winningDays.length / (dailyReturns.length || 1)) * 100;
    const grossGains = winningDays.reduce((a, b) => a + b, 0);
    const grossLosses = Math.abs(losingDays.reduce((a, b) => a + b, 0));
    const profitFactor = grossLosses > 0 ? grossGains / grossLosses : 1.5;

    // Value at Risk (Parametric & Historical 95%)
    const sortedRet = [...dailyReturns].sort((a, b) => a - b);
    const var95Idx = Math.floor(sortedRet.length * 0.05);
    const var95DailyPct = Math.abs(sortedRet[var95Idx] || 0) * 100;
    const cvar95DailyPct = Math.abs(sortedRet.slice(0, var95Idx + 1).reduce((a, b) => a + b, 0) / (var95Idx + 1 || 1)) * 100;

    // Monthly return breakdown table
    const monthlyMap: Record<string, number[]> = {};
    equityCurve.forEach(pt => {
      const ym = pt.date.slice(0, 7);
      if (!monthlyMap[ym]) monthlyMap[ym] = [];
      monthlyMap[ym].push(pt.dailyReturnPct / 100);
    });
    const monthlyReturns = Object.keys(monthlyMap).map(ym => {
      const rets = monthlyMap[ym];
      const compReturn = (rets.reduce((acc, r) => acc * (1 + r), 1) - 1) * 100;
      return {
        month: ym,
        returnPct: Number(compReturn.toFixed(2))
      };
    });

    res.json({
      summary: {
        strategy,
        assets,
        benchmark,
        initialCapital,
        finalValue: Number(finalVal.toFixed(2)),
        totalReturnPct: Number(totalReturnPct.toFixed(2)),
        benchmarkReturnPct: Number(bmkReturnPct.toFixed(2)),
        cagr: Number(cagr.toFixed(2)),
        benchmarkCagr: Number(bmkCagr.toFixed(2)),
        sharpeRatio: Number(sharpeRatio.toFixed(2)),
        sortinoRatio: Number(sortinoRatio.toFixed(2)),
        maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
        calmarRatio: Number(calmarRatio.toFixed(2)),
        annualizedVolatilityPct: Number(annVol.toFixed(2)),
        alpha: Number(alpha.toFixed(2)),
        beta: Number(beta.toFixed(2)),
        winRate: Number(winRate.toFixed(2)),
        profitFactor: Number(profitFactor.toFixed(2)),
        var95DailyPct: Number(var95DailyPct.toFixed(2)),
        cvar95DailyPct: Number(cvar95DailyPct.toFixed(2)),
        totalTrades: trades.length
      },
      equityCurve: equityCurve.filter((_, idx) => idx % Math.max(1, Math.floor(equityCurve.length / 150)) === 0 || idx === equityCurve.length - 1),
      recentTrades: trades.slice(-25).reverse(),
      monthlyReturns
    });
  } catch (err: any) {
    console.error('Backtest engine error:', err);
    res.status(500).json({ error: err.message || 'Failed to complete backtest' });
  }
});

// Market Regime Detection
app.get('/api/regimes', (req: Request, res: Response) => {
  const spyBars = HISTORICAL_DATA['SPY'] || [];
  const lookback = 252;
  const recentBars = spyBars.slice(-lookback);

  // Compute 20-day realized volatility and 50-day moving average return
  const timeline: Array<{
    date: string;
    price: number;
    regime: 'Bull Low-Vol' | 'Bull High-Vol' | 'Bear High-Vol' | 'Sideways / Choppy';
    volatility: number;
    regimeId: number;
    color: string;
  }> = [];

  for (let i = 20; i < recentBars.length; i++) {
    const window = recentBars.slice(i - 20, i);
    const mean = window.reduce((a, b) => a + b.returnPct, 0) / window.length;
    const variance = window.reduce((a, b) => a + Math.pow(b.returnPct - mean, 2), 0) / window.length;
    const annVol = Math.sqrt(variance * 252) * 100;

    const pCurrent = recentBars[i].close;
    const pPast = recentBars[Math.max(0, i - 50)].close;
    const mom = (pCurrent - pPast) / pPast;

    let regime: 'Bull Low-Vol' | 'Bull High-Vol' | 'Bear High-Vol' | 'Sideways / Choppy';
    let regimeId = 0;
    let color = '#10B981';

    if (mom > 0.02 && annVol < 15) {
      regime = 'Bull Low-Vol';
      regimeId = 0;
      color = '#10B981'; // Green
    } else if (mom > 0.02 && annVol >= 15) {
      regime = 'Bull High-Vol';
      regimeId = 1;
      color = '#3B82F6'; // Blue
    } else if (mom <= -0.02 && annVol >= 18) {
      regime = 'Bear High-Vol';
      regimeId = 2;
      color = '#EF4444'; // Red
    } else {
      regime = 'Sideways / Choppy';
      regimeId = 3;
      color = '#F59E0B'; // Amber
    }

    timeline.push({
      date: recentBars[i].date,
      price: recentBars[i].close,
      regime,
      volatility: Number(annVol.toFixed(1)),
      regimeId,
      color
    });
  }

  const current = timeline[timeline.length - 1];

  res.json({
    currentRegime: current ? current.regime : 'Bull Low-Vol',
    currentVol: current ? current.volatility : 13.8,
    regimeProbabilities: [
      { name: 'Bull Low-Vol (Risk On)', probability: 0.62, factorRecommendation: 'Overweight Momentum, Quality, Growth Equities' },
      { name: 'Bull High-Vol (Distribution)', probability: 0.18, factorRecommendation: 'Hedge upside tails, introduce Collar strategies' },
      { name: 'Bear High-Vol (Crisis / Deleveraging)', probability: 0.08, factorRecommendation: 'Long US Treasuries, Gold, Long Volatility put spreads' },
      { name: 'Sideways / Choppy (Range-bound)', probability: 0.12, factorRecommendation: 'Statistical Arbitrage, Mean-reversion pairs, Cash yields' }
    ],
    timeline: timeline.filter((_, idx) => idx % 2 === 0 || idx === timeline.length - 1)
  });
});

// Dynamic Cross-Asset Correlation Matrix & PCA
app.get('/api/correlations', (req: Request, res: Response) => {
  const selectedSymbols = ['SPY', 'QQQ', 'NVDA', 'TLT', 'HYG', 'GLD', 'USO', 'EUR/USD', 'BTC'];
  const lookback = 126; // ~6 months

  const returnsMatrix: Record<string, number[]> = {};
  selectedSymbols.forEach(sym => {
    const bars = HISTORICAL_DATA[sym]?.slice(-lookback) || [];
    returnsMatrix[sym] = bars.map(b => b.returnPct);
  });

  const matrix: Array<{ assetA: string; assetB: string; correlation: number }> = [];
  const heatmap: number[][] = [];

  for (let i = 0; i < selectedSymbols.length; i++) {
    const row: number[] = [];
    const symA = selectedSymbols[i];
    const retA = returnsMatrix[symA];

    for (let j = 0; j < selectedSymbols.length; j++) {
      const symB = selectedSymbols[j];
      const retB = returnsMatrix[symB];

      if (i === j) {
        row.push(1.0);
        matrix.push({ assetA: symA, assetB: symB, correlation: 1.0 });
      } else {
        // Pearson correlation
        const meanA = retA.reduce((a, b) => a + b, 0) / retA.length;
        const meanB = retB.reduce((a, b) => a + b, 0) / retB.length;
        let num = 0, denA = 0, denB = 0;
        for (let k = 0; k < retA.length; k++) {
          const diffA = retA[k] - meanA;
          const diffB = retB[k] - meanB;
          num += diffA * diffB;
          denA += diffA * diffA;
          denB += diffB * diffB;
        }
        const corr = (denA > 0 && denB > 0) ? num / Math.sqrt(denA * denB) : 0;
        const rounded = Number(corr.toFixed(2));
        row.push(rounded);
        matrix.push({ assetA: symA, assetB: symB, correlation: rounded });
      }
    }
    heatmap.push(row);
  }

  // Principal Component Analysis (Simulated PCA variance explained)
  const pcaComponents = [
    { name: 'PC1 (Market & Beta Factor)', varianceExplained: 48.4, interpretation: 'Global equity risk appetite & monetary easing liquidity wave' },
    { name: 'PC2 (Interest Rates & Duration)', varianceExplained: 22.1, interpretation: 'Treasury curve yield shifts, term premium repricing' },
    { name: 'PC3 (Commodity & Inflation Shock)', varianceExplained: 14.6, interpretation: 'Crude supply shocks, gold central bank reserve accumulation' },
    { name: 'PC4 (Idiosyncratic Dispersion)', varianceExplained: 14.9, interpretation: 'Tech earnings dispersion and crypto standalone liquidity flows' }
  ];

  res.json({
    assets: selectedSymbols,
    heatmap,
    matrix,
    pcaComponents,
    absorptionRatio: 0.71, // Proportion of total variance driven by top 3 components
    regimeWarning: 'Diversification benefits are compressed between Growth Tech & Crypto, while TLT and Gold maintain strong non-correlation buffers.'
  });
});

// Stress Testing & Historical Crisis Replay
app.post('/api/stress-test', (req: Request, res: Response) => {
  const { scenario = 'covid2020', portfolioAllocation = { SPY: 30, QQQ: 20, NVDA: 15, TLT: 15, GLD: 10, BTC: 10 } } = req.body;

  // Scenario presets
  const scenarios: Record<string, {
    name: string;
    description: string;
    assetShocks: Record<string, number>;
    historicalPeriod: string;
  }> = {
    gfc2008: {
      name: '2008 Global Financial Crisis',
      description: 'Systemic subprime banking contagion, severe credit freeze, massive global equity drawdown, sovereign flight-to-safety rally.',
      historicalPeriod: 'Sep 2008 - Mar 2009',
      assetShocks: {
        SPY: -48.0, QQQ: -42.0, NVDA: -62.0, MSFT: -44.0, TLT: 28.5, IEF: 16.2,
        HYG: -29.0, GLD: 18.0, USO: -68.0, CPER: -54.0, 'EUR/USD': -14.0, 'USD/JPY': -18.0, BTC: -75.0, ETH: -80.0
      }
    },
    covid2020: {
      name: '2020 COVID Liquidity Squeeze',
      description: 'Acute pandemic declaration, rapid indiscriminate cross-asset liquidation, historic VIX spike to 82, followed by unprecedented fiscal stimulus.',
      historicalPeriod: 'Feb 2020 - Mar 2020',
      assetShocks: {
        SPY: -34.0, QQQ: -28.0, NVDA: -31.0, MSFT: -27.0, TLT: 21.0, IEF: 10.5,
        HYG: -21.0, GLD: 3.5, USO: -65.0, CPER: -26.0, 'EUR/USD': -4.5, 'USD/JPY': -5.2, BTC: -48.0, ETH: -55.0
      }
    },
    rateHike2022: {
      name: '2022 Fed Rate Shock & Inflation Spike',
      description: 'Aggressive monetary tightening (525bps hikes), simultaneous breakdown of 60/40 correlation, severe duration destruction in long Treasuries.',
      historicalPeriod: 'Jan 2022 - Oct 2022',
      assetShocks: {
        SPY: -24.5, QQQ: -33.0, NVDA: -55.0, MSFT: -29.0, TLT: -33.0, IEF: -18.0,
        HYG: -15.5, GLD: -8.0, USO: 42.0, CPER: -14.0, 'EUR/USD': -12.0, 'USD/JPY': 24.0, BTC: -64.0, ETH: -68.0
      }
    },
    geopolitics2026: {
      name: '2026 Energy Infrastructure & Tech Supply Blockade',
      description: 'Hypothetical critical semiconductor supply disruption and Strait of Hormuz logistics choke, inducing stagflationary oil surge.',
      historicalPeriod: 'Simulated 2026 Stress',
      assetShocks: {
        SPY: -18.5, QQQ: -26.0, NVDA: -38.0, MSFT: -16.0, TLT: -8.5, IEF: -4.0,
        HYG: -12.0, GLD: 34.0, USO: 58.0, CPER: 18.0, 'EUR/USD': -7.5, 'USD/JPY': 8.0, BTC: -22.0, ETH: -28.0
      }
    }
  };

  const selectedScenario = scenarios[scenario] || scenarios.covid2020;
  const totalWeight = Object.values(portfolioAllocation).reduce((a: number, b: any) => a + (Number(b) || 0), 0) || 100;

  let totalPortfolioImpactPct = 0;
  const assetContributions: Array<{
    symbol: string;
    weightPct: number;
    shockPct: number;
    contributionPct: number;
  }> = [];

  Object.entries(portfolioAllocation).forEach(([sym, rawWeight]) => {
    const weightPct = ((Number(rawWeight) || 0) / (totalWeight || 1)) * 100;
    const shockPct = selectedScenario.assetShocks[sym] || (sym.includes('BTC') || sym.includes('ETH') ? -40 : -15);
    const contribution = (weightPct / 100) * shockPct;
    totalPortfolioImpactPct += contribution;

    assetContributions.push({
      symbol: sym,
      weightPct: Number(weightPct.toFixed(1)),
      shockPct: Number(shockPct.toFixed(1)),
      contributionPct: Number(contribution.toFixed(2))
    });
  });

  assetContributions.sort((a, b) => a.contributionPct - b.contributionPct);

  res.json({
    scenario: selectedScenario,
    totalPortfolioImpactPct: Number(totalPortfolioImpactPct.toFixed(2)),
    assetContributions,
    mitigationPlaybook: totalPortfolioImpactPct < -20
      ? 'High vulnerability to liquidity freeze. Recommend raising cash buffer by 12% and adding out-of-the-money put spreads on QQQ with long Gold / Short Duration overlays.'
      : 'Moderate resilience. The allocation absorbs tail risk through defensive diversifiers, though duration sensitivity should be actively managed.'
  });
});

// Monte Carlo Simulation Engine
app.post('/api/monte-carlo', (req: Request, res: Response) => {
  const {
    initialValue = 100000,
    expectedAnnualReturnPct = 10.5,
    annualVolatilityPct = 14.5,
    daysAhead = 252,
    numSimulations = 500
  } = req.body;

  const dt = 1 / 252;
  const mu = (expectedAnnualReturnPct / 100 - 0.5 * Math.pow(annualVolatilityPct / 100, 2)) * dt;
  const sigma = (annualVolatilityPct / 100) * Math.sqrt(dt);

  const rng = createRng(4433);
  const samplePaths: number[][] = [];
  const terminalValues: number[] = [];

  // Generate paths
  for (let s = 0; s < numSimulations; s++) {
    let p = initialValue;
    const path: number[] = [p];

    for (let d = 0; d < daysAhead; d++) {
      // Jump diffusion probability (2% chance of sudden jump)
      let jump = 0;
      if (rng() < 0.02) {
        jump = gaussianRandom(rng) * 0.035; // 3.5% jump shock
      }
      const shock = gaussianRandom(rng);
      p = p * Math.exp(mu + sigma * shock + jump);
      if (d % 7 === 0 || d === daysAhead - 1) { // Sample every week to keep payload tight
        path.push(Number(p.toFixed(0)));
      }
    }

    terminalValues.push(p);
    if (samplePaths.length < 20) {
      samplePaths.push(path);
    }
  }

  terminalValues.sort((a, b) => a - b);
  const p5 = terminalValues[Math.floor(numSimulations * 0.05)];
  const p25 = terminalValues[Math.floor(numSimulations * 0.25)];
  const p50 = terminalValues[Math.floor(numSimulations * 0.50)];
  const p75 = terminalValues[Math.floor(numSimulations * 0.75)];
  const p95 = terminalValues[Math.floor(numSimulations * 0.95)];

  const var95Pct = Math.max(0, ((initialValue - p5) / initialValue) * 100);
  const expectedGainPct = ((p50 - initialValue) / initialValue) * 100;

  res.json({
    initialValue,
    daysAhead,
    numSimulations,
    percentiles: {
      p5: Number(p5.toFixed(0)),
      p25: Number(p25.toFixed(0)),
      p50: Number(p50.toFixed(0)),
      p75: Number(p75.toFixed(0)),
      p95: Number(p95.toFixed(0))
    },
    var95Pct: Number(var95Pct.toFixed(2)),
    expectedGainPct: Number(expectedGainPct.toFixed(2)),
    samplePaths
  });
});

// AI Quantitative Strategist (Gemini 3.8 Flash via @google/genai)
app.post('/api/ai/quant-analysis', async (req: Request, res: Response) => {
  try {
    const { backtestMetrics, portfolioWeights, marketRegime, stressTestResults } = req.body;

    const gemini = getGeminiClient();

    if (gemini) {
      const prompt = `You are a Senior Quantitative Portfolio Manager and Risk Officer at a top-tier multi-strategy hedge fund.
Analyze the following quantitative backtest, regime state, and stress test data:

BACKTEST PERFORMANCE:
- Strategy: ${backtestMetrics?.strategy || 'Momentum & Risk Parity'}
- Total Return: ${backtestMetrics?.totalReturnPct}%
- CAGR: ${backtestMetrics?.cagr}% (vs Benchmark CAGR: ${backtestMetrics?.benchmarkCagr}%)
- Sharpe Ratio: ${backtestMetrics?.sharpeRatio}
- Sortino Ratio: ${backtestMetrics?.sortinoRatio}
- Max Drawdown: ${backtestMetrics?.maxDrawdownPct}%
- Alpha: ${backtestMetrics?.alpha}%, Beta: ${backtestMetrics?.beta}
- Annualized Volatility: ${backtestMetrics?.annualizedVolatilityPct}%
- 95% 1-Day VaR: ${backtestMetrics?.var95DailyPct}%, CVaR: ${backtestMetrics?.cvar95DailyPct}%

PORTFOLIO ALLOCATION:
${JSON.stringify(portfolioWeights || { SPY: '25%', QQQ: '25%', NVDA: '15%', TLT: '15%', GLD: '10%', BTC: '10%' })}

CURRENT REGIME & STRESS TEST:
- Regime: ${marketRegime || 'Bull Low-Vol'}
- Stress Test Scenario Loss: ${stressTestResults?.totalPortfolioImpactPct || -24.5}%

Provide an executive institutional memo covering:
1. Executive Risk/Return Verdict (Calmar quality, return-to-downside efficiency).
2. Factor & Tail Vulnerabilities (where the portfolio is overexposed).
3. Regime Sensitivity & Tactical Tilt (how to adjust for current market volatility).
4. Specific Quantitative Enhancements (hedging structures, position sizing rules, volatility targeting thresholds).

Format with crisp Markdown, bold headings, bullet points, and specific numerical targets. Keep it concise, actionable, and strictly professional.`;

      const response = await gemini.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt
      });

      return res.json({
        analysis: response.text || 'Quantitative memo generated successfully.',
        generatedBy: 'gemini-3.8-flash',
        timestamp: new Date().toISOString()
      });
    }

    // High-grade analytical fallback when API key is not configured
    const defaultMemo = `### Executive Quantitative Risk & Strategy Audit

#### 1. Risk/Return Efficiency & Factor Attribution
- **Sharpe Ratio (${backtestMetrics?.sharpeRatio ?? '1.68'}) & Sortino (${backtestMetrics?.sortinoRatio ?? '2.14'})**: The portfolio demonstrates superior downside-adjusted performance. The Sortino spread indicates upside participation with limited catastrophic left-tail drag during orderly corrections.
- **Alpha Generation (${backtestMetrics?.alpha ?? '+5.8%'} annualized)**: Tactical momentum filtering and cross-asset diversification successfully decouple returns from passive benchmark beta (${backtestMetrics?.beta ?? '0.92'}).

#### 2. Factor & Tail Vulnerabilities
- **Tech & Semiconductor Crowding**: Overweight allocations in high-beta mega-cap equities (NVDA, QQQ) elevate conditional drawdowns during sudden liquidity drains.
- **Correlation Breakdown Risk**: In rapid stagflationary regimes, traditional fixed income (TLT) can decouple from equities, leaving portfolio defense reliant primarily on physical Gold (GLD) and tactical cash reserves.

#### 3. Regime State & Dynamic Tactical Tilts
- **Current State [${marketRegime || 'Bull Low-Vol'}]**: Favorable for systematic risk parity and trend continuation.
- **Recommended Factor Overweights**:
  - **Quality & Free Cash Flow Yield**: Increase core exposure to cash-rich balance sheets.
  - **Asymmetric Hedges**: Maintain a 6–8% allocation to gold bullion and systematic collar option overlays.
  - **Volatility Targeting**: Target a strictly capped 12.0% annualized realized volatility; trim gross leverage automatically when 20-day realized volatility breaches 16.5%.

#### 4. Actionable Quantitative Rules
1. **Dynamic Risk Budgeting**: Enforce inverse-volatility rebalancing weekly.
2. **Hard Trailing Stop at -8%**: Liquidate momentum long legs when 50-day EMA is violated on 2x average daily volume.
3. **Liquidity Buffer**: Maintain at least 5% unencumbered collateral to exploit flash-crash mean reversion opportunities.`;

    return res.json({
      analysis: defaultMemo,
      generatedBy: 'quantitative-engine-memo',
      timestamp: new Date().toISOString(),
      note: 'To enable live custom Gemini neural reasoning, configure GEMINI_API_KEY in the environment.'
    });
  } catch (err: any) {
    console.error('AI quant analysis error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate AI quant report' });
  }
});

// Vite Middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`QuantFinance AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
