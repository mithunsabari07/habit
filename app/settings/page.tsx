'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useHabitStore } from '@/lib/habitStore';
import { BackupData } from '@/lib/types';

export default function SettingsPage() {
  const { habits, auditLogs, resetData, userProfile, updateUserProfile, importData } =
    useHabitStore();
  const [userName, setUserName] = useState(userProfile.name);
  const [userRole, setUserRole] = useState(userProfile.title);
  const [savedNotice, setSavedNotice] = useState(false);
  const [exportNotice, setExportNotice] = useState(false);
  const [importNotice, setImportNotice] = useState<{ message: string; isError?: boolean } | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUserName(userProfile.name);
    setUserRole(userProfile.title);
  }, [userProfile]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ name: userName.trim(), title: userRole.trim() });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  // Reliable cross-device & browser Export JSON
  const handleExportJSON = () => {
    const backup: BackupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      userProfile,
      habits,
      auditLogs,
    };

    const data = JSON.stringify(backup, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HabitPulse_Backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 4000);
  };

  // Cross-device Backup Import
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        const result = importData(json);
        if (result.success) {
          setImportNotice({ message: result.message, isError: false });
        } else {
          setImportNotice({ message: result.message, isError: true });
        }
        setTimeout(() => setImportNotice(null), 5000);
      } catch {
        setImportNotice({
          message: 'Failed to read file. Please select a valid HabitPulse JSON backup.',
          isError: true,
        });
        setTimeout(() => setImportNotice(null), 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const initials = userName
    ? userName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'HP';

  return (
    <div className="flex flex-col w-full max-w-4xl gap-space-xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-space-xs text-on-surface-variant font-code-xs text-code-xs tracking-wider uppercase mb-space-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          Settings &amp; Personalization
        </div>
        <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-semibold">
          System Calibration
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Customize your profile, configure cadence telemetry, and manage your device storage.
        </p>
      </div>

      {savedNotice && (
        <div className="p-space-md rounded-xl bg-secondary/10 border border-secondary text-secondary font-label-md text-label-md flex items-center gap-space-xs animate-in fade-in">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>Profile preferences updated successfully.</span>
        </div>
      )}

      {exportNotice && (
        <div className="p-space-md rounded-xl bg-secondary/10 border border-secondary text-secondary font-label-md text-label-md flex items-center gap-space-xs animate-in fade-in">
          <span className="material-symbols-outlined text-[18px]">download_done</span>
          <span>Habit backup JSON file downloaded successfully.</span>
        </div>
      )}

      {importNotice && (
        <div
          className={`p-space-md rounded-xl font-label-md text-label-md flex items-center gap-space-xs animate-in fade-in ${
            importNotice.isError
              ? 'bg-error-container/40 border border-error text-on-error-container'
              : 'bg-secondary/10 border border-secondary text-secondary'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {importNotice.isError ? 'error' : 'task_alt'}
          </span>
          <span>{importNotice.message}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-space-lg shadow-xs flex flex-col gap-space-md">
        <div className="flex items-center gap-space-md pb-space-sm border-b border-surface-container">
          <div className="w-14 h-14 rounded-full bg-primary-container text-surface flex items-center justify-center font-headline-sm text-headline-sm font-semibold">
            {initials}
          </div>
          <div className="flex flex-col">
            <h2 className="font-headline-sm text-headline-sm text-primary font-semibold">
              {userName || 'Your Name'}
            </h2>
            <span className="font-code-xs text-code-xs text-secondary font-medium">
              {userRole || 'Habit Tracker'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-space-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-primary font-medium">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="h-10 px-space-sm rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-md text-body-md focus:outline-none focus:border-primary-container"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-primary font-medium">
                Role / Title
              </label>
              <input
                type="text"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                placeholder="e.g. Habit Builder, Product Lead"
                className="h-10 px-space-sm rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface font-body-md text-body-md focus:outline-none focus:border-primary-container"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-space-lg py-2 rounded-lg bg-primary-container hover:bg-primary text-surface font-label-md text-label-md shadow-md transition-all cursor-pointer font-semibold"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Cadence Notification Settings */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-space-lg shadow-xs flex flex-col gap-space-md">
        <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">
          Cadence Reminders &amp; Telemetry
        </h3>

        <div className="flex flex-col gap-space-sm divide-y divide-surface-container">
          <div className="flex items-center justify-between py-2">
            <div className="flex flex-col">
              <span className="font-label-md text-label-md font-semibold text-primary">
                Morning Kickoff Dispatch
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Synthesizes today&apos;s scheduled protocols at 06:00 AM.
              </span>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="accent-primary-container w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex flex-col">
              <span className="font-label-md text-label-md font-semibold text-primary">
                Evening Retrospective Audit
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Prompts review of unverified commitments at 09:30 PM.
              </span>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="accent-primary-container w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex flex-col">
              <span className="font-label-md text-label-md font-semibold text-primary">
                Weekly Integrity Assessment
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Generates Sunday evening performance review.
              </span>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="accent-primary-container w-4 h-4 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Data Management & Persistence */}
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-space-lg shadow-xs flex flex-col gap-space-md">
        <div>
          <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">
            Device Local Storage &amp; Backups
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            All your habits, daily check-in histories, and profile configurations are stored
            directly inside this device&apos;s browser <code className="text-secondary bg-surface-container px-1 py-0.5 rounded text-xs">localStorage</code>.
            Use JSON Export and Import to transfer your data between computers and mobile devices.
          </p>
        </div>

        {/* Hidden File Input for JSON Backup Import */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".json,application/json"
          onChange={handleImportFile}
          className="hidden"
          id="habit-json-import-input"
        />

        <div className="flex flex-wrap items-center gap-space-sm pt-2">
          {/* Export Button */}
          <button
            id="export-habits-json-btn"
            onClick={handleExportJSON}
            className="px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md flex items-center gap-space-xs transition-colors cursor-pointer font-medium"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export Habits JSON</span>
          </button>

          {/* Import Button */}
          <button
            id="import-habits-json-btn"
            onClick={() => fileInputRef.current?.click()}
            className="px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md flex items-center gap-space-xs transition-colors cursor-pointer font-medium"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">upload</span>
            <span>Import Habits JSON</span>
          </button>

          {/* Reset Clean Baseline */}
          <button
            onClick={() => {
              if (
                window.confirm(
                  'Are you sure you want to reset all habits and history on this device to a completely clean state?'
                )
              ) {
                resetData();
                alert('Habit tracker on this device has been reset.');
              }
            }}
            className="px-space-md py-2 rounded-lg bg-error-container/40 hover:bg-error-container text-on-error-container font-label-md text-label-md flex items-center gap-space-xs transition-colors cursor-pointer font-medium"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            <span>Reset to Clean Baseline</span>
          </button>
        </div>
      </div>
    </div>
  );
}
