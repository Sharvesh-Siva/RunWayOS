/**
 * RunwayOS — Financial Operations Platform
 * Core Data Models and Domain Types
 */

export type TransactionStatus = 'settled' | 'pending';
export type CommitmentPriority = 'essential' | 'flexible' | 'discretionary';
export type ObligationStatus = 'due' | 'paid' | 'deferred' | 'cancelled';

export interface Transaction {
  id: string;
  day: number; // Day 1 to 30
  dateLabel: string;
  title: string;
  amount: number; // in INR (positive: outflow)
  category: 'food' | 'transport' | 'utilities' | 'housing' | 'entertainment' | 'health' | 'education' | 'other';
  status: TransactionStatus;
  note?: string;
}

export interface IncomeEvent {
  id: string;
  expectedDay: number;
  actualDay?: number;
  title: string;
  amount: number; // in INR (inflow)
  status: 'expected' | 'received' | 'delayed';
  confidence: 'high' | 'medium' | 'conditional';
  source: string;
}

export interface Commitment {
  id: string;
  dueDay: number;
  title: string;
  amount: number; // in INR (outflow)
  category: string;
  priority: CommitmentPriority;
  status: ObligationStatus;
  isRecurring: boolean;
  canDefer: boolean;
  deferPenaltyDays?: number;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDay: number;
  category: 'safety_net' | 'equipment' | 'emergency';
  allocatedDaily: number;
}

export interface UserConstraints {
  minimumReserve: number; // e.g. ₹1,000 emergency hard floor
  dailyDiscretionaryBudget: number; // standard food & minor transit allowance per day
  alertThresholdDays: number; // warn if shortfall within N days
}

export interface DayForecast {
  day: number;
  dateLabel: string;
  openingBalance: number;
  incomeTotal: number;
  committedTotal: number;
  discretionaryTotal: number;
  savingsTotal: number;
  simulatedTotal: number;
  closingBalance: number;
  minimumProjected: number;
  isConstraintBreached: boolean;
  events: Array<{
    type: 'income' | 'commitment' | 'discretionary' | 'savings' | 'simulated';
    title: string;
    amount: number;
    isOutflow: boolean;
  }>;
}

export interface MoneyAllocation {
  totalFunds: number;
  essentialCommitments: number;
  protectedReserve: number;
  savingsGoals: number;
  flexibleDiscretionary: number;
}

export interface CashMetrics {
  currentCash: number;
  unpaidEssentialCommitments: number;
  unpaidFlexibleCommitments: number;
  totalCommittedOutflow: number;
  pendingIncomeAmount: number;
  burnRateDailyAverage: number;
  protectedReserve: number;
  safeDiscretionaryRemaining: number;
  lowestProjectedBalance: number;
  lowestProjectedDay: number;
  firstBreachDay: number | null;
  monthEndBalance: number;
  monthEndDelta?: number;
  runwayDays: number;
  resilienceRating: 'Resilient' | 'Needs Attention' | 'At Risk';
  stressPassingPercentage: number;
  isAtRisk: boolean;
  allocation: MoneyAllocation;
}

export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  day: number;
  amount: number;
  isDelay?: boolean;
  isCheaperAlternative?: boolean;
  savingsAdjust?: number;
}

export interface DecisionProposal {
  id: string;
  title: string;
  category: string;
  options: DecisionOption[];
  selectedOptionId: string;
  urgency: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface StressScenario {
  id: string;
  name: string;
  description: string;
  type: 'unexpected_expense' | 'delayed_income' | 'variable_spending_surge' | 'compound_shock';
  expenseAmount?: number;
  expenseDay?: number;
  incomeDelayDays?: number;
  incomeId?: string;
  dailySurgeAmount?: number;
}

export interface RecoveryAction {
  id: string;
  title: string;
  description: string;
  type: 'delay_purchase' | 'cheaper_alternative' | 'pause_subscription' | 'defer_commitment' | 'reduce_discretionary';
  cashFreed: number;
  effectiveDay: number;
  tradeOff: string;
  targetCommitmentId?: string;
  applied: boolean;
  priorityRank: number;
}

export interface DecisionLogEntry {
  id: string;
  timestamp: string;
  dayOccurred: number;
  actionTitle: string;
  decisionType: 'purchase_evaluated' | 'stress_tested' | 'recovery_applied' | 'commitment_deferred';
  summary: string;
  lowestBalanceBefore: number;
  lowestBalanceAfter: number;
  userDecision: 'approved' | 'rejected' | 'modified';
  rationale: string;
}

export interface SystemEvidenceCall {
  id: string;
  timestamp: string;
  moduleName: string;
  operation: string;
  inputSummary: string;
  outputSummary: string;
  durationMs: number;
  status: 'success' | 'warning' | 'constrained';
}

export interface AppFinancialState {
  version: number;
  simulationDay: number;
  initialBalance: number;
  transactions: Transaction[];
  incomes: IncomeEvent[];
  commitments: Commitment[];
  goals: SavingsGoal[];
  constraints: UserConstraints;
  decisionHistory: DecisionLogEntry[];
  evidenceCalls: SystemEvidenceCall[];
}
