/**
 * RunwayOS — Local Persistence & State Versioning
 * Validate persisted records before they enter the financial engine.
 */

import {
  AppFinancialState,
  Commitment,
  DecisionLogEntry,
  IncomeEvent,
  SavingsGoal,
  SystemEvidenceCall,
  Transaction,
} from '../types/finance';
import { INITIAL_DEMO_STATE } from './sampleData';

const STORAGE_KEY = 'runwayos_state_v1';
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const isOptionalString = (value: unknown): boolean =>
  value === undefined || typeof value === 'string';
const isDay = (value: unknown): boolean =>
  Number.isInteger(value) && typeof value === 'number' && value >= 1 && value <= 30;

function isTransaction(value: unknown): value is Transaction {
  if (!isRecord(value)) return false;
  return isNonEmptyString(value.id) && isDay(value.day) &&
    isNonEmptyString(value.dateLabel) && isNonEmptyString(value.title) &&
    isFiniteNumber(value.amount) && value.amount >= 0 &&
    ['food', 'transport', 'utilities', 'housing', 'entertainment', 'health', 'education', 'other'].includes(String(value.category)) &&
    ['settled', 'pending'].includes(String(value.status)) && isOptionalString(value.note);
}

function isIncome(value: unknown): value is IncomeEvent {
  if (!isRecord(value)) return false;
  return isNonEmptyString(value.id) && isDay(value.expectedDay) &&
    (value.actualDay === undefined || isDay(value.actualDay)) &&
    isNonEmptyString(value.title) && isFiniteNumber(value.amount) && value.amount >= 0 &&
    ['expected', 'received', 'delayed'].includes(String(value.status)) &&
    ['high', 'medium', 'conditional'].includes(String(value.confidence)) &&
    isNonEmptyString(value.source);
}

function isCommitment(value: unknown): value is Commitment {
  if (!isRecord(value)) return false;
  return isNonEmptyString(value.id) && isDay(value.dueDay) &&
    isNonEmptyString(value.title) && isFiniteNumber(value.amount) && value.amount >= 0 &&
    typeof value.category === 'string' &&
    ['essential', 'flexible', 'discretionary'].includes(String(value.priority)) &&
    ['due', 'paid', 'deferred', 'cancelled'].includes(String(value.status)) &&
    typeof value.isRecurring === 'boolean' && typeof value.canDefer === 'boolean' &&
    (value.deferPenaltyDays === undefined || (Number.isInteger(value.deferPenaltyDays) && Number(value.deferPenaltyDays) >= 0));
}

function isGoal(value: unknown): value is SavingsGoal {
  if (!isRecord(value)) return false;
  return isNonEmptyString(value.id) && isNonEmptyString(value.title) &&
    isFiniteNumber(value.targetAmount) && value.targetAmount >= 0 &&
    isFiniteNumber(value.currentAmount) && value.currentAmount >= 0 &&
    isDay(value.targetDay) &&
    ['safety_net', 'equipment', 'emergency'].includes(String(value.category)) &&
    isFiniteNumber(value.allocatedDaily) && value.allocatedDaily >= 0;
}

function isDecisionEntry(value: unknown): value is DecisionLogEntry {
  if (!isRecord(value)) return false;
  return isNonEmptyString(value.id) && isNonEmptyString(value.timestamp) &&
    isDay(value.dayOccurred) && isNonEmptyString(value.actionTitle) &&
    ['purchase_evaluated', 'stress_tested', 'recovery_applied', 'commitment_deferred'].includes(String(value.decisionType)) &&
    typeof value.summary === 'string' &&
    isFiniteNumber(value.lowestBalanceBefore) && isFiniteNumber(value.lowestBalanceAfter) &&
    ['approved', 'rejected', 'modified'].includes(String(value.userDecision)) &&
    typeof value.rationale === 'string';
}

function isEvidenceCall(value: unknown): value is SystemEvidenceCall {
  if (!isRecord(value)) return false;
  return isNonEmptyString(value.id) && isNonEmptyString(value.timestamp) &&
    isNonEmptyString(value.moduleName) && isNonEmptyString(value.operation) &&
    typeof value.inputSummary === 'string' && typeof value.outputSummary === 'string' &&
    isFiniteNumber(value.durationMs) && value.durationMs >= 0 &&
    ['success', 'warning', 'constrained'].includes(String(value.status));
}

export function isValidFinancialState(value: unknown): value is AppFinancialState {
  if (!isRecord(value) || value.version !== 1 || !isDay(value.simulationDay) ||
      !isFiniteNumber(value.initialBalance) || value.initialBalance < 0 ||
      !Array.isArray(value.transactions) || !value.transactions.every(isTransaction) ||
      !Array.isArray(value.incomes) || !value.incomes.every(isIncome) ||
      !Array.isArray(value.commitments) || !value.commitments.every(isCommitment) ||
      !Array.isArray(value.goals) || !value.goals.every(isGoal) ||
      !Array.isArray(value.decisionHistory) || !value.decisionHistory.every(isDecisionEntry) ||
      !Array.isArray(value.evidenceCalls) || !value.evidenceCalls.every(isEvidenceCall) ||
      !isRecord(value.constraints)) return false;

  const constraints = value.constraints;
  return isFiniteNumber(constraints.minimumReserve) && constraints.minimumReserve >= 0 &&
    isFiniteNumber(constraints.dailyDiscretionaryBudget) && constraints.dailyDiscretionaryBudget >= 0 &&
    isFiniteNumber(constraints.alertThresholdDays) &&
    Number.isInteger(constraints.alertThresholdDays) &&
    constraints.alertThresholdDays >= 0 && constraints.alertThresholdDays <= 30;
}

export function loadStoredState(): AppFinancialState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(INITIAL_DEMO_STATE);

    const parsed: unknown = JSON.parse(raw);
    if (isValidFinancialState(parsed)) return parsed;

    console.warn('[RunwayOS] Stored state failed validation; restoring the demo scenario.');
    return structuredClone(INITIAL_DEMO_STATE);
  } catch (err) {
    console.error('[RunwayOS] Could not read stored state; restoring the demo scenario.', err);
    return structuredClone(INITIAL_DEMO_STATE);
  }
}

export function saveStateToStorage(state: AppFinancialState): void {
  try {
    // Avoid persisting malformed state if a future UI path bypasses domain validation.
    if (!isValidFinancialState(state)) {
      console.error('[RunwayOS] Refused to persist invalid financial state.');
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('[RunwayOS] Failed to save state to localStorage:', err);
  }
}

export function resetDemoState(): AppFinancialState {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[RunwayOS] LocalStorage clear error:', err);
  }
  return structuredClone(INITIAL_DEMO_STATE);
}
