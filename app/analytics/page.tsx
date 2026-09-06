'use client';

import React, { useState, useMemo } from 'react';
import { useHabitStore } from '@/lib/habitStore';
import { Habit, TrajectoryPoint } from '@/lib/types';
import { formatDate } from '@/lib/seedData';

function getSplinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export default function AnalyticsPage() {
  const { habits, pillarsDistribution, weeklyScore, userProfile, todayStr } = useHabitStore();

  const [granularity, setGranularity] = useState<'All' | 'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('All');
  const [showExportModal, setShowExportModal] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<TrajectoryPoint | null>(null);

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);

  // Filter habits according to discipline selector
  const relevantHabits = useMemo(() => {
    if (selectedDiscipline === 'All') return activeHabits;
    return activeHabits.filter((h) => h.category === selectedDiscipline);
  }, [activeHabits, selectedDiscipline]);

  // Trajectory Engine: Real data points calculated from actual completions
  const trajectoryPoints: TrajectoryPoint[] = useMemo(() => {
    const pts: TrajectoryPoint[] = [];
    const today = new Date(todayStr + 'T00:00:00');
    const targetHabits = relevantHabits;

    const SVG_WIDTH = 640;
    const PAD_LEFT = 55;
    const PAD_RIGHT = 35;
    const TOP_Y = 30;
    const BOT_Y = 175;
    const USABLE_WIDTH = SVG_WIDTH - PAD_LEFT - PAD_RIGHT;
    const USABLE_HEIGHT = BOT_Y - TOP_Y;

    if (granularity === 'Daily') {
      // Past 7 days (including today)
      const count = 7;
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateKey = formatDate(d);
        const dayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dayNum = d.getDate();
        const label = i === 0 ? 'Today' : `${dayShort} ${dayNum}`;

        const total = targetHabits.length;
        const completed = targetHabits.filter((h) =>
          (h.completedDates || []).includes(dateKey)
        ).length;
        const score = total > 0 ? Math.round((completed / total) * 100) : 0;

        pts.push({
          label,
          subLabel: dateKey,
          dateKey,
          score,
          completed,
          total,
          x: 0,
          y: 0,
        });
      }
    } else if (granularity === 'Weekly') {
      // Past 6 weeks (W-5, W-4, W-3, W-2, W-1, This Week)
      for (let w = 5; w >= 0; w--) {
        const startOfWeek = new Date(today);
        const dayOfWeek = today.getDay();
        const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) - w * 7;
        startOfWeek.setDate(diffToMonday);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        let weekCompletions = 0;
        let weekPossible = 0;
        const startStr = formatDate(startOfWeek);
        const endStr = formatDate(endOfWeek);

        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
          const dayD = new Date(startOfWeek);
          dayD.setDate(startOfWeek.getDate() + dayOffset);
          const dayKey = formatDate(dayD);

          if (dayKey <= todayStr) {
            const completedOnDay = targetHabits.filter((h) =>
              (h.completedDates || []).includes(dayKey)
            ).length;
            weekCompletions += completedOnDay;
            weekPossible += targetHabits.length;
          }
        }

        const score = weekPossible > 0 ? Math.round((weekCompletions / weekPossible) * 100) : 0;
        const label = w === 0 ? 'This Wk' : `W-${w}`;
        const subLabel = `${startStr.slice(5)} to ${endStr.slice(5)}`;

        pts.push({
          label,
          subLabel,
          dateKey: startStr,
          score,
          completed: weekCompletions,
          total: weekPossible,
          x: 0,
          y: 0,
        });
      }
    } else if (granularity === 'Monthly') {
      // Past 5 calendar months up to current month
      for (let m = 4; m >= 0; m--) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        const monthShort = monthDate.toLocaleDateString('en-US', { month: 'short' });

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let monthCompletions = 0;
        let monthPossible = 0;

        for (let day = 1; day <= daysInMonth; day++) {
          const dayD = new Date(year, month, day);
          const dayKey = formatDate(dayD);
          if (dayKey <= todayStr) {
            const done = targetHabits.filter((h) =>
              (h.completedDates || []).includes(dayKey)
            ).length;
            monthCompletions += done;
            monthPossible += targetHabits.length;
          }
        }

        const score = monthPossible > 0 ? Math.round((monthCompletions / monthPossible) * 100) : 0;

        pts.push({
          label: monthShort,
          subLabel: `${monthShort} ${year}`,
          dateKey: `${year}-${String(month + 1).padStart(2, '0')}`,
          score,
          completed: monthCompletions,
          total: monthPossible,
          x: 0,
          y: 0,
        });
      }
    } else {
      // 'All' Granularity: 8 evenly spaced intervals across the last 8 weeks
      for (let i = 7; i >= 0; i--) {
        const startDay = new Date(today);
        startDay.setDate(today.getDate() - i * 7);
        const startStr = formatDate(startDay);

        let completions = 0;
        let possible = 0;

        for (let d = 0; d < 7; d++) {
          const checkD = new Date(startDay);
          checkD.setDate(startDay.getDate() + d);
          const dayKey = formatDate(checkD);
          if (dayKey <= todayStr) {
            const done = targetHabits.filter((h) =>
              (h.completedDates || []).includes(dayKey)
            ).length;
            completions += done;
            possible += targetHabits.length;
          }
        }

        const score = possible > 0 ? Math.round((completions / possible) * 100) : 0;
        const label = i === 0 ? 'Now' : `-${i * 7}d`;

        pts.push({
          label,
          subLabel: startStr,
          dateKey: startStr,
          score,
          completed: completions,
          total: possible,
          x: 0,
          y: 0,
        });
      }
    }

    // Map exact screen coordinates
    const N = pts.length;
    return pts.map((p, idx) => {
      const x = PAD_LEFT + (idx / Math.max(1, N - 1)) * USABLE_WIDTH;
      const y = BOT_Y - (p.score / 100) * USABLE_HEIGHT;
      return {
        ...p,
        x,
        y,
      };
    });
  }, [granularity, relevantHabits, todayStr]);

  // Velocity Calculation: compare latest period with previous period
  const latestPoint = trajectoryPoints[trajectoryPoints.length - 1];
  const previousPoint =
    trajectoryPoints.length > 1 ? trajectoryPoints[trajectoryPoints.length - 2] : latestPoint;
  const velocityDiff = (latestPoint?.score ?? 0) - (previousPoint?.score ?? 0);

  // Dynamic SVG Paths
  const splinePathD = useMemo(() => getSplinePath(trajectoryPoints), [trajectoryPoints]);
  const areaPathD = useMemo(() => {
    if (trajectoryPoints.length === 0) return '';
    const lastX = trajectoryPoints[trajectoryPoints.length - 1].x;
    const firstX = trajectoryPoints[0].x;
    return `${splinePathD} L ${lastX.toFixed(1)} 175 L ${firstX.toFixed(1)} 175 Z`;
  }, [splinePathD, trajectoryPoints]);

  // Real Discipline Scores based on last 7 days adherence
  const calculateDisciplineScore = (category: string) => {
    const matching = activeHabits.filter((h) => h.category === category);
    if (matching.length === 0) return 0;

    const today = new Date(todayStr + 'T00:00:00');
    let completions = 0;
    let possible = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = formatDate(d);
      completions += matching.filter((h) => (h.completedDates || []).includes(dateKey)).length;
      possible += matching.length;
    }

    return possible > 0 ? Math.round((completions / possible) * 100) : 0;
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

  // Cadence execution breakdown (past 7 days)
  const calcCadenceRate = (list: Habit[]) => {
    if (list.length === 0) return 0;
    const today = new Date(todayStr + 'T00:00:00');
    let completions = 0;
    let possible = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = formatDate(d);
      completions += list.filter((h) => (h.completedDates || []).includes(dateKey)).length;
      possible += list.length;
    }
    return possible > 0 ? Math.round((completions / possible) * 100) : 0;
  };

  const morningHabits = activeHabits.filter((h) => h.cadence === 'Morning');
  const eveningHabits = activeHabits.filter((h) => h.cadence === 'Evening');
  const dayHabits = activeHabits.filter(
    (h) => h.cadence !== 'Morning' && h.cadence !== 'Evening'
  );

  const morningRate = calcCadenceRate(morningHabits);
  const afternoonRate = calcCadenceRate(dayHabits);
  const eveningRate = calcCadenceRate(eveningHabits);

  // Reliable file download helper
  const handleDownloadDossier = () => {
    const report = {
      title: 'HabitPulse Personal Cadence Report',
      user: userProfile.name || 'Executive User',
      titleRole: userProfile.title || 'Personal Tracker',
      timestamp: new Date().toISOString(),
      overallIntegrity: `${weeklyScore}%`,
      activeHabitsCount: activeHabits.length,
      pillarsDistribution,
      granularity,
      trajectoryPoints: trajectoryPoints.map((p) => ({
        period: p.label,
        dateKey: p.dateKey,
        score: `${p.score}%`,
        completed: p.completed,
        total: p.total,
      })),
      habits: activeHabits.map((h) => ({
        name: h.name,
        category: h.category,
        cadence: h.cadence,
        priority: h.priority,
        currentStreak: h.currentStreak,
        bestStreak: h.bestStreak,
        completedDatesRecorded: (h.completedDates || []).length,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HabitPulse_Dossier_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setShowExportModal(false);
  };

  const filteredMetrics =
    selectedDiscipline === 'All'
      ? disciplineMetrics
      : disciplineMetrics.filter((d) => d.name === selectedDiscipline);

  const periodPeak =
    trajectoryPoints.length > 0 ? Math.max(...trajectoryPoints.map((p) => p.score)) : 0;
  const periodLow =
    trajectoryPoints.length > 0 ? Math.min(...trajectoryPoints.map((p) => p.score)) : 0;

  return (
    <div className="flex flex-col w-full gap-space-lg sm:gap-space-xl pb-10">
      {/* Analytics Header & Control Deck */}
      <section className="flex flex-col gap-space-md sm:gap-space-lg">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm sm:gap-space-md">
          <div>
            <div className="flex items-center gap-space-xs mb-1 sm:mb-space-2xs">
              <span className="font-code-xs text-code-xs text-secondary tracking-widest uppercase font-semibold">
                Personal Performance Hub
              </span>
              <span className="text-outline-variant font-code-xs">•</span>
              <span className="font-code-xs text-code-xs text-on-surface-variant">
                Cadence Analytics
              </span>
            </div>
            <div className="flex items-baseline gap-space-sm">
              <h1 className="font-headline-lg text-2xl sm:text-headline-lg text-primary tracking-tight font-semibold">
                Analytics &amp; Trajectory
              </h1>
              <span className="font-code-sm text-xs sm:text-code-sm text-on-surface-variant">
                Live Telemetry
              </span>
            </div>
          </div>

          <div className="flex items-center gap-space-xs self-start md:self-auto">
            <button
              onClick={() => setShowExportModal(true)}
              className="h-9 sm:h-10 px-space-sm sm:px-space-md rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-xs sm:text-label-md flex items-center gap-space-xs shadow-xs transition-all cursor-pointer font-medium"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">
                file_download
              </span>
              <span>Export Dossier</span>
            </button>
          </div>
        </div>

        {/* Responsive Filter Bar Component */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-2 sm:p-space-sm shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-space-md">
          {/* Time Granularity Switcher: mobile 4-grid, desktop inline */}
          <div className="grid grid-cols-4 p-1 bg-surface-container rounded-lg gap-1 w-full sm:w-auto">
            {(['All', 'Daily', 'Weekly', 'Monthly'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-2 sm:px-space-md py-1.5 rounded-md font-label-md text-xs sm:text-label-md transition-all cursor-pointer text-center ${
                  granularity === g
                    ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                {g === 'All' ? 'Overview' : g}
              </button>
            ))}
          </div>

          {/* Discipline Selector */}
          <div className="w-full sm:w-auto">
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              className="w-full sm:w-auto h-9 px-space-sm rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface font-label-md text-xs sm:text-label-md focus:outline-none cursor-pointer"
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md sm:gap-space-lg items-start">
        {/* Left 8 Cols: Trajectory Chart & Discipline Breakdown */}
        <div className="lg:col-span-8 flex flex-col gap-space-md sm:gap-space-lg">
          {/* Consistency Trajectory Curve Chart Card */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 p-4 sm:p-space-lg rounded-xl shadow-xs flex flex-col gap-3 sm:gap-space-md relative overflow-hidden">
            {/* Header & Velocity Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-code-xs text-[10px] sm:text-code-xs text-on-surface-variant uppercase tracking-wider block">
                  Dynamic Trajectory Model
                </span>
                <h3 className="font-headline-sm text-lg sm:text-headline-sm text-primary font-semibold">
                  Cadence Yield Velocity
                </h3>
              </div>

              {/* Dynamic Velocity Badge */}
              <div
                className={`inline-flex items-center gap-space-xs px-2.5 sm:px-space-sm py-1 rounded-full font-code-xs text-xs sm:text-code-xs font-semibold border w-fit ${
                  velocityDiff > 0
                    ? 'bg-secondary/10 text-secondary border-secondary/30'
                    : velocityDiff < 0
                    ? 'bg-error/10 text-error border-error/30'
                    : 'bg-surface-container text-on-surface-variant border-outline-variant/30'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {velocityDiff > 0
                    ? 'trending_up'
                    : velocityDiff < 0
                    ? 'trending_down'
                    : 'trending_flat'}
                </span>
                <span>
                  {velocityDiff > 0
                    ? `+${velocityDiff}% Velocity`
                    : velocityDiff < 0
                    ? `${velocityDiff}% Velocity`
                    : 'Stable Velocity'}
                </span>
              </div>
            </div>

            {/* Mobile-Friendly Quick KPI Strip */}
            <div className="grid grid-cols-3 gap-2 sm:hidden pt-0.5">
              <div className="bg-surface-container-low p-2 rounded-lg border border-outline-variant/30 flex flex-col">
                <span className="font-code-xs text-[9px] text-on-surface-variant uppercase">
                  Current
                </span>
                <span className="font-headline-sm text-base font-bold text-primary">
                  {latestPoint?.score ?? 0}%
                </span>
              </div>
              <div className="bg-surface-container-low p-2 rounded-lg border border-outline-variant/30 flex flex-col">
                <span className="font-code-xs text-[9px] text-on-surface-variant uppercase">
                  Period Peak
                </span>
                <span className="font-headline-sm text-base font-bold text-secondary">
                  {periodPeak}%
                </span>
              </div>
              <div className="bg-surface-container-low p-2 rounded-lg border border-outline-variant/30 flex flex-col">
                <span className="font-code-xs text-[9px] text-on-surface-variant uppercase">
                  Period Low
                </span>
                <span className="font-headline-sm text-base font-bold text-outline">
                  {periodLow}%
                </span>
              </div>
            </div>

            {/* SVG Visual Dynamic Real Curve or Empty State */}
            {relevantHabits.length === 0 ? (
              <div className="h-48 sm:h-56 flex flex-col items-center justify-center text-center gap-2 border border-dashed border-outline-variant/40 rounded-xl p-4">
                <span className="material-symbols-outlined text-[32px] text-on-surface-variant">
                  query_stats
                </span>
                <p className="font-body-sm text-xs sm:text-body-sm text-on-surface-variant max-w-sm">
                  {selectedDiscipline === 'All'
                    ? 'Architect habits and log daily check-ins to generate your live trajectory curve.'
                    : `No habits active under ${selectedDiscipline}. Create a habit or switch to All Disciplines.`}
                </p>
              </div>
            ) : (
              <div className="relative w-full">
                {/* Scrollable Container on Mobile with Native Aspect Ratio */}
                <div className="w-full overflow-x-auto pb-1 touch-pan-x scrollbar-none sm:scrollbar-thin">
                  <div className="min-w-[500px] sm:min-w-full h-52 sm:h-64 relative">
                    <svg
                      className="w-full h-full overflow-visible"
                      viewBox="0 0 640 220"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <defs>
                        <linearGradient
                          id="areaGradientDynamic"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#006C49" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#006C49" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Gridlines & Percentage Labels */}
                      {[
                        { label: '100%', y: 30 },
                        { label: '75%', y: 66.25 },
                        { label: '50%', y: 102.5 },
                        { label: '25%', y: 138.75 },
                        { label: '0%', y: 175 },
                      ].map((grid) => (
                        <g key={grid.label}>
                          <line
                            x1="55"
                            y1={grid.y}
                            x2="605"
                            y2={grid.y}
                            stroke="rgba(42, 27, 45, 0.08)"
                            strokeDasharray="4 4"
                          />
                          <text
                            x="48"
                            y={grid.y + 4}
                            textAnchor="end"
                            className="font-code-xs text-[10px] fill-on-surface-variant/70 font-medium"
                          >
                            {grid.label}
                          </text>
                        </g>
                      ))}

                      {/* Shaded Area Fill below real curve */}
                      {areaPathD && <path d={areaPathD} fill="url(#areaGradientDynamic)" />}

                      {/* Real Dynamic Spline Curve */}
                      {splinePathD && (
                        <path
                          d={splinePathD}
                          fill="none"
                          stroke="#006C49"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* Point Nodes with Labels & Hover Triggers */}
                      {trajectoryPoints.map((pt) => {
                        const isHovered = hoveredPoint?.dateKey === pt.dateKey;
                        return (
                          <g
                            key={pt.dateKey + pt.label}
                            onMouseEnter={() => setHoveredPoint(pt)}
                            onMouseLeave={() => setHoveredPoint(null)}
                            onClick={() =>
                              setHoveredPoint(isHovered ? null : pt)
                            }
                            className="cursor-pointer"
                          >
                            {/* Interactive invisible hit target (generous 32px diameter for touch) */}
                            <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />

                            {/* Outer pulsing ring when active */}
                            {isHovered && (
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r="10"
                                fill="none"
                                stroke="#006C49"
                                strokeWidth="2.5"
                                opacity="0.6"
                              />
                            )}

                            {/* Data Node Circle */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isHovered ? 6.5 : 4.5}
                              fill={isHovered ? '#006C49' : '#2A1B2D'}
                              stroke="#FFF8F5"
                              strokeWidth="2.5"
                              className="transition-all duration-150"
                            />

                            {/* Value Text above node */}
                            <text
                              x={pt.x}
                              y={Math.max(18, pt.y - 10)}
                              textAnchor="middle"
                              className={`font-code-xs text-[11px] font-bold ${
                                isHovered ? 'fill-secondary' : 'fill-primary'
                              }`}
                            >
                              {pt.score}%
                            </text>

                            {/* Date / Period Label below baseline */}
                            <text
                              x={pt.x}
                              y="198"
                              textAnchor="middle"
                              className={`font-code-xs text-[10px] ${
                                isHovered
                                  ? 'fill-primary font-bold'
                                  : 'fill-on-surface-variant'
                              }`}
                            >
                              {pt.label}
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    {/* Clamped Floating Tooltip that never clips off screen */}
                    {hoveredPoint && (
                      <div
                        className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-full px-2.5 py-1.5 rounded-lg bg-primary text-surface text-xs shadow-lg border border-outline-variant/30 flex flex-col gap-0.5 whitespace-nowrap"
                        style={{
                          left: `${Math.min(84, Math.max(16, (hoveredPoint.x / 640) * 100))}%`,
                          top: `${Math.max(8, (hoveredPoint.y / 220) * 100 - 6)}%`,
                        }}
                      >
                        <span className="font-semibold text-surface text-[11px]">
                          {hoveredPoint.subLabel}
                        </span>
                        <span className="font-code-xs text-[10px] text-secondary-container font-medium">
                          {hoveredPoint.score}% Adherence ({hoveredPoint.completed}/
                          {hoveredPoint.total} Habits)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Swipe Cue */}
                <div className="flex sm:hidden items-center justify-between text-[11px] text-on-surface-variant px-1 pt-1">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">swipe</span>
                    Swipe chart horizontally to inspect
                  </span>
                  <span className="font-code-xs text-[10px]">
                    {trajectoryPoints.length} milestones
                  </span>
                </div>

                {/* Mobile Quick-Tap Pill Carousel */}
                <div className="flex sm:hidden gap-1.5 overflow-x-auto pb-1 pt-2 scrollbar-none">
                  {trajectoryPoints.map((pt) => {
                    const isSelected = hoveredPoint?.dateKey === pt.dateKey;
                    return (
                      <button
                        key={'pill-' + pt.dateKey + pt.label}
                        onClick={() =>
                          setHoveredPoint(isSelected ? null : pt)
                        }
                        className={`shrink-0 px-2.5 py-1.5 rounded-lg border text-left flex flex-col transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-surface border-primary shadow-xs'
                            : 'bg-surface-container-low border-outline-variant/30 text-on-surface hover:bg-surface-container'
                        }`}
                        type="button"
                      >
                        <span
                          className={`text-[9px] font-code-xs ${
                            isSelected ? 'text-surface/80' : 'text-on-surface-variant'
                          }`}
                        >
                          {pt.label}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="font-bold text-xs">{pt.score}%</span>
                          <span
                            className={`text-[9px] ${
                              isSelected
                                ? 'text-secondary-container'
                                : 'text-on-surface-variant'
                            }`}
                          >
                            {pt.completed}/{pt.total}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-on-surface-variant border-t border-surface-container pt-space-xs gap-1">
              <span className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                <span className="w-2 h-2 rounded-full bg-secondary inline-block" />
                Live mathematical yield trajectory based on verified check-ins.
              </span>
              <span className="font-code-xs text-[11px] sm:text-xs">
                Current Yield: <strong className="text-primary">{latestPoint?.score ?? 0}%</strong>
              </span>
            </div>
          </div>

          {/* Discipline Performance Breakdown */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 p-4 sm:p-space-lg rounded-xl shadow-xs flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-code-xs text-code-xs text-on-surface-variant uppercase tracking-wider block">
                  7-Day Consistency Index
                </span>
                <h3 className="font-headline-sm text-lg sm:text-headline-sm text-primary font-semibold">
                  Discipline Integrity Yield
                </h3>
              </div>
              <span className="font-code-xs text-xs text-on-surface-variant">
                Across 4 Pillars
              </span>
            </div>

            <div className="flex flex-col gap-space-md">
              {filteredMetrics.map((disc) => (
                <div key={disc.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-label-md text-xs sm:text-label-md font-semibold text-primary">
                      {disc.name} ({disc.routines} Routine{disc.routines === 1 ? '' : 's'})
                    </span>
                    <span className="font-code-xs text-xs sm:text-code-xs font-bold text-primary">
                      {disc.score}%
                    </span>
                  </div>
                  <div className="w-full h-2 sm:h-2.5 rounded-full bg-surface-container overflow-hidden">
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

        {/* Right 4 Cols: Reliability Matrix & Temporal Execution */}
        <div className="lg:col-span-4 flex flex-col gap-space-md sm:gap-space-lg">
          {/* Habit Reliability Ranking */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 p-4 sm:p-space-lg rounded-xl shadow-xs flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-code-xs text-code-xs text-on-surface-variant uppercase tracking-wider block">
                  Consistency Score
                </span>
                <h3 className="font-label-md text-label-md text-primary font-semibold">
                  Habit Reliability Index
                </h3>
              </div>
              <span className="font-code-xs text-code-xs text-secondary font-semibold">
                {activeHabits.length} Active
              </span>
            </div>

            <div className="flex flex-col gap-space-sm divide-y divide-surface-container">
              {activeHabits.length === 0 ? (
                <div className="py-6 text-center text-xs text-on-surface-variant">
                  No habits configured to rank yet.
                </div>
              ) : (
                activeHabits.slice(0, 6).map((h) => {
                  const today = new Date(todayStr + 'T00:00:00');
                  let past7Done = 0;
                  for (let d = 0; d < 7; d++) {
                    const check = new Date(today);
                    check.setDate(today.getDate() - d);
                    if ((h.completedDates || []).includes(formatDate(check))) {
                      past7Done += 1;
                    }
                  }
                  const weeklyTarget = Math.min(7, Math.max(1, h.targetWeekly));
                  const rate = Math.min(100, Math.round((past7Done / weeklyTarget) * 100));

                  return (
                    <div key={h.id} className="pt-2 flex items-center justify-between">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-body-sm text-xs sm:text-body-sm font-semibold text-primary truncate">
                          {h.name}
                        </span>
                        <span className="font-code-xs text-[10px] sm:text-code-xs text-on-surface-variant">
                          {h.currentStreak}D Streak • {h.category}
                        </span>
                      </div>
                      <span className="font-code-sm text-xs sm:text-code-sm font-bold text-secondary">
                        {rate}%
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Temporal Execution Heatmap Breakdown */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 p-4 sm:p-space-lg rounded-xl shadow-xs flex flex-col gap-space-sm">
            <span className="font-label-md text-label-md text-primary font-semibold">
              Execution Cadence Heatmap
            </span>
            <p className="font-body-sm text-xs sm:text-body-sm text-on-surface-variant">
              Adherence distribution across daily temporal blocks over the last 7 days.
            </p>
            <div className="grid grid-cols-3 gap-2 mt-2 text-center">
              <div className="p-2 sm:p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col items-center">
                <span className="font-code-xs text-[10px] sm:text-code-xs text-outline uppercase">
                  Morning
                </span>
                <span className="font-headline-md text-lg sm:text-headline-md text-primary font-bold mt-1">
                  {morningRate}%
                </span>
                <span className="font-code-xs text-[10px] sm:text-code-xs text-secondary font-semibold">
                  {morningHabits.length} Habits
                </span>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col items-center">
                <span className="font-code-xs text-[10px] sm:text-code-xs text-outline uppercase">
                  Day
                </span>
                <span className="font-headline-md text-lg sm:text-headline-md text-primary font-bold mt-1">
                  {afternoonRate}%
                </span>
                <span className="font-code-xs text-[10px] sm:text-code-xs text-on-surface-variant">
                  {dayHabits.length} Habits
                </span>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col items-center">
                <span className="font-code-xs text-[10px] sm:text-code-xs text-outline uppercase">
                  Evening
                </span>
                <span className="font-headline-md text-lg sm:text-headline-md text-primary font-bold mt-1">
                  {eveningRate}%
                </span>
                <span className="font-code-xs text-[10px] sm:text-code-xs text-secondary font-semibold">
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
          <div className="relative w-full max-w-md bg-surface-container-lowest border border-outline-variant/50 rounded-2xl shadow-2xl p-4 sm:p-space-xl z-10 flex flex-col gap-space-md">
            <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">
              Export Habit Dossier
            </h3>
            <p className="font-body-sm text-xs sm:text-body-sm text-on-surface-variant">
              Download your complete verified performance dossier as a structured JSON file for
              backups, executive reporting, and cadence auditing.
            </p>
            <div className="flex justify-end gap-space-sm pt-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-space-md py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md cursor-pointer hover:bg-surface-variant"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleDownloadDossier}
                className="px-space-lg py-2 rounded-lg bg-primary-container text-surface font-label-md text-label-md shadow-md cursor-pointer font-semibold hover:bg-primary"
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
