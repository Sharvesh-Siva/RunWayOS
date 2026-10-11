/**
 * RunwayOS — Demo Workspace Context & Simulation Controls
 * Enforces transparency: Fictional records notice, simulation day controls,
 * and quick-launch preconfigured evaluation journeys.
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, PlayCircle, ShieldCheck } from 'lucide-react';

interface DemoBannerProps {
  simulationDay: number;
  onSetSimulationDay: (day: number) => void;
  onLaunchJourney: (journey: 'A' | 'B' | 'C' | 'D') => void;
  onReset: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  simulationDay,
  onSetSimulationDay,
  onLaunchJourney,
  onReset,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 text-neutral-300 text-xs py-2 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Honest Fictional Disclosure */}
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
          <span className="font-medium text-neutral-200">
            DEMO WORKSPACE
          </span>
          <span className="text-neutral-500 hidden md:inline">·</span>
          <span className="text-neutral-400 hidden md:inline">
            All financial records are fictional. No bank account is connected.
          </span>
        </div>

        {/* Center / Right: Simulation Day Controller & Journeys */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Day Stepper */}
          <div className="flex items-center bg-neutral-800 rounded-lg p-0.5 border border-neutral-700/80">
            <button
              onClick={() => onSetSimulationDay(Math.max(1, simulationDay - 1))}
              disabled={simulationDay <= 1}
              className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 rounded transition-colors"
              title="Previous Day"
              aria-label="Previous Day"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-mono font-medium text-teal-300 tabular-nums">
              Day {simulationDay} of 30
            </span>
            <button
              onClick={() => onSetSimulationDay(Math.min(30, simulationDay + 1))}
              disabled={simulationDay >= 30}
              className="p-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 rounded transition-colors"
              title="Next Day"
              aria-label="Next Day"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Demo Journeys Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500 text-xs hidden lg:inline">Scenarios:</span>
            <select
              aria-label="Launch Guided Demo Journey"
              onChange={(e) => {
                if (e.target.value) {
                  onLaunchJourney(e.target.value as 'A' | 'B' | 'C' | 'D');
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs rounded-md px-2 py-1 focus:ring-1 focus:ring-teal-400 focus:outline-none"
            >
              <option value="" disabled>Launch Guided Scenario...</option>
              <option value="A">Journey A: ₹2,000 Purchase Decision</option>
              <option value="B">Journey B: ₹1,500 Emergency Expense Shock</option>
              <option value="C">Journey C: Delayed Freelance Income (+10 Days)</option>
              <option value="D">Journey D: Full Recovery Workflow</option>
            </select>
          </div>

          {/* Reset Action */}
          {showResetConfirm ? (
            <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-800 px-2 py-0.5 rounded text-xs text-red-200">
              <span>Reset plan?</span>
              <button
                onClick={() => {
                  onReset();
                  setShowResetConfirm(false);
                }}
                className="font-bold underline hover:text-white"
              >
                Yes
              </button>
              <span className="text-red-400">/</span>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-neutral-400 hover:text-neutral-200 text-xs underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
