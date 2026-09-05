'use client';

import React, { useState } from 'react';
import { useHabitStore } from '@/lib/habitStore';
import { Category } from '@/lib/types';
import { formatDate } from '@/lib/seedData';

export default function HabitsPage() {
  const {
    habits,
    toggleCompletion,
    deleteHabit,
    setIsNewHabitModalOpen,
    todayCompletedCount,
    todayTotalCount,
    activeStreak,
    weeklyScore,
  } = useHabitStore();

  const [viewMode, setViewMode] = useState<'matrix' | 'daily'>('matrix');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Compute current week dates (Mon to Sun)
  const getWeekDates = () => {
    const curr = new Date();
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday
    const monday = new Date(curr.setDate(diff));
    const week = [];
    for (let i = 0; i < 7; i++) {
      const next = new Date(monday);
      next.setDate(monday.getDate() + i);
      week.push(formatDate(next));
    }
    return week;
  };

  const weekDates = getWeekDates();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const categories = ['All', 'Health', 'Mind & Focus', 'Productivity', 'Fitness'];

  const filteredHabits = habits.filter((h) => {
    const matchesSearch = h.name.toLowerCase().includes(search.toLowerCase()) ||
      (h.notes && h.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || h.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col w-full gap-space-xl">
      {/* Top Level Header & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-code-xs text-code-xs tracking-wider uppercase mb-space-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            System Directory • Routine Index
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-semibold">
            Habit Architecture
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Design, calibrate, and execute daily behavioral commitments with zero friction.
          </p>
        </div>

        <div className="flex items-center gap-space-sm flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-space-xs bg-surface-container-low px-space-xs py-1 rounded-xl shadow-xs border border-outline-variant/30">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-space-sm py-1.5 rounded-lg font-label-md text-label-md transition-all flex items-center gap-space-2xs cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-surface-container-highest text-primary font-semibold shadow-xs'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">view_list</span>
              <span>Matrix Inventory</span>
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`px-space-sm py-1.5 rounded-lg font-label-md text-label-md transition-all flex items-center gap-space-2xs cursor-pointer ${
                viewMode === 'daily'
                  ? 'bg-surface-container-highest text-primary font-semibold shadow-xs'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">task_alt</span>
              <span>Daily Execution</span>
            </button>
          </div>

          {/* Create Habit Button */}
          <button
            onClick={() => setIsNewHabitModalOpen(true)}
            className="h-10 px-space-lg rounded-xl bg-primary-container text-surface hover:bg-primary font-label-md text-label-md flex items-center gap-space-xs shadow-md transition-all cursor-pointer font-semibold"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Create Habit</span>
          </button>
        </div>
      </div>

      {/* Metric Strip / High-Level Vitality */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
        <div className="bg-surface-container-lowest border border-outline-variant/40 p-space-md rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <span className="font-code-xs text-code-xs text-on-surface-variant uppercase tracking-wider block mb-1">
              Total Protocols
            </span>
            <span className="font-headline-md text-headline-md text-primary font-bold">
              {habits.length}
            </span>
            <span className="font-body-sm text-body-sm text-secondary block mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>{' '}
              {habits.filter((h) => !h.archived).length} active routines
            </span>
          </div>
          <div className="w-11 h-11 rounded-lg bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]">format_list_bulleted</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/40 p-space-md rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <span className="font-code-xs text-code-xs text-on-surface-variant uppercase tracking-wider block mb-1">
              Consistency Yield
            </span>
            <span className="font-headline-md text-headline-md text-primary font-bold">
              {weeklyScore}%
            </span>
            <span className="font-body-sm text-body-sm text-secondary block mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>{' '}
              {todayTotalCount === 0 ? 'No active routines' : 'Calculated for current week'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-lg bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]">auto_graph</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/40 p-space-md rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <span className="font-code-xs text-code-xs text-on-surface-variant uppercase tracking-wider block mb-1">
              Completion Velocity
            </span>
            <span className="font-headline-md text-headline-md text-primary font-bold">
              {todayCompletedCount} / {todayTotalCount}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant block mt-1">
              {todayTotalCount === 0 ? 'Ready to begin' : 'Today\'s verified log'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-lg bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]">bolt</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/40 p-space-md rounded-xl shadow-xs flex items-center justify-between">
          <div>
            <span className="font-code-xs text-code-xs text-on-surface-variant uppercase tracking-wider block mb-1">
              Active Streaks
            </span>
            <span className="font-headline-md text-headline-md text-primary font-bold">
              {activeStreak}D
            </span>
            <span className="font-body-sm text-body-sm text-on-tertiary-container block mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">local_fire_department</span>{' '}
              {activeStreak >= 21 ? 'Master Tier' : activeStreak >= 7 ? 'Solid Pace' : 'Building Momentum'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 p-space-sm rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-space-sm">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-space-sm py-1 rounded-lg font-label-md text-label-md transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-primary-container text-surface font-semibold shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
              type="button"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-2 text-[18px] text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Filter habits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-sm text-body-sm focus:outline-none focus:border-primary-container"
          />
        </div>
      </div>

      {/* MATRIX INVENTORY VIEW */}
      {viewMode === 'matrix' && (
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-container bg-surface-container-low/50 text-on-surface-variant font-code-xs text-code-xs uppercase tracking-wider">
                  <th className="p-space-md font-semibold">Routine / Discipline</th>
                  <th className="p-space-md font-semibold">Cadence</th>
                  <th className="p-space-md text-center">
                    <div className="flex justify-center gap-2">
                      {dayNames.map((d, i) => (
                        <span key={d} className="w-7 text-center">
                          {d}
                        </span>
                      ))}
                    </div>
                  </th>
                  <th className="p-space-md font-semibold text-center">Streak</th>
                  <th className="p-space-md font-semibold">Priority</th>
                  <th className="p-space-md text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {filteredHabits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <span className="material-symbols-outlined text-[32px] text-on-surface-variant">
                          format_list_bulleted
                        </span>
                        <div className="flex flex-col gap-1">
                          <p className="font-headline-sm text-headline-sm text-primary font-semibold">
                            No habits in this view
                          </p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            Click &ldquo;Create Habit&rdquo; to establish your first routine.
                          </p>
                        </div>
                        <button
                          onClick={() => setIsNewHabitModalOpen(true)}
                          className="mt-1 px-space-md py-1.5 rounded-lg bg-primary-container text-surface font-label-md text-label-md font-semibold cursor-pointer"
                          type="button"
                        >
                          + Create Habit
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredHabits.map((habit) => (
                    <tr
                        key={habit.id}
                        className="hover:bg-surface-container-low/40 transition-colors group"
                      >
                        {/* Name & Category */}
                        <td className="p-space-md">
                        <div className="flex flex-col">
                          <span className="font-body-md text-body-md font-semibold text-primary">
                            {habit.name}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                            <span className="font-code-xs text-code-xs text-on-surface-variant">
                              {habit.category} • Target {habit.targetWeekly}x/wk
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cadence */}
                      <td className="p-space-md">
                        <span className="font-code-xs text-code-xs bg-surface-container px-space-xs py-1 rounded text-on-surface">
                          {habit.cadence}
                        </span>
                      </td>

                      {/* Mon - Sun Interactive Grid Checkboxes */}
                      <td className="p-space-md">
                        <div className="flex justify-center gap-2">
                          {weekDates.map((dateStr, idx) => {
                            const isDone = habit.completedDates.includes(dateStr);
                            return (
                              <button
                                key={dateStr}
                                onClick={() => toggleCompletion(habit.id, dateStr)}
                                title={`${dayNames[idx]}: ${isDone ? 'Completed' : 'Pending'}`}
                                className={`w-7 h-7 rounded-md flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                                  isDone
                                    ? 'bg-secondary text-surface shadow-xs'
                                    : 'bg-surface-container-high/60 hover:bg-secondary/20 text-transparent hover:text-secondary'
                                }`}
                              >
                                <span className="material-symbols-outlined text-[14px]">
                                  check
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Streak */}
                      <td className="p-space-md text-center">
                        <div className="inline-flex items-center gap-1 bg-tertiary-fixed/60 text-on-tertiary-fixed px-2 py-0.5 rounded font-code-xs text-code-xs font-semibold">
                          <span
                            className="material-symbols-outlined text-[13px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            local_fire_department
                          </span>
                          {habit.currentStreak}D
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="p-space-md">
                        <span
                          className={`font-code-xs text-code-xs px-2 py-0.5 rounded font-medium ${
                            habit.priority === 'High'
                              ? 'bg-error-container text-on-error-container'
                              : habit.priority === 'Medium'
                              ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {habit.priority}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-space-md text-right">
                        <button
                          onClick={() => deleteHabit(habit.id)}
                          className="p-1 text-outline hover:text-error rounded hover:bg-surface-container transition-colors cursor-pointer opacity-40 group-hover:opacity-100"
                          title="Archive/Remove habit"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DAILY EXECUTION VIEW */}
      {viewMode === 'daily' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {filteredHabits.length === 0 ? (
            <div className="col-span-full p-12 text-center rounded-xl bg-surface-container-lowest border border-dashed border-outline-variant/60 flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined text-[32px] text-on-surface-variant">
                task_alt
              </span>
              <p className="font-headline-sm text-headline-sm text-primary font-semibold">
                No daily routines found
              </p>
              <button
                onClick={() => setIsNewHabitModalOpen(true)}
                className="mt-1 px-space-md py-1.5 rounded-lg bg-primary-container text-surface font-label-md text-label-md font-semibold cursor-pointer"
                type="button"
              >
                + Create Habit
              </button>
            </div>
          ) : (
            filteredHabits.map((habit) => {
              const isDoneToday = habit.completedDates.includes(formatDate(new Date()));
            return (
              <div
                key={habit.id}
                className="p-space-lg rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs flex flex-col justify-between gap-space-md hover:border-primary-container/40 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-code-xs text-code-xs text-on-surface-variant uppercase tracking-wider">
                      {habit.category} • {habit.cadence}
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-semibold mt-1">
                      {habit.name}
                    </h3>
                    {habit.notes && (
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        {habit.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 bg-tertiary-fixed/60 text-on-tertiary-fixed px-2 py-0.5 rounded font-code-xs text-code-xs font-semibold">
                    <span
                      className="material-symbols-outlined text-[14px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      local_fire_department
                    </span>
                    {habit.currentStreak}D
                  </div>
                </div>

                <div className="flex items-center justify-between pt-space-sm border-t border-surface-container">
                  <span className="font-code-xs text-code-xs text-outline">
                    Anchor: {habit.scheduledTime || 'Flexible'}
                  </span>
                  <button
                    onClick={() => toggleCompletion(habit.id)}
                    className={`px-space-md py-1.5 rounded-lg font-label-sm text-label-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                      isDoneToday
                        ? 'bg-secondary text-surface font-semibold shadow-xs'
                        : 'bg-primary-container text-surface hover:bg-primary font-medium shadow-xs'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isDoneToday ? 'check_circle' : 'check'}
                    </span>
                    <span>{isDoneToday ? 'Verified Today' : 'Mark Complete'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      )}
    </div>
  );
}
