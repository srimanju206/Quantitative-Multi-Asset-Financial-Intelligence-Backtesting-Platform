/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { FinancialWorldBackground } from './components/FinancialWorldBackground';
import { BacktestLab } from './components/BacktestLab';
import { ThreeDVisualizer } from './components/ThreeDVisualizer';
import { RegimeDetector } from './components/RegimeDetector';
import { CorrelationMatrix } from './components/CorrelationMatrix';
import { StressTester } from './components/StressTester';
import { MonteCarloSim } from './components/MonteCarloSim';
import { AIQuantAdvisor } from './components/AIQuantAdvisor';
import { LoginPage, UserProfile } from './components/LoginPage';
import { BacktestResponse } from './types';
import { Activity, Eye, Sliders, Sparkles, UserCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('login');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>({
    name: 'Alex Rivera',
    email: 'a.rivera@citadel-alpha.com',
    role: 'Lead Portfolio Manager',
    badge: 'Executive',
    initials: 'AR',
  });
  const [lastBacktest, setLastBacktest] = useState<BacktestResponse | null>(null);
  const [bgOpacity, setBgOpacity] = useState<number>(0.9);

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setActiveTab('backtest');
  };

  const handleContinueAsGuest = () => {
    setCurrentUser({
      name: 'Guest Quant',
      email: 'guest@terminal.local',
      role: 'Quantitative Explorer',
      badge: 'Guest Session',
      initials: 'GQ',
    });
    setActiveTab('backtest');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('login');
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white relative overflow-x-hidden bg-slate-950/70">
      {/* 3D Animated Live Financial World Background in Vibrant Pink & Sky Blue */}
      <FinancialWorldBackground opacity={bgOpacity} interactive={true} />

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 relative z-10">
        {activeTab === 'login' && (
          <LoginPage
            onLogin={handleLogin}
            onContinueAsGuest={handleContinueAsGuest}
          />
        )}

        {activeTab === 'backtest' && (
          <BacktestLab onRunComplete={(res) => setLastBacktest(res)} />
        )}

        {activeTab === '3d-surface' && (
          <ThreeDVisualizer />
        )}

        {activeTab === 'regimes' && (
          <RegimeDetector />
        )}

        {activeTab === 'correlations' && (
          <CorrelationMatrix />
        )}

        {activeTab === 'stress-test' && (
          <StressTester />
        )}

        {activeTab === 'monte-carlo' && (
          <MonteCarloSim />
        )}

        {activeTab === 'ai-strategist' && (
          <AIQuantAdvisor currentMetrics={lastBacktest?.summary} />
        )}
      </main>

      <footer className="w-full bg-slate-950/85 backdrop-blur-md border-t border-pink-500/20 py-3.5 text-xs text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-slate-300">Quant Engine: Online</span>
            <span>&bull;</span>
            <span className="text-sky-400 flex items-center gap-1.5 font-sans font-medium">
              <Sparkles className="w-3 h-3 text-pink-400" />
              Pink &amp; Sky Blue 3D Studio
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            {/* 3D Background Intensity Quick Dial */}
            <div className="flex items-center gap-2 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-pink-500/20">
              <Eye className="w-3 h-3 text-pink-400" />
              <span>3D Backdrop:</span>
              <button
                onClick={() => setBgOpacity(0.5)}
                className={`px-1.5 py-0.5 rounded text-[10px] ${bgOpacity === 0.5 ? 'bg-gradient-to-r from-pink-500 to-sky-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Subtle
              </button>
              <button
                onClick={() => setBgOpacity(0.9)}
                className={`px-1.5 py-0.5 rounded text-[10px] ${bgOpacity === 0.9 ? 'bg-gradient-to-r from-pink-500 to-sky-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Balanced
              </button>
              <button
                onClick={() => setBgOpacity(1.0)}
                className={`px-1.5 py-0.5 rounded text-[10px] ${bgOpacity === 1.0 ? 'bg-gradient-to-r from-pink-500 to-sky-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Cinema
              </button>
            </div>

            <span className="hidden md:inline">&bull;</span>
            <span className="hidden md:inline text-pink-300">Gemini 3.8 Flash Neural PM</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
