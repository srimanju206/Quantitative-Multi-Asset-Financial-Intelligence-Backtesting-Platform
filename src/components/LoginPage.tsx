import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Layers,
  KeyRound,
  CheckCircle2,
  Cpu,
  UserCheck,
  Zap,
  GlobeLock
} from 'lucide-react';

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  badge: string;
  initials: string;
}

interface LoginPageProps {
  onLogin: (user: UserProfile) => void;
  onContinueAsGuest: () => void;
}

const DEMO_PROFILES: UserProfile[] = [
  {
    name: 'Alex Rivera',
    email: 'a.rivera@citadel-alpha.com',
    role: 'Lead Portfolio Manager',
    badge: 'Executive',
    initials: 'AR',
  },
  {
    name: 'Dr. Elena Vance',
    email: 'e.vance@bridgewater-quant.org',
    role: 'Chief Quant Researcher',
    badge: 'Research',
    initials: 'EV',
  },
  {
    name: 'Marcus Chen',
    email: 'm.chen@two-sigma-risk.com',
    role: 'Head of Risk & Compliance',
    badge: 'Risk Officer',
    initials: 'MC',
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onContinueAsGuest }) => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('a.rivera@citadel-alpha.com');
  const [password, setPassword] = useState<string>('••••••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<string>('Lead Portfolio Manager');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [enable2FA, setEnable2FA] = useState<boolean>(true);
  const [fullName, setFullName] = useState<string>('Alex Rivera');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Please provide a valid institutional email address.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    setIsLoading(true);

    // Simulate instant authentic institutional verification
    setTimeout(() => {
      setIsLoading(false);
      const nameToUse = isSignUp ? fullName || 'Quantitative Trader' : fullName || email.split('@')[0];
      const initials = nameToUse
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'QT';

      onLogin({
        name: nameToUse,
        email,
        role: selectedRole,
        badge: 'Verified Quant',
        initials,
      });
    }, 600);
  };

  const selectDemoProfile = (profile: UserProfile) => {
    setEmail(profile.email);
    setFullName(profile.name);
    setSelectedRole(profile.role);
    setPassword('quantTerminal2026!');
    setErrorMsg('');
  };

  return (
    <div className="min-h-[84vh] flex items-center justify-center px-4 py-8 relative z-20">
      <div className="w-full max-w-xl">
        {/* Glowing Decorative Outer Aura in Pink & Sky Blue */}
        <div className="relative group">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-pink-500 via-sky-400 to-pink-500 opacity-60 blur-xl group-hover:opacity-80 transition duration-700 animate-pulse" />

          {/* Main Card Container */}
          <div className="relative bg-slate-950/85 backdrop-blur-2xl border border-pink-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-pink-950/40 text-slate-100">
            {/* Header / Brand */}
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-sky-400 p-0.5 shadow-lg shadow-pink-500/30">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Layers className="w-7 h-7 text-sky-400 animate-pulse" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-400 via-sky-300 to-pink-300 bg-clip-text text-transparent">
                  QuantFinance AI
                </h2>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="h-px w-6 bg-pink-500/50" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-semibold">
                    INSTITUTIONAL QUANT ACCESS PORTAL
                  </span>
                  <span className="h-px w-6 bg-sky-500/50" />
                </div>
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Secure multi-asset algorithmic backtesting, 3D stochastic volatility manifolds, and AI strategists.
              </p>
            </div>

            {/* Quick Demo Credentials Autofill */}
            <div className="mb-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-pink-400" />
                  One-Click Demo Personas
                </span>
                <span className="text-[10px] font-mono text-sky-400">INSTANT FILL</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {DEMO_PROFILES.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectDemoProfile(p)}
                    className="p-2 rounded-xl text-left border border-slate-800/80 bg-slate-950/70 hover:border-pink-500/60 hover:bg-pink-950/20 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-200 group-hover:text-pink-300 transition-colors">
                        {p.name}
                      </span>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-sky-950/80 text-sky-300 border border-sky-800">
                        {p.initials}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{p.role}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sign In / Sign Up Tabs */}
            <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl mb-5">
              <button
                type="button"
                id="login-tab-signin"
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  !isSignUp
                    ? 'bg-gradient-to-r from-pink-500 to-sky-500 text-white shadow-md shadow-pink-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In to Terminal
              </button>
              <button
                type="button"
                id="login-tab-signup"
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  isSignUp
                    ? 'bg-gradient-to-r from-pink-500 to-sky-500 text-white shadow-md shadow-sky-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/80 text-rose-200 text-xs font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {isSignUp && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    id="signup-fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all font-mono"
                    required
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Institutional Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    id="login-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyst@fund.com"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all font-mono"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-300">Terminal Secret Key / Password</label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => alert('Password reset link sent to institutional security email.')}
                      className="text-[10px] text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      Forgot Key?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-10 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Trading &amp; Execution Role
                </label>
                <select
                  id="login-role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all text-xs"
                >
                  <option value="Lead Portfolio Manager">Lead Portfolio Manager (Alpha Execution)</option>
                  <option value="Chief Quant Researcher">Chief Quant Researcher (Model Validation)</option>
                  <option value="Head of Risk & Compliance">Head of Risk &amp; Compliance (Stress Testing)</option>
                  <option value="Algorithmic Trader">Algorithmic Trader (High-Frequency Execution)</option>
                </select>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-pink-500 focus:ring-pink-400"
                  />
                  <span>Remember terminal session</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enable2FA}
                    onChange={(e) => setEnable2FA(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-sky-400"
                  />
                  <span className="flex items-center gap-1 text-sky-400">
                    <KeyRound className="w-3 h-3" /> FIDO2 / YubiKey 2FA
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="login-submit-btn"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs tracking-wide bg-gradient-to-r from-pink-500 via-rose-500 to-sky-400 hover:from-pink-400 hover:via-rose-400 hover:to-sky-300 text-white shadow-lg shadow-pink-900/40 hover:shadow-sky-900/50 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Cryptographic Credentials...</span>
                  </div>
                ) : (
                  <>
                    <span>{isSignUp ? 'Establish Quant Identity' : 'Authenticate & Enter Terminal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Instant Guest Mode Access */}
              <div className="pt-2">
                <button
                  type="button"
                  id="login-guest-btn"
                  onClick={onContinueAsGuest}
                  className="w-full py-2 px-4 rounded-xl border border-sky-500/40 bg-sky-950/30 hover:bg-sky-950/60 text-sky-300 hover:text-sky-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <Zap className="w-3.5 h-3.5 text-sky-400" />
                  <span>Instant Guest Access (Explore Live Models)</span>
                </button>
              </div>
            </form>

            {/* Institutional Compliance Badges */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 font-mono">
              <div className="flex items-center gap-1.5">
                <GlobeLock className="w-3 h-3 text-emerald-400" />
                <span>256-Bit Post-Quantum TLS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-pink-400" />
                <span>SOC2 Type II Certified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-sky-400" />
                <span>SEC Rule 15c3-5 Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
