'use client';

import React, { useState } from 'react';
import { useHabitStore } from '@/lib/habitStore';
import { Category, Cadence, Priority } from '@/lib/types';

export const NewHabitModal: React.FC = () => {
  const { isNewHabitModalOpen, setIsNewHabitModalOpen, addHabit } = useHabitStore();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Health');
  const [cadence, setCadence] = useState<Cadence>('Daily');
  const [priority, setPriority] = useState<Priority>('Normal');
  const [targetWeekly, setTargetWeekly] = useState<number>(7);
  const [scheduledTime, setScheduledTime] = useState<string>('08:00 AM');
  const [notes, setNotes] = useState('');

  if (!isNewHabitModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addHabit({
      name: name.trim(),
      category,
      cadence,
      priority,
      targetWeekly,
      scheduledTime,
      notes: notes.trim() || undefined,
    });

    // Reset and close
    setName('');
    setNotes('');
    setIsNewHabitModalOpen(false);
  };

  const categories: Category[] = ['Health', 'Mind & Focus', 'Productivity', 'Fitness'];
  const cadences: Cadence[] = ['Morning', 'Evening', 'Daily', 'Mon - Fri', 'Mon, Wed, Fri'];
  const priorities: Priority[] = ['Normal', 'Medium', 'High'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={() => setIsNewHabitModalOpen(false)}
      />
      <div className="relative w-full max-w-lg bg-surface-container-lowest border border-outline-variant/50 rounded-2xl shadow-2xl p-space-xl z-10 flex flex-col gap-space-lg">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-surface-container pb-space-sm">
          <div className="flex items-center gap-space-xs">
            <div className="w-8 h-8 rounded-lg bg-primary-container text-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-primary font-semibold">
                Architect Routine
              </h2>
              <span className="font-code-xs text-code-xs text-on-surface-variant">
                Configure behavioral protocol
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsNewHabitModalOpen(false)}
            className="w-8 h-8 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-space-md">
          {/* Habit Name */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-primary font-medium">
              Habit Name / Commitment <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Sunlight Protocol, Cold Shower, Deep Reading..."
              className="h-10 px-space-sm rounded-lg bg-surface-container-low border border-outline-variant/50 text-on-surface font-body-md text-body-md focus:border-primary-container focus:bg-surface-container-lowest focus:outline-none transition-all placeholder:text-outline-variant"
            />
          </div>

          {/* Category & Cadence Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-primary font-medium">
                Pillar Discipline
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="h-10 px-space-sm rounded-lg bg-surface-container-low border border-outline-variant/50 text-on-surface font-label-md text-label-md focus:border-primary-container focus:outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-primary font-medium">
                Temporal Cadence
              </label>
              <select
                value={cadence}
                onChange={(e) => setCadence(e.target.value as Cadence)}
                className="h-10 px-space-sm rounded-lg bg-surface-container-low border border-outline-variant/50 text-on-surface font-label-md text-label-md focus:border-primary-container focus:outline-none cursor-pointer"
              >
                {cadences.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority & Target Days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-primary font-medium">
                Priority Tier
              </label>
              <div className="flex gap-2">
                {priorities.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-1.5 rounded-lg font-label-sm text-label-sm border transition-all cursor-pointer ${
                      priority === p
                        ? 'bg-primary-container text-surface border-primary-container font-semibold shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant/40 hover:bg-surface-container'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-primary font-medium">
                Weekly Target ({targetWeekly} Days)
              </label>
              <input
                type="range"
                min="1"
                max="7"
                value={targetWeekly}
                onChange={(e) => setTargetWeekly(Number(e.target.value))}
                className="accent-primary-container mt-2"
              />
            </div>
          </div>

          {/* Scheduled Time & Context */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-primary font-medium">
              Scheduled Anchor Time
            </label>
            <input
              type="text"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              placeholder="e.g. 06:30 AM or Evening"
              className="h-10 px-space-sm rounded-lg bg-surface-container-low border border-outline-variant/50 text-on-surface font-code-sm text-code-sm focus:border-primary-container focus:bg-surface-container-lowest focus:outline-none transition-all"
            />
          </div>

          {/* Notes / Purpose */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-primary font-medium">
              Execution Rule & Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Specify trigger conditions, environment cues, or metric targets..."
              className="p-space-sm rounded-lg bg-surface-container-low border border-outline-variant/50 text-on-surface font-body-sm text-body-sm focus:border-primary-container focus:bg-surface-container-lowest focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-space-sm pt-space-xs border-t border-surface-container">
            <button
              type="button"
              onClick={() => setIsNewHabitModalOpen(false)}
              className="px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-space-lg py-2 rounded-lg bg-primary-container hover:bg-primary text-surface font-label-md text-label-md shadow-md transition-all cursor-pointer font-semibold"
            >
              Establish Protocol
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
