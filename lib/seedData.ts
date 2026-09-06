import { Habit, AuditLog } from './types';

// Helper to format Date to YYYY-MM-DD
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Calculate real consecutive streak and historical best streak from completed dates
export function calculateHabitStreak(
  completedDates: string[],
  todayStr: string
): { currentStreak: number; bestStreak: number } {
  if (!completedDates || completedDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const uniqueDates = Array.from(new Set(completedDates)).sort();
  const dateSet = new Set(uniqueDates);

  let best = 0;
  let running = 0;
  let prevDate: Date | null = null;

  for (const dStr of uniqueDates) {
    const d = new Date(dStr + 'T00:00:00');
    if (!prevDate) {
      running = 1;
    } else {
      const diffDays = Math.round((d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        running += 1;
      } else if (diffDays > 1) {
        running = 1;
      }
    }
    prevDate = d;
    if (running > best) best = running;
  }

  let current = 0;
  const today = new Date(todayStr + 'T00:00:00');
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  let checkDate: Date;
  if (dateSet.has(todayStr)) {
    checkDate = new Date(today);
  } else if (dateSet.has(yesterdayStr)) {
    checkDate = new Date(yesterday);
  } else {
    return { currentStreak: 0, bestStreak: best };
  }

  while (true) {
    const s = formatDate(checkDate);
    if (dateSet.has(s)) {
      current += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { currentStreak: current, bestStreak: Math.max(best, current) };
}

// Brand new clean baseline with zero dummy data
export const INITIAL_HABITS: Habit[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
