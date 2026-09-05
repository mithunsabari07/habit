'use client';

import React, { useState } from 'react';
import { useHabitStore } from '@/lib/habitStore';
import { formatDate } from '@/lib/seedData';

export default function CalendarPage() {
  const {
    habits,
    toggleCompletion,
    selectedDate,
    setSelectedDate,
    todayStr,
    setIsNewHabitModalOpen,
  } = useHabitStore();

  // Current view month & year state (real current date)
  const now = new Date();
  const [currentYear, setCurrentYear] = useState<number>(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(now.getMonth()); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleJumpToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(todayStr);
  };

  // Build calendar matrix (35 or 42 cells)
  const buildCalendarDays = () => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    // Adjust so Monday is index 0
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr, isCurrentMonth: true });
    }

    // Next month padding to fill out 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dayNumber: d, dateStr, isCurrentMonth: false });
    }

    return days;
  };

  const calendarDays = buildCalendarDays();
  const activeHabits = habits.filter((h) => !h.archived);

  // Inspector details for selectedDate
  const dayHabitsCompleted = activeHabits.filter((h) =>
    h.completedDates.includes(selectedDate)
  );
  const dayHabitsPending = activeHabits.filter(
    (h) => !h.completedDates.includes(selectedDate)
  );

  const dayTotal = activeHabits.length;
  const dayScore = dayTotal > 0 ? Math.round((dayHabitsCompleted.length / dayTotal) * 100) : 0;

  // Helper to get day completion color tier
  const getDayTier = (dateStr: string) => {
    if (dayTotal === 0) return 'none';
    const done = activeHabits.filter((h) => h.completedDates.includes(dateStr)).length;
    if (done === 0) return 'none';
    const pct = Math.round((done / dayTotal) * 100);
    if (pct >= 100) return 'tier-100';
    if (pct >= 80) return 'tier-80';
    if (pct >= 50) return 'tier-50';
    return 'tier-low';
  };

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex flex-col w-full gap-space-lg">
      {/* View Controls & Month Ribbon */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md bg-surface-container-lowest border border-outline-variant/40 p-space-lg rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center gap-space-md">
          <div className="flex items-center gap-space-xs bg-surface-container px-space-xs py-1 rounded-lg">
            <button
              onClick={handlePrevMonth}
              className="w-8 h-8 flex items-center justify-center rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              title="Previous Month"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <span className="font-headline-sm text-headline-sm text-primary px-space-sm select-none font-semibold min-w-36 text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="w-8 h-8 flex items-center justify-center rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              title="Next Month"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>

          <button
            onClick={handleJumpToday}
            className="h-9 px-space-md rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-all flex items-center gap-space-2xs cursor-pointer font-semibold"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>Today</span>
          </button>
        </div>

        {/* Calendar Legend Pill Bar */}
        <div className="flex flex-wrap items-center gap-space-sm">
          <div className="flex items-center gap-space-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container" />
            <span className="font-code-xs text-code-xs text-on-surface-variant font-medium">
              100% Core
            </span>
          </div>
          <div className="flex items-center gap-space-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
            <span className="font-code-xs text-code-xs text-on-surface-variant font-medium">
              80-99%
            </span>
          </div>
          <div className="flex items-center gap-space-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary-container" />
            <span className="font-code-xs text-code-xs text-on-surface-variant font-medium">
              50-79%
            </span>
          </div>
          <div className="flex items-center gap-space-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-surface-container-highest" />
            <span className="font-code-xs text-code-xs text-on-surface-variant font-medium">
              &lt;50%
            </span>
          </div>
          <div className="flex items-center gap-space-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-surface-variant opacity-60" />
            <span className="font-code-xs text-code-xs text-on-surface-variant font-medium">
              Rest / None
            </span>
          </div>
        </div>
      </div>

      {/* Main Workplane: Calendar Grid + Inspector Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
        {/* Left Calendar Matrix (8 Columns on desktop) */}
        <div className="xl:col-span-8 flex flex-col bg-surface-container-lowest border border-outline-variant/40 p-space-lg rounded-xl shadow-xs">
          {/* Weekday Header Row */}
          <div className="grid grid-cols-7 gap-space-xs mb-space-xs text-center">
            {dayNames.map((d, i) => (
              <span
                key={d}
                className={`font-code-xs text-code-xs uppercase py-space-xs font-semibold ${
                  i >= 5 ? 'text-on-tertiary-container' : 'text-on-surface-variant'
                }`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Responsive Grid */}
          <div className="grid grid-cols-7 gap-space-xs" id="calendar-grid">
            {calendarDays.map((item) => {
              const tier = getDayTier(item.dateStr);
              const isSelected = item.dateStr === selectedDate;
              const isToday = item.dateStr === todayStr;

              const doneCount = activeHabits.filter((h) =>
                h.completedDates.includes(item.dateStr)
              ).length;
              const pct = Math.round((doneCount / dayTotal) * 100);

              let badgeBg = 'bg-surface-container-low text-outline';
              if (tier === 'tier-100') badgeBg = 'bg-primary-container text-surface';
              else if (tier === 'tier-80') badgeBg = 'bg-secondary text-surface';
              else if (tier === 'tier-50') badgeBg = 'bg-secondary-container text-on-secondary-container';
              else if (tier === 'tier-low') badgeBg = 'bg-surface-container-highest text-primary';

              return (
                <div
                  key={item.dateStr}
                  onClick={() => setSelectedDate(item.dateStr)}
                  className={`min-h-[86px] p-space-xs rounded-xl flex flex-col justify-between transition-all cursor-pointer border ${
                    isSelected
                      ? 'ring-2 ring-primary-container border-primary-container bg-surface-container-low'
                      : 'border-outline-variant/30 hover:bg-surface-container-low/60'
                  } ${!item.isCurrentMonth ? 'opacity-40' : 'opacity-100'}`}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`font-code-sm text-code-sm ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-primary-container text-surface flex items-center justify-center font-bold'
                          : 'text-on-surface font-medium'
                      }`}
                    >
                      {item.dayNumber}
                    </span>
                    {doneCount > 0 && (
                      <span className={`px-1.5 py-0.5 rounded font-code-xs text-code-xs font-semibold ${badgeBg}`}>
                        {pct}%
                      </span>
                    )}
                  </div>

                  {/* Visual micro status indicators */}
                  <div className="flex items-center gap-1 mt-2">
                    {doneCount > 0 ? (
                      <div className="flex items-center gap-0.5 flex-wrap">
                        {Array.from({ length: Math.min(doneCount, 6) }).map((_, i) => (
                          <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              tier === 'tier-100'
                                ? 'bg-primary-container'
                                : 'bg-secondary'
                            }`}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-outline font-code-xs">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 4 Columns: Day Inspector Panel */}
        <div className="xl:col-span-4 flex flex-col bg-surface-container-lowest border border-outline-variant/40 p-space-lg rounded-xl shadow-xs gap-space-md">
          <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
            <div>
              <span className="font-code-xs text-code-xs text-on-surface-variant uppercase tracking-wider block">
                Cadence Inspector
              </span>
              <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">
                {selectedDate}
              </h3>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-headline-md text-headline-md font-bold text-secondary">
                {dayScore}%
              </span>
              <span className="font-code-xs text-code-xs text-on-surface-variant">
                {dayHabitsCompleted.length} / {dayTotal} Done
              </span>
            </div>
          </div>

          {/* Quick toggle list for the selected day */}
          <div className="flex flex-col gap-space-xs max-h-[500px] overflow-y-auto pr-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
              Routines for this day:
            </span>

            {activeHabits.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[28px] text-on-surface-variant">
                  event_available
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  No habits established yet.
                </p>
                <button
                  onClick={() => setIsNewHabitModalOpen(true)}
                  className="mt-1 px-space-md py-1.5 rounded-lg bg-primary-container text-surface font-label-sm text-label-sm font-semibold cursor-pointer"
                  type="button"
                >
                  + Create Habit
                </button>
              </div>
            ) : (
              activeHabits.map((habit) => {
                const isDone = habit.completedDates.includes(selectedDate);
                return (
                  <div
                    key={habit.id}
                    onClick={() => toggleCompletion(habit.id, selectedDate)}
                    className={`flex items-center justify-between p-space-sm rounded-lg border transition-all cursor-pointer ${
                      isDone
                        ? 'bg-surface-container-low border-outline-variant/40'
                        : 'bg-surface-container-lowest hover:bg-surface-container-low border-outline-variant/20'
                    }`}
                  >
                    <div className="flex items-center gap-space-xs min-w-0">
                      <span
                        className={`w-5 h-5 rounded flex items-center justify-center text-[14px] material-symbols-outlined shrink-0 ${
                          isDone
                            ? 'bg-secondary text-surface'
                            : 'border border-outline-variant text-transparent'
                        }`}
                      >
                        check
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span
                          className={`font-body-sm text-body-sm truncate ${
                            isDone ? 'line-through text-on-surface-variant' : 'font-medium text-primary'
                          }`}
                        >
                          {habit.name}
                        </span>
                        <span className="font-code-xs text-code-xs text-outline">
                          {habit.category} • {habit.scheduledTime || habit.cadence}
                        </span>
                      </div>
                    </div>

                    <span className="font-code-xs text-code-xs text-on-surface-variant shrink-0">
                      {habit.currentStreak}D
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-space-xs border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
            <span>Clicking any routine toggles its completion for {selectedDate}.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
