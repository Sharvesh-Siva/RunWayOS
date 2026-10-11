/**
 * RunwayOS — Local Persistence & State Versioning
 * Safe schema validation, parsing, error recovery, and reset capability.
 */

import { AppFinancialState } from '../types/finance';
import { INITIAL_DEMO_STATE } from './sampleData';

const STORAGE_KEY = 'runwayos_state_v1';

export function loadStoredState(): AppFinancialState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return structuredClone(INITIAL_DEMO_STATE);
    }
    const parsed = JSON.parse(raw);

    // Schema and invariant sanity checks
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      parsed.version === 1 &&
      typeof parsed.simulationDay === 'number' &&
      Array.isArray(parsed.transactions) &&
      Array.isArray(parsed.commitments) &&
      Array.isArray(parsed.incomes) &&
      parsed.constraints &&
      typeof parsed.constraints.minimumReserve === 'number'
    ) {
      return parsed as AppFinancialState;
    }

    console.warn('[RunwayOS] Stored state schema mismatch, resetting to initial demo scenario.');
    return structuredClone(INITIAL_DEMO_STATE);
  } catch (err) {
    console.error('[RunwayOS] Error reading stored state:', err);
    return structuredClone(INITIAL_DEMO_STATE);
  }
}

export function saveStateToStorage(state: AppFinancialState): void {
  try {
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
