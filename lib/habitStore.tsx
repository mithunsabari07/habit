'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Habit,
  AuditLog,
  Category,
  Cadence,
  Priority,
  UserProfile,
  DayMetric,
  BackupData,
} from './types';
import { INITIAL_HABITS, INITIAL_AUDIT_LOGS, formatDate, calculateHabitStreak } from './seedData';

const HABITS_STORAGE_KEY = 'habitpulse_habits_v2';
const LOGS_STORAGE_KEY = 'habitpulse_logs_v2';
const PROFILE_STORAGE_KEY = 'habitpulse_profile_v2';
const LEGACY_HABITS_KEY = 'habitpulse_habits';
const LEGACY_LOGS_KEY = 'habitpulse_logs';

function safeSave(key: string, data: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[HabitPulse] Failed to write to localStorage key ${key}:`, err);
  }
}

interface HabitContextType {
  habits: Habit[];
  auditLogs: AuditLog[];
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  selectedDate: string;
  todayStr: string;
  setSelectedDate: (date: string) => void;
  filterCadence: string;
  setFilterCadence: (cadence: string) => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isNewHabitModalOpen: boolean;
  setIsNewHabitModalOpen: (open: boolean) => void;
  toggleCompletion: (habitId: string, dateStr?: string) => void;
  addHabit: (habitData: {
    name: string;
    category: Category;
    cadence: Cadence;
    priority: Priority;
    targetWeekly: number;
    notes?: string;
    scheduledTime?: string;
  }) => void;
  updateHabit: (habitId: string, updates: Partial<Habit>) => void;
  deleteHabit: (habitId: string) => void;
  resetData: () => void;
  importData: (imported: BackupData | Habit[]) => {
    success: boolean;
    count: number;
    message: string;
  };
  isLoaded: boolean;
  todayCompletedCount: number;
  todayTotalCount: number;
  todayPercentage: number;
  activeStreak: number;
  weeklyScore: number;
  pillarsDistribution: {
    productivity: number;
    health: number;
    fitness: number;
    mind: number;
  };
  currentWeekMetrics: DayMetric[];
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  title: 'Personal Tracker',
};

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const todayStr = formatDate(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [filterCadence, setFilterCadence] = useState<string>('All Cadences');
  const [filterCategory, setFilterCategory] = useState<string>('All Categories');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isNewHabitModalOpen, setIsNewHabitModalOpen] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on client mount (with legacy migration support)
  useEffect(() => {
    try {
      const savedHabits =
        localStorage.getItem(HABITS_STORAGE_KEY) || localStorage.getItem(LEGACY_HABITS_KEY);
      const savedLogs =
        localStorage.getItem(LOGS_STORAGE_KEY) || localStorage.getItem(LEGACY_LOGS_KEY);
      const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);

      if (savedHabits) {
        const parsed = JSON.parse(savedHabits);
        if (Array.isArray(parsed)) {
          // Calibrate streaks mathematically using real dates
          const calibrated = parsed.map((h: Habit) => {
            const { currentStreak, bestStreak } = calculateHabitStreak(
              h.completedDates || [],
              todayStr
            );
            return {
              ...h,
              currentStreak,
              bestStreak: Math.max(h.bestStreak || 0, bestStreak),
            };
          });
          setHabits(calibrated);
        }
      }
      if (savedLogs) {
        const parsed = JSON.parse(savedLogs);
        if (Array.isArray(parsed)) {
          setAuditLogs(parsed);
        }
      }
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed && typeof parsed === 'object') {
          setUserProfile(parsed);
        }
      }
    } catch (err) {
      console.warn('[HabitPulse] Error loading local storage:', err);
    }
    setIsLoaded(true);
  }, [todayStr]);

  // Synchronize across open tabs/windows on the same device
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === HABITS_STORAGE_KEY) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setHabits(parsed);
        } else if (e.key === LOGS_STORAGE_KEY) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setAuditLogs(parsed);
        } else if (e.key === PROFILE_STORAGE_KEY) {
          const parsed = JSON.parse(e.newValue);
          if (parsed) setUserProfile(parsed);
        }
      } catch {
        // ignore parse error from external tab
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Save to localStorage when state changes (only after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    safeSave(HABITS_STORAGE_KEY, habits);
  }, [habits, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    safeSave(LOGS_STORAGE_KEY, auditLogs);
  }, [auditLogs, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    safeSave(PROFILE_STORAGE_KEY, userProfile);
  }, [userProfile, isLoaded]);

  const updateUserProfile = useCallback((profile: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const updated = { ...prev, ...profile };
      safeSave(PROFILE_STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const toggleCompletion = useCallback(
    (habitId: string, dateToToggle?: string) => {
      const targetDate = dateToToggle || selectedDate;
      let habitName = '';
      let nowCompleted = false;

      setHabits((prev) => {
        const updated = prev.map((h) => {
          if (h.id !== habitId) return h;
          habitName = h.name;
          const alreadyDone = (h.completedDates || []).includes(targetDate);
          nowCompleted = !alreadyDone;
          const newDates = alreadyDone
            ? h.completedDates.filter((d) => d !== targetDate)
            : [...(h.completedDates || []), targetDate];

          // Recalculate mathematical streaks from real dates
          const { currentStreak, bestStreak } = calculateHabitStreak(newDates, todayStr);

          return {
            ...h,
            completedDates: newDates,
            currentStreak,
            bestStreak: Math.max(h.bestStreak || 0, bestStreak),
          };
        });

        safeSave(HABITS_STORAGE_KEY, updated);
        return updated;
      });

      // Create Audit Log entry
      const timeFormatted = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const newLog: AuditLog = {
        id: 'log-' + Date.now(),
        habitId,
        habitName,
        action: nowCompleted ? 'completed' : 'uncompleted',
        timestamp: timeFormatted,
        details: nowCompleted
          ? `Marked completed for ${targetDate}`
          : `Marked pending for ${targetDate}`,
      };

      setAuditLogs((prev) => {
        const nextLogs = [newLog, ...prev.slice(0, 49)];
        safeSave(LOGS_STORAGE_KEY, nextLogs);
        return nextLogs;
      });
    },
    [selectedDate, todayStr]
  );

  const addHabit = useCallback(
    (data: {
      name: string;
      category: Category;
      cadence: Cadence;
      priority: Priority;
      targetWeekly: number;
      notes?: string;
      scheduledTime?: string;
    }) => {
      const newHabit: Habit = {
        id: 'habit-' + Date.now(),
        name: data.name,
        category: data.category,
        cadence: data.cadence,
        priority: data.priority,
        targetWeekly: data.targetWeekly || 7,
        currentStreak: 0,
        bestStreak: 0,
        completedDates: [],
        notes: data.notes || '',
        scheduledTime: data.scheduledTime || '09:00 AM',
        createdAt: todayStr,
      };

      setHabits((prev) => {
        const nextHabits = [newHabit, ...prev];
        safeSave(HABITS_STORAGE_KEY, nextHabits);
        return nextHabits;
      });

      const timeFormatted = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const newLog: AuditLog = {
        id: 'log-' + Date.now(),
        habitId: newHabit.id,
        habitName: newHabit.name,
        action: 'created',
        timestamp: timeFormatted,
        details: `Created new habit under ${data.category}`,
      };

      setAuditLogs((prev) => {
        const nextLogs = [newLog, ...prev];
        safeSave(LOGS_STORAGE_KEY, nextLogs);
        return nextLogs;
      });
    },
    [todayStr]
  );

  const updateHabit = useCallback((habitId: string, updates: Partial<Habit>) => {
    setHabits((prev) => {
      const updated = prev.map((h) => (h.id === habitId ? { ...h, ...updates } : h));
      safeSave(HABITS_STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const deleteHabit = useCallback((habitId: string) => {
    setHabits((prev) => {
      const updated = prev.filter((h) => h.id !== habitId);
      safeSave(HABITS_STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const resetData = useCallback(() => {
    setHabits([]);
    setAuditLogs([]);
    try {
      localStorage.removeItem(HABITS_STORAGE_KEY);
      localStorage.removeItem(LOGS_STORAGE_KEY);
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      localStorage.removeItem(LEGACY_HABITS_KEY);
      localStorage.removeItem(LEGACY_LOGS_KEY);
    } catch {
      // ignore
    }
  }, []);

  const importData = useCallback(
    (imported: BackupData | Habit[]): { success: boolean; count: number; message: string } => {
      try {
        let habitsToSet: Habit[] = [];
        if (Array.isArray(imported)) {
          habitsToSet = imported;
        } else if (imported && typeof imported === 'object' && Array.isArray(imported.habits)) {
          habitsToSet = imported.habits;
          if (imported.userProfile) {
            setUserProfile(imported.userProfile);
            safeSave(PROFILE_STORAGE_KEY, imported.userProfile);
          }
          if (imported.auditLogs && Array.isArray(imported.auditLogs)) {
            setAuditLogs(imported.auditLogs);
            safeSave(LOGS_STORAGE_KEY, imported.auditLogs);
          }
        } else {
          return { success: false, count: 0, message: 'Invalid habit backup format.' };
        }

        const calibrated = habitsToSet.map((h) => {
          const { currentStreak, bestStreak } = calculateHabitStreak(
            h.completedDates || [],
            todayStr
          );
          return {
            ...h,
            currentStreak,
            bestStreak: Math.max(h.bestStreak || 0, bestStreak),
          };
        });

        setHabits(calibrated);
        safeSave(HABITS_STORAGE_KEY, calibrated);
        return {
          success: true,
          count: calibrated.length,
          message: `Successfully imported ${calibrated.length} routine${calibrated.length === 1 ? '' : 's'}.`,
        };
      } catch (err) {
        console.error('[HabitPulse] Import error:', err);
        return { success: false, count: 0, message: 'Failed to parse JSON backup.' };
      }
    },
    [todayStr]
  );

  // Real Metrics Calculations
  const activeHabits = habits.filter((h) => !h.archived);
  const todayTotalCount = activeHabits.length;
  const todayCompletedCount = activeHabits.filter(
    (h) => (h.completedDates || []).includes(selectedDate)
  ).length;

  const todayPercentage =
    todayTotalCount > 0 ? Math.round((todayCompletedCount / todayTotalCount) * 100) : 0;

  // Real active streak: max streak among user's active habits
  const activeStreak =
    activeHabits.length > 0 ? Math.max(...activeHabits.map((h) => h.currentStreak || 0)) : 0;

  // Compute 7-day current week metrics (Mon to Sun)
  const curr = new Date();
  const dayOfWeek = curr.getDay();
  const diffToMonday = curr.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(curr.getFullYear(), curr.getMonth(), diffToMonday);

  const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const currentWeekMetrics: DayMetric[] = [];
  let totalCompletionsThisWeek = 0;
  let totalPossibleThisWeek = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = formatDate(d);

    const completed = activeHabits.filter((h) =>
      (h.completedDates || []).includes(dateStr)
    ).length;
    const pct = todayTotalCount > 0 ? Math.round((completed / todayTotalCount) * 100) : 0;

    // Only count past and today days for weekly score calculation
    if (dateStr <= todayStr) {
      totalCompletionsThisWeek += completed;
      totalPossibleThisWeek += todayTotalCount;
    }

    currentWeekMetrics.push({
      dateStr,
      dayName: dayLetters[i],
      totalHabits: todayTotalCount,
      completedHabits: completed,
      percentage: pct,
    });
  }

  // Real weekly score
  const weeklyScore =
    totalPossibleThisWeek > 0
      ? Math.round((totalCompletionsThisWeek / totalPossibleThisWeek) * 100)
      : todayPercentage;

  // Real Pillar distribution counts
  const total = activeHabits.length;
  const productivityCount = activeHabits.filter((h) => h.category === 'Productivity').length;
  const healthCount = activeHabits.filter((h) => h.category === 'Health').length;
  const fitnessCount = activeHabits.filter((h) => h.category === 'Fitness').length;
  const mindCount = activeHabits.filter((h) => h.category === 'Mind & Focus').length;

  const pillarsDistribution = {
    productivity: total > 0 ? Math.round((productivityCount / total) * 100) : 0,
    health: total > 0 ? Math.round((healthCount / total) * 100) : 0,
    fitness: total > 0 ? Math.round((fitnessCount / total) * 100) : 0,
    mind: total > 0 ? Math.round((mindCount / total) * 100) : 0,
  };

  return (
    <HabitContext.Provider
      value={{
        habits,
        auditLogs,
        userProfile,
        updateUserProfile,
        selectedDate,
        todayStr,
        setSelectedDate,
        filterCadence,
        setFilterCadence,
        filterCategory,
        setFilterCategory,
        searchQuery,
        setSearchQuery,
        isNewHabitModalOpen,
        setIsNewHabitModalOpen,
        toggleCompletion,
        addHabit,
        updateHabit,
        deleteHabit,
        resetData,
        importData,
        isLoaded,
        todayCompletedCount,
        todayTotalCount,
        todayPercentage,
        activeStreak,
        weeklyScore,
        pillarsDistribution,
        currentWeekMetrics,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};

export const useHabitStore = () => {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabitStore must be used within a HabitProvider');
  }
  return context;
};
