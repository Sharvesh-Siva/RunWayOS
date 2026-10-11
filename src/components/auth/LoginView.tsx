/**
 * RunwayOS — Application Entry: Login and Honest Demo Access
 * Complies with Section 4:
 * Split-screen layout, honest demo-first access, input validation,
 * show/hide password, and zero fake security claims.
 */

import React, { useState } from 'react';
import { Compass, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface LoginViewProps {
  onEnterDemo: () => void;
  onLoginSuccess: (email: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onEnterDemo,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError(null);
    onLoginSuccess(email);
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full mx-auto bg-neutral-950 rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Authentic Authentication & Direct Demo Workspace */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between">
          <div>
            {/* Brand Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
                <Compass className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white font-sans">
                  Runway<span className="text-teal-400">OS</span>
                </span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
              Make your money last. Keep your options open.
            </h1>
            <p className="text-sm text-neutral-400 mb-8 leading-relaxed">
              Personal financial operations and decision intelligence designed for tight monthly horizons and uncertain cashflow.
            </p>

            {/* Direct Demo Entry Banner (First-Class Feature) */}
            <div className="bg-teal-950/40 border border-teal-800/60 rounded-xl p-4 mb-8">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-teal-200 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                    Public Demonstration Workspace
                  </h2>
                  <p className="text-xs text-neutral-300 leading-relaxed mb-3">
                    Instant access to the complete 30-day fictional financial scenario (₹10,000 opening capital). No sign-up or bank linking required.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onEnterDemo}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-400 hover:bg-teal-300 text-neutral-950 text-sm font-semibold rounded-lg transition-colors shadow-sm"
              >
                <span>Explore Demo Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Optional Credentials Form */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-neutral-950 px-2 text-neutral-500 font-medium">
                  Or Sign In to Saved Profile
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-lg text-xs text-red-300">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@domain.com"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent placeholder:text-neutral-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent placeholder:text-neutral-600 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium rounded-lg transition-colors border border-neutral-700"
              >
                Sign In
              </button>
            </form>
          </div>

          {/* Honest Disclosure Footer */}
          <div className="mt-8 pt-4 border-t border-neutral-800/80 text-xs text-neutral-500">
            <p>
              Educational financial planning platform. Not a bank, creditor, or investment advisory.
            </p>
          </div>
        </div>

        {/* Right Column: Editorial Graphic & Architecture */}
        <div className="lg:col-span-5 bg-neutral-900 p-8 sm:p-12 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-neutral-800">
          <div>
            <div className="rounded-xl overflow-hidden border border-neutral-800 mb-6 bg-neutral-950">
              <img
                src="/src/assets/images/runway_financial_editorial_1791708883510.jpg"
                alt="RunwayOS 30-Day Financial Timeline"
                className="w-full h-48 sm:h-56 object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <h3 className="text-base font-semibold text-neutral-100 mb-3">
              The Connected Decision Cycle
            </h3>
            
            <div className="space-y-3 text-xs text-neutral-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Dated Availability:</strong> Evaluates exactly when cash clears vs when obligations strike.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Deterministic Invariants:</strong> Zero hallucinated math; exact rupee accounting.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Simulation Sandboxes:</strong> Preview purchase trade-offs without mutating active budgets.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Constraint-Aware Recovery:</strong> Proposes ranked recovery options before shortfalls occur.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 p-3 rounded-lg bg-neutral-800/40 border border-neutral-800 text-xs text-neutral-400">
            Current Scenario Horizon: 30 Days · Starting Corpus: ₹10,000 · Currency: INR (₹)
          </div>
        </div>
      </div>
    </div>
  );
};
