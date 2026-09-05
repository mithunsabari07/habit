'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NewHabitModal } from './NewHabitModal';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface flex flex-col text-on-surface">
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="lg:pl-72 flex flex-col min-h-screen">
        <Header onToggleMobile={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 w-full pt-16 px-4 sm:px-6 lg:px-space-xl py-space-xl max-w-[1440px] mx-auto">
          {children}
        </main>
      </div>
      <NewHabitModal />
    </div>
  );
};
