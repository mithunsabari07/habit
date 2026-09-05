'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useHabitStore } from '@/lib/habitStore';
import { formatDate } from '@/lib/seedData';

interface HeaderProps {
  onToggleMobile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobile }) => {
  const { selectedDate, setSelectedDate, todayStr, auditLogs, userProfile } = useHabitStore();
  const [showNotifications, setShowNotifications] = useState(false);

  const initials = userProfile.name
    ? userProfile.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'HP';

  // Format date display (e.g. "Today, Oct 24" or "Wed, Oct 23")
  const formatHeaderDate = (dateStr: string) => {
    if (dateStr === todayStr) {
      const parts = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return `Today, ${parts}`;
    }
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const prev = new Date(y, m - 1, d - 1);
    setSelectedDate(formatDate(prev));
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const next = new Date(y, m - 1, d + 1);
    setSelectedDate(formatDate(next));
  };

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface/85 backdrop-blur-xl border-b border-surface-container shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-4 lg:px-space-xl">
      {/* Left controls: Mobile menu toggle + Date switcher */}
      <div className="flex items-center gap-space-sm lg:gap-space-md">
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 rounded text-on-surface-variant hover:bg-surface-container"
          aria-label="Toggle menu"
          type="button"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1.5 rounded border border-outline-variant/30">
          <button
            onClick={handlePrevDay}
            className="flex items-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-0.5"
            type="button"
            title="Previous Day"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button
            onClick={() => setSelectedDate(todayStr)}
            className="font-code-sm text-code-sm text-primary px-space-xs font-medium hover:text-secondary transition-colors"
            title="Jump to Today"
          >
            {formatHeaderDate(selectedDate)}
          </button>
          <button
            onClick={handleNextDay}
            className="flex items-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-0.5"
            type="button"
            title="Next Day"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-space-2xs text-secondary bg-secondary-container/20 px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
          <span className="font-code-xs text-code-xs font-semibold text-secondary">
            Synced
          </span>
        </div>
      </div>

      {/* Right controls: Notifications + Profile */}
      <div className="flex items-center gap-space-md relative">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex items-center justify-center w-9 h-9 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all cursor-pointer"
            type="button"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error ring-2 ring-surface"></span>
          </button>

          {/* Notifications Dropdown Drawer */}
          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-xl z-40 p-space-md flex flex-col gap-space-sm animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
                  <span className="font-label-md text-label-md text-primary font-semibold">
                    System Notifications
                  </span>
                  <span className="font-code-xs text-code-xs text-secondary font-medium">
                    Live Stream
                  </span>
                </div>
                <div className="flex flex-col gap-space-xs max-h-72 overflow-y-auto">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-2 p-2 rounded hover:bg-surface-container-low transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-secondary mt-1.5 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-body-sm text-body-sm font-medium text-primary truncate">
                          {log.habitName}
                        </span>
                        <span className="font-code-xs text-code-xs text-on-surface-variant">
                          {log.details || log.action} • {log.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <Link
          href="/settings"
          className="flex items-center gap-space-xs p-1 rounded-full hover:ring-2 hover:ring-primary-container transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-primary-container text-surface flex items-center justify-center font-label-md text-label-md font-semibold">
            {initials}
          </div>
        </Link>
      </div>
    </header>
  );
};
