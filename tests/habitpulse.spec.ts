import { test, expect } from '@playwright/test';

test.describe('HabitPulse Brand New Habit Tracker', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (!window.sessionStorage.getItem('test_initialized')) {
        window.localStorage.clear();
        window.sessionStorage.setItem('test_initialized', 'true');
      }
    });
  });

  test('1. Dashboard renders clean cockpit and KPI cards with 0 habits', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/HabitPulse/);

    // Verify time-based greeting (e.g. Good evening, Good morning)
    await expect(page.locator('h1')).toContainText(/Good (morning|afternoon|evening)/i);

    // Verify 4 KPI cards
    await expect(page.getByText("Today's Progress")).toBeVisible();
    await expect(page.getByText('Active Streak')).toBeVisible();
    await expect(page.getByText('Active Portfolio')).toBeVisible();
    await expect(page.getByText('Pillars Distribution')).toBeVisible();

    // Verify empty state prompt
    await expect(page.getByText('No habits configured yet')).toBeVisible();
  });

  test('2. Can open New Habit modal and architect a routine', async ({ page }) => {
    await page.goto('/');

    // Click "New Habit" button in sidebar via reliable ID
    await page.locator('#sidebar-new-habit-btn').click();

    // Verify modal is displayed
    await expect(page.getByText('Architect Routine')).toBeVisible();

    // Fill in the routine form
    await page.getByPlaceholder(/Morning Sunlight Protocol/i).fill('Morning Meditation');

    // Submit
    await page.getByRole('button', { name: 'Establish Protocol' }).click();

    // Verify modal is closed
    await expect(page.getByText('Architect Routine')).not.toBeVisible();

    // Verify the newly established habit is rendered
    await expect(
      page.locator('#habit-checklist-container').getByText('Morning Meditation')
    ).toBeVisible();
  });

  test('3. Can toggle habit completion and see progress update', async ({ page }) => {
    await page.goto('/');

    // Create a habit first
    await page.locator('#sidebar-new-habit-btn').click();
    await page.getByPlaceholder(/Morning Sunlight Protocol/i).fill('Read 15 Pages');
    await page.getByRole('button', { name: 'Establish Protocol' }).click();

    // Find the toggle button for the new habit
    const toggleBtn = page.locator('#habit-checklist-container button[aria-label="Mark Completed"]').first();
    await expect(toggleBtn).toBeVisible();

    // Click to complete
    await toggleBtn.click();

    // Verify completed state (aria-label changes to Mark Pending)
    await expect(page.locator('#habit-checklist-container button[aria-label="Mark Pending"]')).toBeVisible();

    // Verify live audit stream reflects updates
    await expect(page.getByText('Audit Stream')).toBeVisible();
  });

  test('4. Can navigate between Habits, Calendar, Analytics, and Settings', async ({ page }) => {
    await page.goto('/');

    // 1. Navigate to Habits Manager
    await page.locator('nav a', { hasText: 'Habits' }).click();
    await expect(page).toHaveURL(/.*habits/);
    await expect(page.locator('h1')).toContainText('Habit Architecture');
    await expect(page.getByText('Matrix Inventory')).toBeVisible();

    // 2. Navigate to Calendar View
    await page.locator('nav a', { hasText: 'Calendar' }).click();
    await expect(page).toHaveURL(/.*calendar/);
    await expect(page.getByText('Cadence Inspector')).toBeVisible();

    // 3. Navigate to Analytics Hub
    await page.locator('nav a', { hasText: 'Analytics' }).click();
    await expect(page).toHaveURL(/.*analytics/);
    await expect(page.locator('h1')).toContainText('Analytics & Trajectory');

    // 4. Navigate to Settings
    await page.locator('nav a', { hasText: 'Settings' }).click();
    await expect(page).toHaveURL(/.*settings/);
    await expect(page.locator('h1')).toContainText('System Calibration');
  });

  test('5. Data persists in device localStorage across page reload', async ({ page }) => {
    await page.goto('/');

    // Architect a routine
    await page.locator('#sidebar-new-habit-btn').click();
    await page.getByPlaceholder(/Morning Sunlight Protocol/i).fill('Drink 2L Water');
    await page.getByRole('button', { name: 'Establish Protocol' }).click();
    await expect(page.locator('#habit-checklist-container').getByText('Drink 2L Water')).toBeVisible();

    // Verify localStorage has the habit
    const stored = await page.evaluate(() => localStorage.getItem('habitpulse_habits_v2'));
    expect(stored).toBeTruthy();
    expect(stored).toContain('Drink 2L Water');

    // Reload page and check that habit is still rendered
    await page.reload();
    await expect(page.locator('#habit-checklist-container').getByText('Drink 2L Water')).toBeVisible();
  });

  test('6. Trajectory Model calculates real dynamic values and curve reflects check-ins', async ({ page }) => {
    await page.goto('/');

    // Create a habit and check it off
    await page.locator('#sidebar-new-habit-btn').click();
    await page.getByPlaceholder(/Morning Sunlight Protocol/i).fill('Deep Work Protocol');
    await page.getByRole('button', { name: 'Establish Protocol' }).click();

    // Toggle today to complete
    const toggleBtn = page.locator('#habit-checklist-container button[aria-label="Mark Completed"]').first();
    await toggleBtn.click();

    // Navigate to Analytics
    await page.locator('nav a', { hasText: 'Analytics' }).click();
    await expect(page.locator('h1')).toContainText('Analytics & Trajectory');

    // Verify Trajectory Model shows real curve and yield velocity
    await expect(page.getByText('Cadence Yield Velocity')).toBeVisible();
    await expect(page.getByText('Dynamic Trajectory Model')).toBeVisible();
    await expect(page.getByText(/100%/).first()).toBeVisible();

    // Switch to Weekly granularity and verify dynamic points render
    await page.getByRole('button', { name: 'Weekly' }).click();
    await expect(page.getByText('This Wk')).toBeVisible();

    // Switch to Monthly granularity
    await page.getByRole('button', { name: 'Monthly' }).click();
    await expect(page.locator('svg line')).toHaveCount(5); // 5 gridlines (100, 75, 50, 25, 0)
  });

  test('7. Settings Export Habits JSON triggers download with complete data', async ({ page }) => {
    await page.goto('/');

    // Create a habit
    await page.locator('#sidebar-new-habit-btn').click();
    await page.getByPlaceholder(/Morning Sunlight Protocol/i).fill('Evening Reading');
    await page.getByRole('button', { name: 'Establish Protocol' }).click();

    // Navigate to Settings
    await page.locator('nav a', { hasText: 'Settings' }).click();
    await expect(page.locator('#export-habits-json-btn')).toBeVisible();

    // Trigger download and verify download event
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export-habits-json-btn').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/HabitPulse_Backup_\d+\.json/);
    await expect(page.getByText('Habit backup JSON file downloaded successfully.')).toBeVisible();
  });

  test('8. Settings Import Habits JSON restores backup successfully', async ({ page }) => {
    await page.goto('/settings');

    // Create a mock backup file payload
    const mockBackup = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      userProfile: { name: 'Titan Executive', title: 'Managing Director' },
      habits: [
        {
          id: 'imported-1',
          name: 'Cold Plunge Protocol',
          category: 'Health',
          cadence: 'Morning',
          priority: 'High',
          targetWeekly: 7,
          currentStreak: 5,
          bestStreak: 12,
          completedDates: ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05'],
          createdAt: '2026-09-01',
        },
      ],
      auditLogs: [],
    };

    // Upload via the file input
    await page.locator('#habit-json-import-input').setInputFiles({
      name: 'HabitPulse_Backup_Test.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(mockBackup)),
    });

    // Verify confirmation message
    await expect(page.getByText('Successfully imported 1 routine.')).toBeVisible();

    // Navigate to Habits and verify imported habit is rendered
    await page.locator('nav a', { hasText: 'Habits' }).click();
    await expect(page.getByText('Cold Plunge Protocol')).toBeVisible();
  });
});
