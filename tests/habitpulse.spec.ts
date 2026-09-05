import { test, expect } from '@playwright/test';

test.describe('HabitPulse Brand New Habit Tracker', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
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
});
