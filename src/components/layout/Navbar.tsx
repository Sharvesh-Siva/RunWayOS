/**
 * RunwayOS — Top Navigation Bar
 * Follows strict Top Bar Contract:
 * [Zone 1: Brand title/wordmark] — [Zone 2: 5 clean nav links] — [Zone 3: 1 primary CTA + profile]
 */

import React from 'react';
import { Compass, Sparkles, LogIn, RotateCcw } from 'lucide-react';

interface NavbarProps {
  activeTab: 'overview' | 'cashflow' | 'decision_lab' | 'recovery' | 'activity' | 'history';
  onSelectTab: (tab: 'overview' | 'cashflow' | 'decision_lab' | 'recovery' | 'activity' | 'history') => void;
  onOpenTestDecision: () => void;
  onOpenAuthModal: () => void;
  onResetDemo: () => void;
  isLoggedIn: boolean;
  userEmail: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenTestDecision,
  onOpenAuthModal,
  onResetDemo,
  isLoggedIn,
  userEmail,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-neutral-900 text-neutral-100 border-b border-neutral-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark with geometric glyph */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('overview')}
            className="flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg p-1"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 group-hover:bg-teal-500/30 transition-colors">
              <Compass className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white font-sans whitespace-nowrap">
                Runway<span className="text-teal-400">OS</span>
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: 5 clean, single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-sm font-medium">
          <button
            onClick={() => onSelectTab('overview')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'overview'
                ? 'bg-neutral-800 text-teal-300 font-semibold'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onSelectTab('cashflow')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'cashflow'
                ? 'bg-neutral-800 text-teal-300 font-semibold'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            Cashflow
          </button>
          <button
            onClick={() => onSelectTab('decision_lab')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'decision_lab'
                ? 'bg-neutral-800 text-teal-300 font-semibold'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            Decision Lab
          </button>
          <button
            onClick={() => onSelectTab('recovery')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'recovery'
                ? 'bg-neutral-800 text-teal-300 font-semibold'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            Recovery Center
          </button>
          <button
            onClick={() => onSelectTab('activity')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'activity'
                ? 'bg-neutral-800 text-teal-300 font-semibold'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            Activity & Goals
          </button>
          <button
            onClick={() => onSelectTab('history')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'history'
                ? 'bg-neutral-800 text-teal-300 font-semibold'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            Evidence Trace
          </button>
        </nav>

        {/* Zone 3: 1 primary action + profile / demo trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenTestDecision}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-900 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Test a Decision</span>
          </button>

          {isLoggedIn ? (
            <div className="flex items-center gap-2 pl-2 border-l border-neutral-700">
              <img
                src="/src/assets/images/user_profile_avatar_1791708899048.jpg"
                alt="User Profile"
                className="w-7 h-7 rounded-full object-cover border border-neutral-600"
              />
              <span className="hidden lg:inline text-xs text-neutral-300 max-w-[110px] truncate">
                {userEmail}
              </span>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
              title="Sign In or Demo Info"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          <button
            onClick={onResetDemo}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors"
            title="Reset to Initial Scenario"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 bg-neutral-950/80 border-t border-neutral-800 text-xs gap-2">
        <button
          onClick={() => onSelectTab('overview')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeTab === 'overview' ? 'bg-neutral-800 text-teal-300 font-medium' : 'text-neutral-400'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => onSelectTab('cashflow')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeTab === 'cashflow' ? 'bg-neutral-800 text-teal-300 font-medium' : 'text-neutral-400'
          }`}
        >
          Cashflow
        </button>
        <button
          onClick={() => onSelectTab('decision_lab')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeTab === 'decision_lab' ? 'bg-neutral-800 text-teal-300 font-medium' : 'text-neutral-400'
          }`}
        >
          Decision Lab
        </button>
        <button
          onClick={() => onSelectTab('recovery')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeTab === 'recovery' ? 'bg-neutral-800 text-teal-300 font-medium' : 'text-neutral-400'
          }`}
        >
          Recovery
        </button>
        <button
          onClick={() => onSelectTab('activity')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeTab === 'activity' ? 'bg-neutral-800 text-teal-300 font-medium' : 'text-neutral-400'
          }`}
        >
          Goals
        </button>
        <button
          onClick={() => onSelectTab('history')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeTab === 'history' ? 'bg-neutral-800 text-teal-300 font-medium' : 'text-neutral-400'
          }`}
        >
          Trace
        </button>
      </div>
    </header>
  );
};
