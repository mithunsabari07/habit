export type Category = 'Mind & Focus' | 'Health' | 'Fitness' | 'Productivity';

export type Cadence = 'Morning' | 'Evening' | 'Daily' | 'Mon - Fri' | 'Mon, Wed, Fri';

export type Priority = 'High' | 'Medium' | 'Normal';

export interface Habit {
  id: string;
  name: string;
  category: Category;
  cadence: Cadence;
  priority: Priority;
  targetWeekly: number;
  currentStreak: number;
  bestStreak: number;
  completedDates: string[]; // YYYY-MM-DD
  notes?: string;
  scheduledTime?: string;
  archived?: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  habitId: string;
  habitName: string;
  action: 'completed' | 'uncompleted' | 'created' | 'milestone';
  timestamp: string;
  details?: string;
}

export interface DayMetric {
  dateStr: string;
  dayName: string;
  totalHabits: number;
  completedHabits: number;
  percentage: number;
}

export interface UserProfile {
  name: string;
  title: string;
}

export interface TrajectoryPoint {
  label: string;
  subLabel: string;
  dateKey: string;
  score: number;
  completed: number;
  total: number;
  x: number;
  y: number;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  userProfile?: UserProfile;
  habits: Habit[];
  auditLogs?: AuditLog[];
}

