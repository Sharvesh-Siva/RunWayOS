/**
 * RunwayOS — Available to Spend Calculation Breakdown Modal
 * Explains the exact mathematical derivation of safe discretionary cash:
 * Current Cash - Unpaid Essential Commitments - Protected Reserve = Safe Discretionary
 */

import React from 'react';
import { X, ShieldCheck, CheckCircle2, ArrowRight, HelpCircle } from 'lucide-react';
import { formatINR } from '../../engine/financeEngine';
import { CashMetrics, Commitment } from '../../types/finance';

interface AvailableToSpendModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: CashMetrics;
  essentialCommitments: Commitment[];
  simulationDay: number;
}

export const AvailableToSpendModal: React.FC<AvailableToSpendModalProps> = ({
  isOpen,
  onClose,
  metrics,
  essentialCommitments,
  simulationDay,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">
              Available to Spend Calculation Model
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed mb-4">
          RunwayOS calculates your discretionary allowance using deterministic constraint evaluation. Unlike traditional budgets that report misleading total balances, this represents safe cash you can allocate right now without endangering scheduled non-negotiable obligations.
        </p>

        {/* Step-by-Step Mathematical Waterfall */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 font-mono text-xs space-y-3 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-neutral-300 font-sans">1. Settled Cash in Account (Day {simulationDay})</span>
            <span className="text-white font-bold tabular-nums">
              {formatINR(metrics.currentCash, true)}
            </span>
          </div>

          <div className="flex items-center justify-between text-red-400">
            <span className="font-sans">2. Earmarked for Essential Bills</span>
            <span className="tabular-nums">
              {formatINR(-metrics.unpaidEssentialCommitments, true)}
            </span>
          </div>

          <div className="flex items-center justify-between text-amber-400">
            <span className="font-sans">3. Locked Emergency Reserve Floor</span>
            <span className="tabular-nums">
              {formatINR(-metrics.protectedReserve, true)}
            </span>
          </div>

          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-sm">
            <span className="font-sans font-bold text-teal-300">
              = Safely Available for Discretionary
            </span>
            <span className="font-bold text-teal-300 tabular-nums">
              {formatINR(metrics.safeDiscretionaryRemaining)}
            </span>
          </div>
        </div>

        {/* Upcoming Essential Commitments Earmarked */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider mb-2">
            Earmarked Essential Commitments:
          </h4>
          <div className="space-y-1.5 text-xs">
            {essentialCommitments.map((com) => (
              <div
                key={com.id}
                className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/60 border border-neutral-800/80"
              >
                <div>
                  <span className="text-white font-medium">{com.title}</span>
                  <span className="text-[11px] text-neutral-400 block">Due Day {com.dueDay}</span>
                </div>
                <span className="font-mono text-neutral-200 font-bold tabular-nums">
                  {formatINR(com.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-neutral-800 text-[11px] text-neutral-400">
          Emergency reserve floor of ₹{metrics.protectedReserve} is configured in user settings.
        </div>
      </div>
    </div>
  );
};
