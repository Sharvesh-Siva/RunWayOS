/**
 * RunwayOS — Fictional Demonstration Data Scenario
 * Spec: Starting funds ₹10,000, 30-day horizon, INR currency.
 * Fully coherent, cross-reconciled financial records.
 */

import { AppFinancialState } from '../types/finance';

export const INITIAL_DEMO_STATE: AppFinancialState = {
  version: 1,
  simulationDay: 1,
  initialBalance: 10000, // ₹10,000 opening funds
  transactions: [
    {
      id: 'tx_01',
      day: 1,
      dateLabel: 'Day 1',
      title: 'Groceries & Household Staples',
      amount: 450,
      category: 'food',
      status: 'settled',
      note: 'Fictional demo record: weekly vegetable & rice provision',
    },
    {
      id: 'tx_02',
      day: 1,
      dateLabel: 'Day 1',
      title: 'Metro Smart Card Recharge',
      amount: 300,
      category: 'transport',
      status: 'settled',
      note: 'Fictional demo record: transit allowance',
    },
  ],
  incomes: [
    {
      id: 'inc_freelance_14',
      expectedDay: 14,
      title: 'Freelance UI/Design Milestone Payment',
      amount: 4000,
      status: 'expected',
      confidence: 'medium',
      source: 'Client Design Retainer',
    },
  ],
  commitments: [
    {
      id: 'com_rent',
      dueDay: 5,
      title: 'Shared Living / PG Rent Share',
      amount: 4500,
      category: 'housing',
      priority: 'essential',
      status: 'due',
      isRecurring: true,
      canDefer: false,
    },
    {
      id: 'com_cloud',
      dueDay: 10,
      title: 'Cloud Development & Media Subscription',
      amount: 499,
      category: 'entertainment',
      priority: 'discretionary',
      status: 'due',
      isRecurring: true,
      canDefer: false,
    },
    {
      id: 'com_broadband',
      dueDay: 12,
      title: 'High-Speed Broadband & Wi-Fi',
      amount: 799,
      category: 'utilities',
      priority: 'essential',
      status: 'due',
      isRecurring: true,
      canDefer: true,
      deferPenaltyDays: 5,
    },
    {
      id: 'com_mobile',
      dueDay: 22,
      title: 'Postpaid Mobile Recharge & Data',
      amount: 399,
      category: 'utilities',
      priority: 'essential',
      status: 'due',
      isRecurring: true,
      canDefer: true,
    },
  ],
  goals: [
    {
      id: 'goal_safety_net',
      title: 'Baseline Emergency Buffer',
      targetAmount: 2500,
      currentAmount: 1000,
      targetDay: 30,
      category: 'safety_net',
      allocatedDaily: 50, // ₹50/day transferred to locked reserve
    },
  ],
  constraints: {
    minimumReserve: 1000, // ₹1,000 hard safety floor
    dailyDiscretionaryBudget: 150, // ₹150 daily food/tiffin & small transit
    alertThresholdDays: 5,
  },
  decisionHistory: [
    {
      id: 'dec_init',
      timestamp: new Date().toISOString(),
      dayOccurred: 1,
      actionTitle: 'Initial Baseline Plan Approved',
      decisionType: 'purchase_evaluated',
      summary: 'Baseline 30-day budget initialized with ₹10,000 opening capital and ₹1,000 protected reserve.',
      lowestBalanceBefore: 10000,
      lowestBalanceAfter: 1252,
      userDecision: 'approved',
      rationale: 'Baseline commitments verified against mid-month freelance milestone.',
    },
  ],
  evidenceCalls: [
    {
      id: 'ev_init_01',
      timestamp: '10:00:00 AM',
      moduleName: 'Financial State Reader',
      operation: 'Initialize Ledger & Invariants',
      inputSummary: 'Starting balance: ₹10,000 | 4 scheduled obligations | 1 income milestone',
      outputSummary: 'Settled cash: ₹9,250 | Projected lowest balance: ₹1,252 (Day 13)',
      durationMs: 3,
      status: 'success',
    },
  ],
};
