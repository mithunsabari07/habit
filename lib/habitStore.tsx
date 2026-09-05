'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Habit, AuditLog, Category, Cadence, Priority, UserProfile, DayMetric } from './types';
import { INITIAL_HABITS, INITIAL_AUDIT_LOGS, formatDate } from './seedData';

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

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const savedHabits = localStorage.getItem('habitpulse_habits_v2');
      const savedLogs = localStorage.getItem('habitpulse_logs_v2');
      const savedProfile = localStorage.getItem('habitpulse_profile_v2');
      if (savedHabits) {
        setHabits(JSON.parse(savedHabits));
      }
      if (savedLogs) {
        setAuditLogs(JSON.parse(savedLogs));
      }
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      }
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('habitpulse_habits_v2', JSON.stringify(habits));
      localStorage.setItem('habitpulse_logs_v2', JSON.stringify(auditLogs));
      localStorage.setItem('habitpulse_profile_v2', JSON.stringify(userProfile));
    } catch {
      // ignore
    }
  }, [habits, auditLogs, userProfile, isLoaded]);

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...profile }));
  };

  const toggleCompletion = (habitId: string, dateToToggle?: string) => {
    const targetDate = dateToToggle || selectedDate;
    let habitName = '';
    let nowCompleted = false;

    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        habitName = h.name;
        const alreadyDone = h.completedDates.includes(targetDate);
        nowCompleted = !alreadyDone;
        const newDates = alreadyDone
          ? h.completedDates.filter((d) => d !== targetDate)
          : [...h.completedDates, targetDate];

        // Recalculate streak
        let newStreak = h.currentStreak;
        if (nowCompleted) {
          newStreak += 1;
        } else if (newStreak > 0) {
          newStreak -= 1;
        }
        const newBest = Math.max(h.bestStreak, newStreak);

        return {
          ...h,
          completedDates: newDates,
          currentStreak: newStreak,
          bestStreak: newBest,
        };
      })
    );

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

    setAuditLogs((prev) => [newLog, ...prev.slice(0, 24)]);
  };

  const addHabit = (data: {
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

    setHabits((prev) => [newHabit, ...prev]);

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

    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const updateHabit = (habitId: string, updates: Partial<Habit>) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, ...updates } : h))
    );
  };

  const deleteHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  };

  const resetData = () => {
    setHabits([]);
    setAuditLogs([]);
    try {
      localStorage.removeItem('habitpulse_habits_v2');
      localStorage.removeItem('habitpulse_logs_v2');
      localStorage.removeItem('habitpulse_habits');
      localStorage.removeItem('habitpulse_logs');
    } catch {
      // ignore
    }
  };

  // Real Metrics Calculations
  const activeHabits = habits.filter((h) => !h.archived);
  const todayTotalCount = activeHabits.length;
  const todayCompletedCount = activeHabits.filter((h) =>
    h.completedDates.includes(selectedDate)
  ).length;

  const todayPercentage =
    todayTotalCount > 0 ? Math.round((todayCompletedCount / todayTotalCount) * 100) : 0;

  // Real active streak: max streak among user's active habits
  const activeStreak =
    activeHabits.length > 0 ? Math.max(...activeHabits.map((h) => h.currentStreak)) : 0;

  // Compute 7-day current week metrics (Mon to Sun)
  const curr = new Date();
  const dayOfWeek = curr.getDay();
  const diffToMonday = curr.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(curr.setDate(diffToMonday));

  const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const currentWeekMetrics: DayMetric[] = [];
  let totalCompletionsThisWeek = 0;
  let totalPossibleThisWeek = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = formatDate(d);

    const completed = activeHabits.filter((h) => h.completedDates.includes(dateStr)).length;
    const pct = todayTotalCount > 0 ? Math.round((completed / todayTotalCount) * 100) : 0;

    // Only count past/today days for weekly score calculation
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
