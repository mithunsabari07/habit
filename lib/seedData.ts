import { Habit, AuditLog } from './types';

// Helper to format Date to YYYY-MM-DD
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Brand new clean baseline with zero dummy data
export const INITIAL_HABITS: Habit[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
