'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useHabitStore } from '@/lib/habitStore';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const pathname = usePathname();
  const { setIsNewHabitModalOpen, activeStreak, userProfile } = useHabitStore();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: 'grid_view' },
    { label: 'Habits', path: '/habits', icon: 'check_circle' },
    { label: 'Calendar', path: '/calendar', icon: 'calendar_today' },
    { label: 'Analytics', path: '/analytics', icon: 'insights' },
    { label: 'Settings', path: '/settings', icon: 'settings' },
  ];

  const initials = userProfile.name
    ? userProfile.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'HP';

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-surface-container-low shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between p-space-lg transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-space-lg">
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              onClick={onCloseMobile}
              className="flex items-center gap-space-sm group"
            >
              <Image
                alt="HabitPulse Brand Logo"
                className="h-8 w-8 object-contain transition-transform group-hover:scale-105"
                src="/brand-logo.svg"
                width={32}
                height={32}
              />
              <span className="font-headline-sm text-headline-sm text-primary tracking-tight">
                HabitPulse
              </span>
            </Link>
            <div className="flex items-center gap-space-2xs px-space-xs py-space-2xs rounded bg-tertiary-fixed text-on-tertiary-fixed">
              <span
                className="material-symbols-outlined text-[14px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_fire_department
              </span>
              <span className="font-code-xs text-code-xs font-semibold">{activeStreak}D</span>
            </div>
          </div>

          {/* New Habit Action Button */}
          <button
            id="sidebar-new-habit-btn"
            onClick={() => {
              setIsNewHabitModalOpen(true);
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full h-10 px-space-md rounded bg-primary-container hover:bg-primary text-surface font-label-md text-label-md flex items-center justify-center gap-space-xs transition-all shadow-[0_1px_4px_rgba(0,0,0,0.06)] cursor-pointer active:scale-[0.99]"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New Habit</span>
          </button>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-space-2xs">
            {navItems.map((item) => {
              const isActive =
                item.path === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-space-sm px-space-sm py-space-xs rounded transition-all ${
                    isActive
                      ? 'bg-surface-container-high text-primary font-semibold shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {item.icon}
                  </span>
                  <span className="font-label-md text-label-md">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Badge */}
        <div className="flex items-center justify-between p-space-sm rounded bg-surface-container">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-code-xs text-code-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-label-md text-on-surface font-medium truncate">
                {userProfile.name || 'Personal Space'}
              </span>
              <span className="font-code-xs text-code-xs text-on-surface-variant truncate">
                {userProfile.title || 'Habit Tracker'}
              </span>
            </div>
          </div>
          <Link
            href="/settings"
            onClick={onCloseMobile}
            className="text-on-surface-variant hover:text-primary p-1 transition-colors shrink-0"
            title="Account Settings"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
          </Link>
        </div>
      </aside>
    </>
  );
};
