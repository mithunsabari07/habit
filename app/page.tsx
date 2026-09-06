'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useHabitStore } from '@/lib/habitStore';

export default function DashboardPage() {
  const {
    habits,
    auditLogs,
    selectedDate,
    toggleCompletion,
    todayCompletedCount,
    todayTotalCount,
    todayPercentage,
    activeStreak,
    weeklyScore,
    pillarsDistribution,
    currentWeekMetrics,
    userProfile,
    setIsNewHabitModalOpen,
  } = useHabitStore();

  const [cadenceFilter, setCadenceFilter] = useState<'All' | 'Morning' | 'Evening'>('All');
  const [sortOrder, setSortOrder] = useState<'default' | 'priority' | 'streak'>('default');

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const greeting = userProfile.name
    ? `${getGreeting()}, ${userProfile.name}.`
    : `${getGreeting()}.`;

  // Format today's date
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Filter habits for checklist
  let filteredHabits = habits.filter((h) => !h.archived);
  if (cadenceFilter !== 'All') {
    filteredHabits = filteredHabits.filter((h) => {
      if (cadenceFilter === 'Morning') return h.cadence === 'Morning';
      if (cadenceFilter === 'Evening') return h.cadence === 'Evening';
      return true;
    });
  }

  // Sort habits
  if (sortOrder === 'priority') {
    const priorityWeight = { High: 3, Medium: 2, Normal: 1 };
    filteredHabits.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
  } else if (sortOrder === 'streak') {
    filteredHabits.sort((a, b) => b.currentStreak - a.currentStreak);
  }

  const remainingCount = Math.max(0, todayTotalCount - todayCompletedCount);
  const bestStreakOverall = habits.length > 0 ? Math.max(...habits.map((h) => h.bestStreak)) : 0;
  const archivedCount = habits.filter((h) => h.archived).length;

  // Dynamic stroke dash for radial progress meter
  const strokeDash = `${todayPercentage}, 100`;

  const handleExportCSV = () => {
    const headers = 'Habit Name,Category,Cadence,Priority,Current Streak,Best Streak,Completed Dates Count\n';
    const rows = habits
      .map(
        (h) =>
          `"${h.name}","${h.category}","${h.cadence}","${h.priority}",${h.currentStreak},${h.bestStreak},${(h.completedDates || []).length}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habitpulse_audit_${selectedDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="flex flex-col w-full gap-space-xl">
      {/* Top Greeting & Control Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div className="flex flex-col gap-space-2xs">
          <div className="flex items-center gap-space-xs text-on-surface-variant">
            <span className="font-code-xs text-code-xs tracking-wider uppercase text-primary-container font-semibold">
              Cockpit Overview
            </span>
            <span className="text-outline-variant">•</span>
            <span className="font-label-sm text-label-sm">{todayFormatted}</span>
          </div>
          <h1 className="font-display-lg text-display-lg text-primary tracking-tight">
            {greeting}
            <br />
            <span className="text-on-surface-variant font-headline-md text-headline-md font-normal">
              {todayTotalCount === 0
                ? 'Your habit journey starts today.'
                : "Let's build consistency."}
            </span>
          </h1>
        </div>

        {/* Quick Status Pill & Cadence Switcher */}
        <div className="flex flex-wrap items-center gap-space-xs">
          <div className="flex items-center bg-surface-container-high rounded p-1">
            <button
              onClick={() => setCadenceFilter('All')}
              className={`px-space-sm py-1 rounded font-label-sm text-label-sm transition-all cursor-pointer ${
                cadenceFilter === 'All'
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
              type="button"
            >
              All Cadences
            </button>
            <button
              onClick={() => setCadenceFilter('Morning')}
              className={`px-space-sm py-1 rounded font-label-sm text-label-sm transition-all cursor-pointer ${
                cadenceFilter === 'Morning'
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
              type="button"
            >
              Morning
            </button>
            <button
              onClick={() => setCadenceFilter('Evening')}
              className={`px-space-sm py-1 rounded font-label-sm text-label-sm transition-all cursor-pointer ${
                cadenceFilter === 'Evening'
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
              type="button"
            >
              Evening
            </button>
          </div>

          <button
            onClick={() =>
              setSortOrder((prev) =>
                prev === 'default' ? 'priority' : prev === 'priority' ? 'streak' : 'default'
              )
            }
            className="h-9 px-space-sm rounded bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center gap-space-2xs text-label-sm font-label-sm shadow-xs border border-outline-variant/30 transition-all cursor-pointer"
            type="button"
            title="Toggle sort order"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">tune</span>
            <span>
              Sort: {sortOrder === 'default' ? 'Default' : sortOrder === 'priority' ? 'Priority' : 'Streak'}
            </span>
          </button>
        </div>
      </section>

      {/* KPI Overview 4-Card Module */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {/* Card 1: Daily Completion with Radial SVG */}
        <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-code-xs text-code-xs text-on-surface-variant uppercase tracking-wider">
                Today&apos;s Progress
              </span>
              <span className="font-headline-lg text-headline-lg text-primary mt-space-2xs font-semibold">
                {todayCompletedCount}{' '}
                <span className="text-outline text-headline-sm font-normal">/ {todayTotalCount}</span>
              </span>
            </div>
            {/* Micro Radial Meter */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-surface-container"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                />
                <path
                  className="text-secondary transition-all duration-700 ease-out"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={strokeDash}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                />
              </svg>
              <span className="absolute font-code-xs text-code-xs font-semibold text-secondary">
                {todayPercentage}%
              </span>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm bg-surface-container-low px-space-xs py-1 rounded">
            <span>{remainingCount} remaining</span>
            <span className="text-secondary font-semibold">
              {todayTotalCount === 0 ? 'No habits yet' : `${todayPercentage}% achieved`}
            </span>
          </div>
        </div>

        {/* Card 2: Current Streak */}
        <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs flex flex-col justify-between relative">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-code-xs text-code-xs text-on-surface-variant uppercase tracking-wider">
                Active Streak
              </span>
              <div className="flex items-baseline gap-space-2xs mt-space-2xs">
                <span className="font-headline-lg text-headline-lg text-primary font-semibold">
                  {activeStreak}
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant">Days</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shadow-xs">
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: activeStreak > 0 ? "'FILL' 1" : "'FILL' 0" }}
              >
                local_fire_department
              </span>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm bg-surface-container-low px-space-xs py-1 rounded">
            <span className="text-on-surface-variant">
              Best:{' '}
              <span className="text-primary font-semibold">{bestStreakOverall} Days</span>
            </span>
            <span className="text-on-tertiary-container font-code-xs text-code-xs font-medium">
              {activeStreak >= 21 ? 'Master Tier' : activeStreak >= 7 ? 'Solid Pace' : 'Building Momentum'}
            </span>
          </div>
        </div>

        {/* Card 3: Total Active Habits */}
        <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs flex flex-col justify-between relative">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-code-xs text-code-xs text-on-surface-variant uppercase tracking-wider">
                Active Portfolio
              </span>
              <div className="flex items-baseline gap-space-2xs mt-space-2xs">
                <span className="font-headline-lg text-headline-lg text-primary font-semibold">
                  {todayTotalCount}
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant">Habits</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary-container shadow-xs">
              <span className="material-symbols-outlined text-[20px]">layers</span>
            </div>
          </div>
          <div className="mt-space-md pt-space-xs flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm bg-surface-container-low px-space-xs py-1 rounded">
            <span>{archivedCount} Archived</span>
            <span className="text-secondary font-code-xs text-code-xs font-semibold">
              {weeklyScore}% Weekly Score
            </span>
          </div>
        </div>

        {/* Card 4: Scheduled Breakdown */}
        <div className="p-space-lg rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs flex flex-col justify-between relative">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-code-xs text-code-xs text-on-surface-variant uppercase tracking-wider">
                Pillars Distribution
              </span>
              <span className="font-headline-md text-headline-md text-primary mt-space-2xs font-semibold">
                {todayTotalCount === 0 ? '0 Pillars' : 'Active Disciplines'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shadow-xs">
              <span className="material-symbols-outlined text-[20px]">pie_chart</span>
            </div>
          </div>
          <div className="mt-space-md flex gap-1 w-full h-2 rounded bg-surface-container overflow-hidden">
            {todayTotalCount === 0 ? (
              <div className="bg-surface-variant h-full w-full opacity-50" title="Empty" />
            ) : (
              <>
                {pillarsDistribution.productivity > 0 && (
                  <div
                    className="bg-primary-container h-full transition-all"
                    style={{ width: `${pillarsDistribution.productivity}%` }}
                    title={`Productivity: ${pillarsDistribution.productivity}%`}
                  />
                )}
                {pillarsDistribution.health > 0 && (
                  <div
                    className="bg-secondary h-full transition-all"
                    style={{ width: `${pillarsDistribution.health}%` }}
                    title={`Health: ${pillarsDistribution.health}%`}
                  />
                )}
                {pillarsDistribution.fitness > 0 && (
                  <div
                    className="bg-on-tertiary-container h-full transition-all"
                    style={{ width: `${pillarsDistribution.fitness}%` }}
                    title={`Fitness: ${pillarsDistribution.fitness}%`}
                  />
                )}
                {pillarsDistribution.mind > 0 && (
                  <div
                    className="bg-outline h-full transition-all"
                    style={{ width: `${pillarsDistribution.mind}%` }}
                    title={`Mind: ${pillarsDistribution.mind}%`}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Layout (Split 8-col / 4-col architecture) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
        {/* Left 8 Columns: Habit Execution Workspace */}
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          {/* Section Header */}
          <div className="flex items-center justify-between bg-surface-container-lowest border border-outline-variant/40 p-space-md rounded-xl shadow-xs">
            <div className="flex items-center gap-space-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
              <h2 className="font-headline-sm text-headline-sm text-primary font-semibold">
                Today&apos;s Protocol
              </h2>
              <span className="font-code-xs text-code-xs bg-surface-container px-space-xs py-space-2xs rounded text-on-surface-variant font-medium">
                {todayCompletedCount} of {todayTotalCount} Completed
              </span>
            </div>
            <div className="flex items-center gap-space-xs">
              <button
                onClick={() =>
                  setSortOrder((prev) => (prev === 'priority' ? 'default' : 'priority'))
                }
                className="text-on-surface-variant hover:text-primary p-1.5 rounded-lg hover:bg-surface-container transition-all cursor-pointer"
                title="Sort Order"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">swap_vert</span>
              </button>
              <button
                onClick={() => setIsNewHabitModalOpen(true)}
                className="text-on-surface-variant hover:text-primary p-1.5 rounded-lg hover:bg-surface-container transition-all cursor-pointer"
                title="Add Habit"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
          </div>

          {/* Habit Interactive Checklist or Empty State */}
          <div className="flex flex-col gap-space-xs" id="habit-checklist-container">
            {filteredHabits.length === 0 ? (
              <div className="p-space-xl rounded-xl bg-surface-container-lowest border border-dashed border-outline-variant/60 flex flex-col items-center justify-center text-center gap-space-sm py-12">
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[28px]">add_task</span>
                </div>
                <div className="flex flex-col gap-1 max-w-sm">
                  <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">
                    No habits configured yet
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Establish your daily habits to start tracking consistency, streaks, and weekly progress.
                  </p>
                </div>
                <button
                  onClick={() => setIsNewHabitModalOpen(true)}
                  className="mt-2 px-space-lg py-2 rounded-xl bg-primary-container hover:bg-primary text-surface font-label-md text-label-md font-semibold transition-all shadow-md cursor-pointer flex items-center gap-2"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>Create Your First Habit</span>
                </button>
              </div>
            ) : (
              filteredHabits.map((habit) => {
                const isCompleted = habit.completedDates.includes(selectedDate);

                return (
                  <div
                    key={habit.id}
                    className="group flex items-center justify-between p-space-md bg-surface-container-lowest hover:bg-surface-container-low transition-all duration-200 rounded-xl border border-outline-variant/30 shadow-xs"
                  >
                    <div className="flex items-center gap-space-md min-w-0 flex-1">
                      {/* Checkbox Button */}
                      <button
                        aria-label={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                        onClick={() => toggleCompletion(habit.id, selectedDate)}
                        type="button"
                        className={`w-6 h-6 rounded flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                          isCompleted
                            ? 'bg-primary-container text-surface shadow-xs'
                            : 'bg-surface-container hover:bg-secondary/20 text-transparent hover:text-secondary shadow-inner'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </button>

                      {/* Habit Info */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-space-xs flex-wrap">
                          <span
                            className={`font-body-md text-body-md truncate ${
                              isCompleted
                                ? 'text-on-surface-variant line-through font-medium'
                                : 'text-primary font-semibold'
                            }`}
                          >
                            {habit.name}
                          </span>

                          <span className="font-code-xs text-code-xs bg-surface-container px-space-xs py-0.5 rounded text-on-surface-variant">
                            {habit.category}
                          </span>

                          {habit.priority === 'High' && (
                            <span className="font-code-xs text-code-xs bg-error-container text-on-error-container px-space-xs py-0.5 rounded">
                              High Priority
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-space-xs text-on-surface-variant mt-1 text-xs">
                          <span className="font-code-xs text-code-xs">{habit.cadence}</span>
                          <span>•</span>
                          <span
                            className={`font-code-xs text-code-xs ${
                              isCompleted ? 'text-on-secondary-container font-medium' : 'text-outline'
                            }`}
                          >
                            {isCompleted
                              ? habit.notes || 'Completed'
                              : habit.scheduledTime
                              ? `Scheduled ${habit.scheduledTime}`
                              : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Streak & Action */}
                    <div className="flex items-center gap-space-sm pl-space-xs">
                      <div
                        className={`flex items-center gap-1 px-space-xs py-1 rounded ${
                          isCompleted
                            ? 'bg-tertiary-fixed/60 text-on-tertiary-fixed'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        <span
                          className="material-symbols-outlined text-[14px]"
                          style={{ fontVariationSettings: isCompleted ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          local_fire_department
                        </span>
                        <span className="font-code-xs text-code-xs font-semibold">
                          {habit.currentStreak}D
                        </span>
                      </div>

                      {!isCompleted ? (
                        <button
                          onClick={() => toggleCompletion(habit.id, selectedDate)}
                          className="px-space-sm py-1 rounded bg-primary-container text-surface hover:bg-primary font-label-sm text-label-sm shadow-xs transition-all cursor-pointer whitespace-nowrap"
                          type="button"
                        >
                          Quick Check
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleCompletion(habit.id, selectedDate)}
                          className="text-outline hover:text-primary p-1 rounded transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                          title="Undo"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">undo</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Inline Contextual Visual Card */}
          <div className="relative overflow-hidden rounded-xl bg-primary-container text-surface p-space-lg shadow-md flex flex-col md:flex-row items-center justify-between gap-space-md">
            <div className="flex flex-col gap-space-2xs z-10">
              <div className="flex items-center gap-space-xs text-secondary-container">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span className="font-code-xs text-code-xs tracking-wide uppercase font-semibold">
                  Progress Milestone
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md font-semibold">
                {todayTotalCount === 0
                  ? 'Habit Calibration Active'
                  : `${todayPercentage}% Consistency Rate`}
              </h3>
              <p className="font-body-sm text-body-sm text-on-primary-container max-w-md">
                {todayTotalCount === 0
                  ? 'Add your custom daily routines to calibrate your personal tracking engine.'
                  : `You have completed ${todayCompletedCount} of ${todayTotalCount} commitments for today. Keep pace through the rest of the day.`}
              </p>
            </div>
            <Link
              href="/analytics"
              className="z-10 whitespace-nowrap px-space-md py-2.5 rounded-lg bg-surface text-primary font-label-md text-label-md hover:bg-surface-container transition-all shadow-xs font-semibold"
            >
              View Analytics
            </Link>
            {/* Ambient Decorative SVG in background */}
            <svg
              className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8"
              fill="none"
              height="220"
              viewBox="0 0 200 200"
              width="220"
            >
              <circle
                cx="100"
                cy="100"
                r="80"
                stroke="currentColor"
                strokeDasharray="8 8"
                strokeWidth="20"
              />
              <circle cx="100" cy="100" r="50" stroke="currentColor" strokeWidth="12" />
            </svg>
          </div>
        </div>

        {/* Right 4 Columns: Analytical Insights & Execution Controls */}
        <div className="lg:col-span-4 flex flex-col gap-space-lg">
          {/* Weekly Heat Strip / Matrix (Real computed data) */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 p-space-md rounded-xl shadow-xs flex flex-col gap-space-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-primary font-semibold">
                Weekly Consistency
              </span>
              <span className="font-code-xs text-code-xs text-secondary font-medium">
                Current Week
              </span>
            </div>
            {/* 7-Day Precision Grid */}
            <div className="grid grid-cols-7 gap-space-2xs pt-space-xs text-center">
              {currentWeekMetrics.map((dayMetric) => {
                const isSelected = dayMetric.dateStr === selectedDate;
                const hasCompletions = dayMetric.completedHabits > 0;

                return (
                  <div key={dayMetric.dateStr} className="flex flex-col items-center gap-1">
                    <span
                      className={`font-code-xs text-code-xs ${
                        isSelected ? 'text-primary font-bold' : 'text-on-surface-variant'
                      }`}
                    >
                      {dayMetric.dayName}
                    </span>
                    <div
                      className={`w-8 h-8 rounded flex items-center justify-center font-code-xs text-code-xs shadow-xs relative ${
                        hasCompletions
                          ? dayMetric.percentage >= 80
                            ? 'bg-secondary text-surface'
                            : 'bg-surface-container-high text-primary font-bold'
                          : 'bg-surface-container-low text-outline'
                      }`}
                      title={`${dayMetric.dateStr}: ${dayMetric.percentage}% (${dayMetric.completedHabits}/${dayMetric.totalHabits})`}
                    >
                      {hasCompletions ? (
                        dayMetric.percentage === 100 ? (
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        ) : (
                          <span className="text-[10px] font-bold">{dayMetric.percentage}%</span>
                        )
                      ) : (
                        <span className="text-[10px]">—</span>
                      )}
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-secondary" />
                      )}
                    </div>
                    <span
                      className={`font-code-xs text-code-xs ${
                        isSelected ? 'text-primary font-semibold' : 'text-outline'
                      }`}
                    >
                      {dayMetric.percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 p-space-md rounded-xl shadow-xs flex flex-col gap-space-xs">
            <span className="font-label-md text-label-md text-primary font-semibold mb-space-2xs">
              System Controls
            </span>

            <button
              id="overview-new-habit-btn"
              onClick={() => setIsNewHabitModalOpen(true)}
              className="w-full flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-all text-on-surface cursor-pointer"
              type="button"
            >
              <div className="flex items-center gap-space-sm">
                <div className="w-7 h-7 rounded bg-primary-container text-surface flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </div>
                <span className="font-label-md text-label-md font-medium">New Habit</span>
              </div>
              <span className="font-code-xs text-code-xs text-on-surface-variant">+</span>
            </button>

            <Link
              href="/calendar"
              className="w-full flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-all text-on-surface cursor-pointer"
            >
              <div className="flex items-center gap-space-sm">
                <div className="w-7 h-7 rounded bg-surface-container-high text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                </div>
                <span className="font-label-md text-label-md font-medium">Cadence Calendar</span>
              </div>
              <span className="font-code-xs text-code-xs text-on-surface-variant">View</span>
            </Link>

            <Link
              href="/analytics"
              className="w-full flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-all text-on-surface cursor-pointer"
            >
              <div className="flex items-center gap-space-sm">
                <div className="w-7 h-7 rounded bg-surface-container-high text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">query_stats</span>
                </div>
                <span className="font-label-md text-label-md font-medium">Deep Analytics</span>
              </div>
              <span className="font-code-xs text-code-xs text-secondary font-semibold">
                {weeklyScore}%
              </span>
            </Link>

            <button
              onClick={handleExportCSV}
              className="w-full flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container transition-all text-on-surface cursor-pointer"
              type="button"
            >
              <div className="flex items-center gap-space-sm">
                <div className="w-7 h-7 rounded bg-surface-container-high text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">download</span>
                </div>
                <span className="font-label-md text-label-md font-medium">Export Log</span>
              </div>
              <span className="font-code-xs text-code-xs text-on-surface-variant">CSV</span>
            </button>
          </div>

          {/* Recent Audit & Activity Timeline */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 p-space-md rounded-xl shadow-xs flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-primary font-semibold">
                Audit Stream
              </span>
              <span className="font-code-xs text-code-xs text-on-surface-variant">Live</span>
            </div>
            <div className="flex flex-col gap-space-sm relative">
              {auditLogs.length === 0 ? (
                <div className="py-6 text-center text-xs text-on-surface-variant">
                  No activity logged yet. Your completions will record here.
                </div>
              ) : (
                <>
                  {/* Timeline Vertical Bar */}
                  <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-surface-container-high" />

                  {auditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-start gap-space-sm relative z-10">
                      <div className="w-6 h-6 rounded-full bg-secondary text-surface flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[12px]">check</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-sm text-label-sm text-primary font-medium truncate">
                          {log.habitName}
                        </span>
                        <span className="font-code-xs text-code-xs text-on-surface-variant">
                          {log.details || log.action} • {log.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
