export type AssetCategory = 'Equities' | 'Fixed Income' | 'Commodities' | 'FX' | 'Crypto';

export interface AssetMeta {
  symbol: string;
  name: string;
  category: AssetCategory;
  basePrice: number;
  annualDrift: number;
  annualVol: number;
  betaSPY: number;
  description: string;
}

export interface DailyBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  returnPct: number;
}

export type StrategyType = 'momentum' | 'mean_reversion' | 'risk_parity' | 'volatility_targeting';

export interface BacktestParams {
  strategy: StrategyType;
  assets: string[];
  benchmark: string;
  initialCapital: number;
  lookbackDays: number;
  slippageBps: number;
  feeBps: number;
  rebalanceFreq: 'daily' | 'weekly' | 'monthly';
  stopLossPct: number;
  takeProfitPct: number;
  riskTargetVol: number;
}

export interface PerformanceMetrics {
  strategy: string;
  assets: string[];
  benchmark: string;
  initialCapital: number;
  finalValue: number;
  totalReturnPct: number;
  benchmarkReturnPct: number;
  cagr: number;
  benchmarkCagr: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdownPct: number;
  calmarRatio: number;
  annualizedVolatilityPct: number;
  alpha: number;
  beta: number;
  winRate: number;
  profitFactor: number;
  var95DailyPct: number;
  cvar95DailyPct: number;
  totalTrades: number;
}

export interface EquityCurvePoint {
  date: string;
  portfolioValue: number;
  benchmarkValue: number;
  cash: number;
  drawdownPct: number;
  dailyReturnPct: number;
  leverage: number;
}

export interface TradeRecord {
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

export interface MonthlyReturn {
  month: string;
  returnPct: number;
}

export interface BacktestResponse {
  summary: PerformanceMetrics;
  equityCurve: EquityCurvePoint[];
  recentTrades: TradeRecord[];
  monthlyReturns: MonthlyReturn[];
}

export interface RegimeTimelinePoint {
  date: string;
  price: number;
  regime: 'Bull Low-Vol' | 'Bull High-Vol' | 'Bear High-Vol' | 'Sideways / Choppy';
  volatility: number;
  regimeId: number;
  color: string;
}

export interface RegimeProbability {
  name: string;
  probability: number;
  factorRecommendation: string;
}

export interface RegimeResponse {
  currentRegime: string;
  currentVol: number;
  regimeProbabilities: RegimeProbability[];
  timeline: RegimeTimelinePoint[];
}

export interface CorrelationMatrixItem {
  assetA: string;
  assetB: string;
  correlation: number;
}

export interface PcaComponent {
  name: string;
  varianceExplained: number;
  interpretation: string;
}

export interface CorrelationResponse {
  assets: string[];
  heatmap: number[][];
  matrix: CorrelationMatrixItem[];
  pcaComponents: PcaComponent[];
  absorptionRatio: number;
  regimeWarning: string;
}

export interface StressScenario {
  name: string;
  description: string;
  historicalPeriod: string;
  assetShocks: Record<string, number>;
}

export interface StressTestResponse {
  scenario: StressScenario;
  totalPortfolioImpactPct: number;
  assetContributions: Array<{
    symbol: string;
    weightPct: number;
    shockPct: number;
    contributionPct: number;
  }>;
  mitigationPlaybook: string;
}

export interface MonteCarloResponse {
  initialValue: number;
  daysAhead: number;
  numSimulations: number;
  percentiles: {
    p5: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  };
  var95Pct: number;
  expectedGainPct: number;
  samplePaths: number[][];
}

export interface AIAnalysisResponse {
  analysis: string;
  generatedBy: string;
  timestamp: string;
  note?: string;
}
