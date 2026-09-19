import React from 'react';
import {
  TrendingUp,
  Activity,
  Box,
  Compass,
  Grid,
  ShieldAlert,
  Dices,
  Sparkles,
  Layers,
  Cpu,
  LogIn,
  LogOut,
  UserCheck
} from 'lucide-react';
import { UserProfile } from './LoginPage';

export type ActiveTab =
  | 'login'
  | 'backtest'
  | '3d-surface'
  | 'regimes'
  | 'correlations'
  | 'stress-test'
  | 'monte-carlo'
  | 'ai-strategist';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  geminiReady?: boolean;
  currentUser: UserProfile | null;
  onLogout: () => void;
}

const TICKER_TAPE = [
  { sym: 'SPY', price: '580.40', chg: '+0.42%', up: true },
  { sym: 'QQQ', price: '495.20', chg: '+0.78%', up: true },
  { sym: 'NVDA', price: '135.80', chg: '+2.15%', up: true },
  { sym: 'TLT', price: '94.20', chg: '-0.31%', up: false },
  { sym: 'GLD', price: '242.50', chg: '+0.54%', up: true },
  { sym: 'USO', price: '74.30', chg: '-1.12%', up: false },
  { sym: 'EUR/USD', price: '1.0850', chg: '+0.05%', up: true },
  { sym: 'BTC', price: '$87,500', chg: '+3.40%', up: true },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  geminiReady = true,
  currentUser,
  onLogout,
}) => {
  const tabs: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'login', label: 'Login Portal', icon: <LogIn className="w-4 h-4 text-pink-400" />, badge: currentUser ? 'Active' : 'Portal' },
    { id: 'backtest', label: 'Strategy Lab', icon: <TrendingUp className="w-4 h-4" /> },
    { id: '3d-surface', label: '3D Vol Surface', icon: <Box className="w-4 h-4" />, badge: 'WebGL' },
    { id: 'regimes', label: 'Regime Detection', icon: <Compass className="w-4 h-4" /> },
    { id: 'correlations', label: 'Correlations & PCA', icon: <Grid className="w-4 h-4" /> },
    { id: 'stress-test', label: 'Stress Testing', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'monte-carlo', label: 'Monte Carlo', icon: <Dices className="w-4 h-4" /> },
    { id: 'ai-strategist', label: 'AI Strategist', icon: <Sparkles className="w-4 h-4 text-pink-400" />, badge: 'Gemini' },
  ];

  return (
    <header className="w-full bg-slate-950/85 backdrop-blur-md border-b border-pink-500/30 text-slate-100 sticky top-0 z-50 shadow-lg shadow-pink-950/20">
      {/* Top Ticker Tape */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-1.5 overflow-x-auto text-xs font-mono flex items-center justify-between gap-6 whitespace-nowrap scrollbar-none">
        <div className="flex items-center gap-2 text-pink-400 font-semibold uppercase tracking-wider shrink-0">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
          <span>MARKET LIVE FEED</span>
        </div>
        <div className="flex items-center gap-6 overflow-hidden">
          {TICKER_TAPE.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-400 font-bold">{item.sym}</span>
              <span className="text-slate-200">{item.price}</span>
              <span className={item.up ? 'text-sky-400' : 'text-pink-400'}>{item.chg}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 text-slate-400 text-[11px] shrink-0">
          <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
            <Cpu className="w-3 h-3 text-sky-400" /> Serverless Quant Engine
          </span>
          <span className="flex items-center gap-1 bg-pink-950/60 px-2 py-0.5 rounded border border-pink-800 text-pink-300">
            <Sparkles className="w-3 h-3 text-pink-400" /> Gemini 3.8 Flash
          </span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-3">
          {/* Glowing Pink & Sky Blue Logo Icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-sky-400 flex items-center justify-center shadow-lg shadow-pink-500/30 border border-pink-400/40 shrink-0">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-pink-400 via-sky-300 to-slate-100 bg-clip-text text-transparent">
                QuantFinance AI
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase bg-gradient-to-r from-pink-950 to-sky-950 text-sky-300 border border-pink-500/40 rounded-full font-semibold">
                PRO QUANT v2.6
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Multi-Asset Financial Intelligence, Backtesting &amp; Volatility Analytics
            </p>
          </div>
        </div>

        {/* User Auth Profile Badge & Controls */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-900/90 border border-pink-500/30 pl-2 pr-3 py-1 rounded-full text-xs">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-sky-400 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                {currentUser.initials}
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="font-bold text-slate-200 text-[11px] truncate max-w-[120px]">
                  {currentUser.name}
                </span>
                <span className="text-[9px] text-sky-400 truncate max-w-[120px]">
                  {currentUser.role}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Sign out or switch terminal persona"
                className="ml-1 p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-pink-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              id="navbar-login-cta"
              onClick={() => setActiveTab('login')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-pink-500 to-sky-500 text-white shadow-md shadow-pink-900/40 hover:from-pink-400 hover:to-sky-400 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Institutional Sign In</span>
            </button>
          )}

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto max-w-full">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-sky-600 text-white shadow-md shadow-pink-950/60 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase ${
                        isActive ? 'bg-black/30 text-sky-200' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
