/**
 * RunwayOS — Test Decision & Scenario Launcher Modal
 * Allows interactive evaluation of proposed purchases and stress events.
 */

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { formatINR } from '../../engine/financeEngine';

interface DecisionLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulationDay: number;
  onNavigateToDecisionLab: (item: { title: string; amount: number; day: number }) => void;
  onApplyStressExpense: (amount: number, title: string) => void;
  onDelayIncome: (delayDays: number) => void;
}

export const DecisionLauncherModal: React.FC<DecisionLauncherModalProps> = ({
  isOpen,
  onClose,
  simulationDay,
  onNavigateToDecisionLab,
  onApplyStressExpense,
  onDelayIncome,
}) => {
  if (!isOpen) return null;

  const [activeMode, setActiveMode] = useState<'purchase' | 'emergency' | 'delayed_income'>('purchase');
  const [purchaseTitle, setPurchaseTitle] = useState('Required Reference Textbook & Notes');
  const [purchaseAmount, setPurchaseAmount] = useState('2000');
  const [purchaseDay, setPurchaseDay] = useState(simulationDay.toString());

  const [emergencyAmount, setEmergencyAmount] = useState('1500');
  const [emergencyTitle, setEmergencyTitle] = useState('Sudden Bicycle & Mobile Repair');

  const [delayDays, setDelayDays] = useState('10');

  const handleLaunchPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(purchaseAmount);
    const day = parseInt(purchaseDay, 10);
    if (!purchaseTitle || isNaN(amount) || isNaN(day) || amount <= 0) return;

    onNavigateToDecisionLab({
      title: purchaseTitle,
      amount,
      day: Math.min(30, Math.max(1, day)),
    });
    onClose();
  };

  const handleLaunchEmergency = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(emergencyAmount);
    if (isNaN(amount) || amount <= 0) return;

    onApplyStressExpense(amount, emergencyTitle);
    onClose();
  };

  const handleLaunchDelayIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const days = parseInt(delayDays, 10);
    if (isNaN(days) || days <= 0) return;

    onDelayIncome(days);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">
              Launch Financial Simulation
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 rounded-xl mb-5 text-xs font-medium">
          <button
            onClick={() => setActiveMode('purchase')}
            className={`py-2 px-3 rounded-lg transition-colors ${
              activeMode === 'purchase'
                ? 'bg-neutral-800 text-teal-300 font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Test Purchase
          </button>
          <button
            onClick={() => setActiveMode('emergency')}
            className={`py-2 px-3 rounded-lg transition-colors ${
              activeMode === 'emergency'
                ? 'bg-neutral-800 text-amber-300 font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Emergency Shock
          </button>
          <button
            onClick={() => setActiveMode('delayed_income')}
            className={`py-2 px-3 rounded-lg transition-colors ${
              activeMode === 'delayed_income'
                ? 'bg-neutral-800 text-teal-300 font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Delayed Income
          </button>
        </div>

        {/* Mode 1: Test Purchase */}
        {activeMode === 'purchase' && (
          <form onSubmit={handleLaunchPurchase} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Purchase Description
              </label>
              <input
                type="text"
                required
                value={purchaseTitle}
                onChange={(e) => setPurchaseTitle(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Cost (₹ INR)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Proposed Day (1-30)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={purchaseDay}
                  onChange={(e) => setPurchaseDay(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400 font-mono"
                />
              </div>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              This will open the <strong>Decision Lab</strong> to compare buying now vs cheaper refurbished options vs waiting until after Day 14.
            </p>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-teal-400 hover:bg-teal-300 text-neutral-950 font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              <span>Open in Decision Lab</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Mode 2: Emergency Expense */}
        {activeMode === 'emergency' && (
          <form onSubmit={handleLaunchEmergency} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Emergency Event Description
              </label>
              <input
                type="text"
                required
                value={emergencyTitle}
                onChange={(e) => setEmergencyTitle(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Sudden Outflow Amount (₹ INR)
              </label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[500, 1000, 1500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setEmergencyAmount(amt.toString())}
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono border ${
                      emergencyAmount === amt.toString()
                        ? 'border-amber-400 bg-amber-950/40 text-amber-300'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                required
                value={emergencyAmount}
                onChange={(e) => setEmergencyAmount(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
              />
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Incurring an unplanned expense tests whether your safety margin will breach the ₹1,000 floor before obligations arrive.
            </p>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              <span>Apply Sudden Expense to Day {simulationDay}</span>
              <AlertTriangle className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Mode 3: Delayed Income */}
        {activeMode === 'delayed_income' && (
          <form onSubmit={handleLaunchDelayIncome} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Income Source
              </label>
              <div className="px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200">
                Freelance UI/Design Milestone Payment (₹4,000 scheduled for Day 14)
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Delay Duration (Days)
              </label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[5, 10, 14].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDelayDays(d.toString())}
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono border ${
                      delayDays === d.toString()
                        ? 'border-teal-400 bg-teal-950/40 text-teal-300'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400'
                    }`}
                  >
                    +{d} Days
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                max="20"
                required
                value={delayDays}
                onChange={(e) => setDelayDays(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400 font-mono"
              />
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Postpones receipt of ₹4,000 client retainer to Day {14 + (parseInt(delayDays, 10) || 0)}, simulating late invoice settlement.
            </p>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-teal-400 hover:bg-teal-300 text-neutral-950 font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              <span>Delay Income by {delayDays} Days</span>
              <Calendar className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
