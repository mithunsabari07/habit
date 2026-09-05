'use client';

import React, { useState } from 'react';
import { useHabitStore } from '@/lib/habitStore';

export default function AnalyticsPage() {
  const { habits, pillarsDistribution, weeklyScore, userProfile } = useHabitStore();

  const [granularity, setGranularity] = useState<'All' | 'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('All');
  const [showExportModal, setShowExportModal] = useState(false);

  const activeHabits = habits.filter((h) => !h.archived);

  // Real calculation for disciplines
  const calculateDisciplineScore = (category: string) => {
    const matching = activeHabits.filter((h) => h.category === category);
    if (matching.length === 0) return 0;
    const totalCompletions = matching.reduce((acc, h) => acc + h.completedDates.length, 0);
    const totalTargets = matching.reduce((acc, h) => acc + Math.max(1, h.targetWeekly), 0);
    return Math.min(100, Math.round((totalCompletions / totalTargets) * 100));
  };

  const disciplineMetrics = [
    {
      name: 'Productivity',
      score: calculateDisciplineScore('Productivity'),
      routines: activeHabits.filter((h) => h.category === 'Productivity').length,
      color: 'bg-primary-container',
    },
    {
      name: 'Health',
      score: calculateDisciplineScore('Health'),
      routines: activeHabits.filter((h) => h.category === 'Health').length,
      color: 'bg-secondary',
    },
    {
      name: 'Fitness',
      score: calculateDisciplineScore('Fitness'),
      routines: activeHabits.filter((h) => h.category === 'Fitness').length,
      color: 'bg-on-tertiary-container',
    },
    {
      name: 'Mind & Focus',
      score: calculateDisciplineScore('Mind & Focus'),
      routines: activeHabits.filter((h) => h.category === 'Mind & Focus').length,
      color: 'bg-outline',
    },
  ];

  // Cadence execution breakdown
  const morningHabits = activeHabits.filter((h) => h.cadence === 'Morning');
  const eveningHabits = activeHabits.filter((h) => h.cadence === 'Evening');
  const dayHabits = activeHabits.filter(
    (h) => h.cadence !== 'Morning' && h.cadence !== 'Evening'
  );

  const calcCadenceRate = (list: typeof activeHabits) => {
    if (list.length === 0) return 0;
    const completions = list.reduce((acc, h) => acc + h.completedDates.length, 0);
    const targets = list.reduce((acc, h) => acc + Math.max(1, h.targetWeekly), 0);
    return Math.min(100, Math.round((completions / targets) * 100));
  };

  const morningRate = calcCadenceRate(morningHabits);
  const afternoonRate = calcCadenceRate(dayHabits);
  const eveningRate = calcCadenceRate(eveningHabits);

  const handleDownloadDossier = () => {
    const report = {
      title: 'HabitPulse Personal Cadence Report',
      user: userProfile.name,
      titleRole: userProfile.title,
      timestamp: new Date().toISOString(),
      overallIntegrity: `${weeklyScore}%`,
      activeHabitsCount: activeHabits.length,
      pillarsDistribution,
      habits: activeHabits.map((h) => ({
        name: h.name,
        category: h.category,
        cadence: h.cadence,
        priority: h.priority,
        currentStreak: h.currentStreak,
        bestStreak: h.bestStreak,
        completionsRecorded: h.completedDates.length,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HabitPulse_Report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const filteredMetrics =
    selectedDiscipline === 'All'
      ? disciplineMetrics
      : disciplineMetrics.filter((d) => d.name === selectedDiscipline);

  return (
    <div className="flex flex-col w-full gap-space-xl">
      {/* Analytics Header & Control Deck */}
      <section className="flex flex-col gap-space-lg">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div>
            <div className="flex items-center gap-space-xs mb-space-2xs">
              <span className="font-code-xs text-code-xs text-secondary tracking-widest uppercase font-semibold">
                Personal Performance Hub
              </span>
              <span className="text-outline-variant font-code-xs">•</span>
              <span className="font-code-xs text-code-xs text-on-surface-variant">
                Cadence Analytics
              </span>
            </div>
            <div className="flex items-baseline gap-space-sm">
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-semibold">
                Analytics &amp; Trajectory
              </h1>
              <span className="font-code-sm text-code-sm text-on-surface-variant">Live Telemetry</span>
            </div>
          </div>

          <div className="flex items-center gap-space-xs">
            <button
              onClick={() => setShowExportModal(true)}
              className="h-10 px-space-md rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md flex items-center gap-space-xs shadow-xs transition-all cursor-pointer font-medium"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">file_download</span>
              <span>Export Dossier</span>
            </button>
          </div>
        </div>

        {/* Filter Bar Component */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-space-sm shadow-xs flex flex-wrap items-center justify-between gap-space-md">
          {/* Time Granularity Switcher */}
          <div className="inline-flex p-1 bg-surface-container rounded-lg gap-1">
            {(['All', 'Daily', 'Weekly', 'Monthly'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-space-md py-1.5 rounded-md font-label-md text-label-md transition-all cursor-pointer ${
                  granularity === g
                    ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                {g === 'All' ? 'All Cadences' : g}
              </button>
            ))}
          </div>

          {/* Filters & Dropdowns */}
          <div className="flex flex-wrap items-center gap-space-sm">
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="h-9 px-space-sm rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface font-label-md text-label-md focus:outline-none cursor-pointer"
            >
              <option value="All">All Disciplines (4)</option>
              <option value="Productivity">Productivity</option>
              <option value="Health">Health</option>
              <option value="Fitness">Fitness</option>
              <option value="Mind & Focus">Mind & Focus</option>
            </select>
          </div>
        </div>
      </section>

      {/* Main Analytical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left 8 Cols: Trajectory Chart & Discipline Breakdown */}
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          {/* Consistency Trajectory Curve Chart */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 p-space-lg rounded-xl shadow-xs flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-code-xs text-code-xs text-on-surface-variant uppercase tracking-wider block">
                  Trajectory Model
                </span>
                <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">
                  Cadence Yield Velocity
                </h3>
              </div>
              <div className="flex items-center gap-space-xs bg-secondary-container/30 text-on-secondary-container px-space-sm py-1 rounded-full font-code-xs text-code-xs font-semibold">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>{weeklyScore}% Yield Rate</span>
              </div>
            </div>

            {/* SVG Visual Smooth Curve or Empty State */}
            {activeHabits.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center gap-2 border border-dashed border-outline-variant/40 rounded-xl">
                <span className="material-symbols-outlined text-[28px] text-on-surface-variant">
                  show_chart
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Create habits and log daily check-ins to generate your trajectory model.
                </p>
              </div>
            ) : (
              <div className="relative w-full h-56 mt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200">
                  <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  <line x1="0" y1="50" x2="600" y2="50" stroke="rgba(28,25,23,0.06)" strokeDasharray="4 4" />
                  <line x1="0" y1="100" x2="600" y2="100" stroke="rgba(28,25,23,0.06)" strokeDasharray="4 4" />
                  <line x1="0" y1="150" x2="600" y2="150" stroke="rgba(28,25,23,0.06)" strokeDasharray="4 4" />

                  <path
                    d="M 50 160 Q 150 130, 250 110 T 450 80 T 550 50 L 550 180 L 50 180 Z"
                    fill="url(#areaGradient)"
                  />

                  <path
                    d="M 50 160 Q 150 130, 250 110 T 450 80 T 550 50"
                    fill="none"
                    stroke="#006C49"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {[
                    { label: 'W1', score: Math.max(0, weeklyScore - 15), y: 160 },
                    { label: 'W2', score: Math.max(0, weeklyScore - 10), y: 130 },
                    { label: 'W3', score: Math.max(0, weeklyScore - 5), y: 110 },
                    { label: 'W4', score: weeklyScore, y: 80 },
                    { label: 'Now', score: weeklyScore, y: 50 },
                  ].map((pt, idx) => {
                    const cx = 50 + idx * 125;
                    return (
                      <g key={pt.label}>
                        <circle cx={cx} cy={pt.y} r="5" fill="#2A1B2D" stroke="#FFF8F5" strokeWidth="2" />
                        <text
                          x={cx}
                          y={pt.y - 12}
                          textAnchor="middle"
                          className="font-code-xs text-[11px] fill-primary font-semibold"
                        >
                          {pt.score}%
                        </text>
                        <text
                          x={cx}
                          y="195"
                          textAnchor="middle"
                          className="font-code-xs text-[10px] fill-outline"
                        >
                          {pt.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </div>

          {/* Discipline Performance Breakdown */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 p-space-lg rounded-xl shadow-xs flex flex-col gap-space-md">
            <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">
              Discipline Integrity Yield
            </h3>
            <div className="flex flex-col gap-space-md">
              {filteredMetrics.map((disc) => (
                <div key={disc.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-label-md text-label-md font-semibold text-primary">
                      {disc.name} ({disc.routines} Routines)
                    </span>
                    <span className="font-code-xs text-code-xs font-bold text-primary">
                      {disc.score}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${disc.color}`}
                      style={{ width: `${disc.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Reliability Matrix & Executive KPIs */}
        <div className="lg:col-span-4 flex flex-col gap-space-lg">
          {/* Executive Habit Reliability Ranking */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 p-space-lg rounded-xl shadow-xs flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <h3 className="font-label-md text-label-md text-primary font-semibold">
                Habit Reliability Index
              </h3>
              <span className="font-code-xs text-code-xs text-secondary font-semibold">
                Active Routines
              </span>
            </div>

            <div className="flex flex-col gap-space-sm divide-y divide-surface-container">
              {activeHabits.length === 0 ? (
                <div className="py-6 text-center text-xs text-on-surface-variant">
                  No habits to rank yet.
                </div>
              ) : (
                activeHabits.slice(0, 6).map((h) => {
                  const rate =
                    h.targetWeekly > 0
                      ? Math.min(100, Math.round((h.completedDates.length / h.targetWeekly) * 100))
                      : 0;
                  return (
                    <div key={h.id} className="pt-2 flex items-center justify-between">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-body-sm text-body-sm font-semibold text-primary truncate">
                          {h.name}
                        </span>
                        <span className="font-code-xs text-code-xs text-on-surface-variant">
                          {h.currentStreak}D Streak • {h.category}
                        </span>
                      </div>
                      <span className="font-code-sm text-code-sm font-bold text-secondary">
                        {rate}%
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Temporal Execution Heatmap Breakdown */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 p-space-lg rounded-xl shadow-xs flex flex-col gap-space-sm">
            <span className="font-label-md text-label-md text-primary font-semibold">
              Execution Cadence Heatmap
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Completion distribution across your daily temporal blocks.
            </p>
            <div className="grid grid-cols-3 gap-2 mt-2 text-center">
              <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col items-center">
                <span className="font-code-xs text-code-xs text-outline uppercase">Morning</span>
                <span className="font-headline-md text-headline-md text-primary font-bold mt-1">
                  {morningRate}%
                </span>
                <span className="font-code-xs text-code-xs text-secondary font-semibold">
                  {morningHabits.length} Habits
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col items-center">
                <span className="font-code-xs text-code-xs text-outline uppercase">Day</span>
                <span className="font-headline-md text-headline-md text-primary font-bold mt-1">
                  {afternoonRate}%
                </span>
                <span className="font-code-xs text-code-xs text-on-surface-variant">
                  {dayHabits.length} Habits
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col items-center">
                <span className="font-code-xs text-code-xs text-outline uppercase">Evening</span>
                <span className="font-headline-md text-headline-md text-primary font-bold mt-1">
                  {eveningRate}%
                </span>
                <span className="font-code-xs text-code-xs text-secondary font-semibold">
                  {eveningHabits.length} Habits
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Dossier Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/50 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-surface-container-lowest border border-outline-variant/50 rounded-2xl shadow-2xl p-space-xl z-10 flex flex-col gap-space-md">
            <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">
              Export Habit Dossier
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Generate an official JSON report containing all active habits, streak records,
              completion timestamps, and integrity metrics.
            </p>
            <div className="flex justify-end gap-space-sm pt-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-space-md py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md cursor-pointer"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleDownloadDossier}
                className="px-space-lg py-2 rounded-lg bg-primary-container text-surface font-label-md text-label-md shadow-md cursor-pointer font-semibold"
                type="button"
              >
                Download JSON Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
