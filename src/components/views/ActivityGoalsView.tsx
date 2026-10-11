/**
 * RunwayOS — Commitments, Subscriptions & Goals Management
 * Structured ledger of fixed obligations and voluntary savings goals.
 */

import React, { useState } from 'react';
import {
  AppFinancialState,
  Commitment,
  SavingsGoal,
} from '../../types/finance';
import { formatINR } from '../../engine/financeEngine';
import {
  Calendar,
  Target,
  Plus,
  CheckCircle,
  Clock,
  Ban,
  Shield,
  Layers,
} from 'lucide-react';

interface ActivityGoalsViewProps {
  state: AppFinancialState;
  onUpdateState: (newState: AppFinancialState) => void;
}

export const ActivityGoalsView: React.FC<ActivityGoalsViewProps> = ({
  state,
  onUpdateState,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('500');
  const [newDueDay, setNewDueDay] = useState('15');
  const [newPriority, setNewPriority] = useState<'essential' | 'flexible' | 'discretionary'>('essential');
  const [newCategory, setNewCategory] = useState('utilities');

  const handleToggleStatus = (commitmentId: string, currentStatus: Commitment['status']) => {
    const updated = structuredClone(state);
    const target = updated.commitments.find((c) => c.id === commitmentId);
    if (!target) return;

    if (currentStatus === 'due') {
      target.status = 'paid';
    } else if (currentStatus === 'paid') {
      target.status = 'due';
    } else if (currentStatus === 'deferred') {
      target.status = 'due';
    }
    onUpdateState(updated);
  };

  const handleAddCommitment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newAmount);
    const dayNum = parseInt(newDueDay, 10);
    if (!newTitle || isNaN(amountNum) || isNaN(dayNum) || amountNum <= 0) return;

    const updated = structuredClone(state);
    const newCommitment: Commitment = {
      id: `com_${Date.now()}`,
      dueDay: Math.min(30, Math.max(1, dayNum)),
      title: newTitle,
      amount: amountNum,
      category: newCategory,
      priority: newPriority,
      status: 'due',
      isRecurring: true,
      canDefer: newPriority !== 'essential',
    };
    updated.commitments.push(newCommitment);
    onUpdateState(updated);
    setShowAddModal(false);
    setNewTitle('');
    setNewAmount('500');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-400" />
            Commitments & Savings Operations
          </h2>
          <p className="text-xs text-neutral-400">
            Audit fixed obligations, recurring subscriptions, and active capital reserve milestones
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-teal-400 hover:bg-teal-300 text-neutral-950 font-semibold text-xs rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Commitment</span>
        </button>
      </div>

      {/* Savings Goals Grid */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-teal-400" />
          Active Savings Goals
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));

            return (
              <div
                key={goal.id}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                    <span className="capitalize">{goal.category.replace('_', ' ')}</span>
                    <span className="font-mono text-teal-300 font-bold">{pct}%</span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1">{goal.title}</h4>
                  <div className="text-lg font-mono font-bold text-neutral-100 tabular-nums mb-3">
                    {formatINR(goal.currentAmount)}{' '}
                    <span className="text-xs text-neutral-500 font-normal">
                      / {formatINR(goal.targetAmount)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-neutral-800 rounded-full h-2 mb-3 overflow-hidden">
                    <div
                      className="bg-teal-400 h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-neutral-400 pt-3 border-t border-neutral-800 flex justify-between">
                  <span>Transfer: ₹{goal.allocatedDaily}/day</span>
                  <span>Target: Day {goal.targetDay}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Commitments & Subscriptions Ledger Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" />
              Scheduled Commitments & Subscriptions
            </h3>
            <p className="text-xs text-neutral-400">
              Inflows are evaluated against these dated deadlines
            </p>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            {state.commitments.length} Scheduled Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Deadline</th>
                <th className="py-3 px-3">Title / Obligation</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono">
              {state.commitments
                .slice()
                .sort((a, b) => a.dueDay - b.dueDay)
                .map((c) => {
                  const isPast = c.dueDay < state.simulationDay;

                  return (
                    <tr key={c.id} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3 px-3 text-neutral-300">
                        <span className="font-semibold text-white">Day {c.dueDay}</span>
                        {isPast && (
                          <span className="block text-[10px] text-neutral-500 font-sans">
                            (Past day)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className="font-semibold text-white block">{c.title}</span>
                        <span className="text-[11px] text-neutral-400 capitalize">
                          {c.category} · {c.canDefer ? 'Deferrable' : 'Strict Non-Deferrable'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[11px] capitalize font-medium ${
                          c.priority === 'essential'
                            ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                            : c.priority === 'flexible'
                            ? 'bg-teal-950 text-teal-300 border border-teal-800'
                            : 'bg-purple-950 text-purple-300 border border-purple-800'
                        }`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-white font-bold tabular-nums">
                        {formatINR(c.amount)}
                      </td>
                      <td className="py-3 px-3 text-center font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold ${
                          c.status === 'paid'
                            ? 'bg-teal-950 text-teal-300 border border-teal-800'
                            : c.status === 'due'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : c.status === 'deferred'
                            ? 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                            : 'bg-red-950 text-red-300 border border-red-800'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-sans">
                        <button
                          onClick={() => handleToggleStatus(c.id, c.status)}
                          className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs transition-colors border border-neutral-700"
                        >
                          {c.status === 'due' ? 'Mark Paid' : c.status === 'paid' ? 'Mark Due' : 'Reset'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Commitment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">
              Add Scheduled Financial Commitment
            </h3>

            <form onSubmit={handleAddCommitment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Commitment Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Health Insurance Premium"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Amount (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Due Day (1 to 30)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={newDueDay}
                    onChange={(e) => setNewDueDay(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Priority Tier
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                  >
                    <option value="essential">Essential (Non-negotiable)</option>
                    <option value="flexible">Flexible (Can defer)</option>
                    <option value="discretionary">Discretionary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                  >
                    <option value="housing">Housing / Rent</option>
                    <option value="utilities">Utilities & Telecom</option>
                    <option value="entertainment">Subscriptions / Cloud</option>
                    <option value="education">Education / Books</option>
                    <option value="health">Medical & Health</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-400 hover:bg-teal-300 text-neutral-950 font-bold text-xs rounded-lg transition-colors shadow-sm"
                >
                  Save Commitment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
