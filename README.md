# HabitPulse — Executive Habit Tracker & Analytics Platform

HabitPulse is a minimalist, high-performance personal habit tracking and cadence analytics application built with **Next.js 16 (Turbopack)**, **Tailwind CSS v4**, and **Playwright**.

Designed with the **Deep Plum Minimalist** aesthetic, HabitPulse helps you architect, calibrate, and track your daily behavioral commitments with zero friction.

---

## ✨ Features

- 🎯 **Executive Cockpit Dashboard**:
  - Real-time dynamic daily progress radial meter.
  - Active streak tracking with milestone badges.
  - Category breakdown across Productivity, Health, Fitness, and Mind.
  - Interactive habit execution checklist with instant completion toggling.
  - 7-day visual consistency matrix.
  - Live audit stream logging every verified commitment.

- 📋 **Habit Architecture & Matrix Inventory**:
  - Matrix table view with 7-day Monday-to-Sunday completion grid.
  - Daily execution cards grouped by cadence (Morning, Afternoon, Evening).
  - Real-time search and discipline filtering.
  - Modal to architect new custom routines.

- 📅 **Cadence Calendar & Day Inspector**:
  - Full monthly calendar grid with tiered color density heat indicators.
  - Interactive Day Inspector allowing historical and scheduled routine verification.
  - Month-by-month navigation and jump-to-today controls.

- 📊 **Deep Analytics & Trajectory Hub**:
  - Trajectory model SVG curve tracking weekly yield velocity.
  - Discipline integrity yield metrics across all active pillars.
  - Cadence distribution heatmaps.
  - One-click JSON dossier report export.

- ⚙️ **Personalization & Local Governance**:
  - Customizable profile name and role title with persistent browser local storage.
  - Instant CSV & JSON data export.
  - Clean baseline reset functionality.

- 🧪 **Automated E2E Test Suite**:
  - Playwright integration verifying full application functionality across routes.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed

### Installation & Development
```bash
# Clone the repository
git clone https://github.com/mithunsabari07/habit.git

# Navigate into directory
cd habit

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Tests

```bash
# Run end-to-end tests with Playwright
npm run test:e2e

# Run tests with interactive UI mode
npm run test:e2e:ui
```

---

## 📦 Production Build

```bash
npm run build
npm run start
```

---

## 🌐 Deploy to Vercel (Recommended)

1. Import this repository into [Vercel](https://vercel.com).
2. Click **Deploy**. Vercel will automatically build and host the application with zero configuration.
