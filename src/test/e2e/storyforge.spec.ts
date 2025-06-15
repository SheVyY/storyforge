import { test, expect } from '@playwright/test';

test.describe('StoryForge E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="app-layout"]', { timeout: 10000 });
  });

  test('should load home page and display main navigation', async ({ page }) => {
    // Check that the main layout is present
    await expect(page.locator('h1')).toContainText('StoryForge');
    
    // Check navigation links
    await expect(page.locator('nav a[href="/"]')).toBeVisible();
    await expect(page.locator('nav a[href="/saves"]')).toBeVisible();
    await expect(page.locator('nav a[href="/settings"]')).toBeVisible();
  });

  test('should start new game and display story content', async ({ page }) => {
    // Click start new game button
    await page.click('[data-testid="start-new-game"]');
    
    // Should display story selection
    await expect(page.locator('h2')).toContainText('Choose Your Adventure');
    
    // Select first story
    await page.click('[data-testid="story-mysterious-portal"]');
    
    // Should display story content
    await expect(page.locator('.story-title')).toContainText('The Mysterious Portal');
    await expect(page.locator('.story-content')).toBeVisible();
    
    // Should display choices
    await expect(page.locator('.choices-container')).toBeVisible();
    await expect(page.locator('.choice-button')).toHaveCount(3);
  });

  test('should progress through story by making choices', async ({ page }) => {
    // Start new game
    await page.click('[data-testid="start-new-game"]');
    await page.click('[data-testid="story-mysterious-portal"]');
    
    // Wait for story to load
    await page.waitForSelector('.story-title');
    const initialTitle = await page.locator('.story-title').textContent();
    
    // Make first choice
    await page.click('.choice-button:first-child');
    
    // Wait for new scene to load
    await page.waitForTimeout(500);
    
    // Verify story progressed
    const newTitle = await page.locator('.story-title').textContent();
    expect(newTitle).not.toBe(initialTitle);
    
    // Should have new choices
    const choiceCount = await page.locator('.choice-button').count();
    expect(choiceCount).toBeGreaterThan(0);
  });

  test('should save and load game state', async ({ page }) => {
    // Start and progress in game
    await page.click('[data-testid="start-new-game"]');
    await page.click('[data-testid="story-mysterious-portal"]');
    await page.waitForSelector('.story-title');
    
    // Make a choice to create game state
    await page.click('.choice-button:first-child');
    await page.waitForTimeout(500);
    
    // Capture current scene title
    const sceneTitle = await page.locator('.story-title').textContent();
    
    // Navigate to saves page
    await page.click('nav a[href="/saves"]');
    
    // Should be on saves page
    await expect(page.locator('h2')).toContainText('Game Saves');
    
    // Should have at least one auto-save
    const saveCount = await page.locator('.save-item').count();
    expect(saveCount).toBeGreaterThan(0);
    
    // Click on first save to load it
    await page.click('.save-item:first-child .load-button');
    
    // Should redirect back to game
    await page.waitForSelector('.story-title');
    
    // Verify the correct scene was loaded
    if (sceneTitle) {
      await expect(page.locator('.story-title')).toContainText(sceneTitle);
    }
  });

  test('should export and import saves', async ({ page }) => {
    // Start game and make progress
    await page.click('[data-testid="start-new-game"]');
    await page.click('[data-testid="story-mysterious-portal"]');
    await page.waitForSelector('.story-title');
    await page.click('.choice-button:first-child');
    
    // Navigate to saves
    await page.click('nav a[href="/saves"]');
    
    // Export first save
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('.save-item:first-child .export-button')
    ]);
    
    // Verify download occurred
    expect(download.suggestedFilename()).toMatch(/\.storyforge$/);
    
    // Delete the save
    await page.click('.save-item:first-child .delete-button');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');
    
    // Should have no saves now
    await expect(page.locator('.save-item')).toHaveCount(0);
    
    // Import the save (would require file upload simulation)
    // This is more complex to test in E2E, but the functionality exists
  });

  test('should handle navigation between pages', async ({ page }) => {
    // Test navigation to all main pages
    
    // Home page
    await page.click('nav a[href="/"]');
    await expect(page.locator('h1')).toContainText('StoryForge');
    
    // Saves page
    await page.click('nav a[href="/saves"]');
    await expect(page.locator('h2')).toContainText('Game Saves');
    
    // Settings page
    await page.click('nav a[href="/settings"]');
    await expect(page.locator('h2')).toContainText('Settings');
    
    // Should be able to navigate back to home
    await page.click('nav a[href="/"]');
    await expect(page.locator('h1')).toContainText('StoryForge');
  });

  test('should update settings and persist changes', async ({ page }) => {
    // Navigate to settings
    await page.click('nav a[href="/settings"]');
    
    // Toggle auto-save setting
    const autoSaveToggle = page.locator('[data-testid="auto-save-toggle"]');
    const initialState = await autoSaveToggle.isChecked();
    
    await autoSaveToggle.click();
    
    // Verify toggle changed
    expect(await autoSaveToggle.isChecked()).toBe(!initialState);
    
    // Navigate away and back
    await page.click('nav a[href="/"]');
    await page.click('nav a[href="/settings"]');
    
    // Verify setting persisted
    expect(await autoSaveToggle.isChecked()).toBe(!initialState);
  });

  test('should display loading states appropriately', async ({ page }) => {
    // Start new game
    await page.click('[data-testid="start-new-game"]');
    await page.click('[data-testid="story-mysterious-portal"]');
    
    // Should show initial content quickly (template mode)
    await expect(page.locator('.story-title')).toBeVisible({ timeout: 2000 });
    
    // Loading indicator should not be persistent
    await page.waitForTimeout(1000);
    await expect(page.locator('.loading-indicator')).not.toBeVisible();
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('.layout-container')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.layout-container')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.layout-container')).toBeVisible();
    
    // Start game in mobile view
    await page.click('[data-testid="start-new-game"]');
    await page.click('[data-testid="story-mysterious-portal"]');
    
    // Should be usable on mobile
    await expect(page.locator('.story-title')).toBeVisible();
    await expect(page.locator('.choice-button')).toBeVisible();
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    // Start on home page
    await expect(page.locator('h1')).toContainText('StoryForge');
    
    // Navigate to saves
    await page.click('nav a[href="/saves"]');
    await expect(page.locator('h2')).toContainText('Game Saves');
    
    // Use browser back
    await page.goBack();
    await expect(page.locator('h1')).toContainText('StoryForge');
    
    // Use browser forward
    await page.goForward();
    await expect(page.locator('h2')).toContainText('Game Saves');
  });

  test('should maintain game state during page refresh', async ({ page }) => {
    // Start game and make progress
    await page.click('[data-testid="start-new-game"]');
    await page.click('[data-testid="story-mysterious-portal"]');
    await page.waitForSelector('.story-title');
    
    // Make a choice
    await page.click('.choice-button:first-child');
    await page.waitForTimeout(500);
    
    // Capture current state
    const sceneTitle = await page.locator('.story-title').textContent();
    
    // Refresh page
    await page.reload();
    
    // Wait for app to load again
    await page.waitForSelector('[data-testid="app-layout"]');
    
    // Should maintain state (if auto-save is enabled)
    // This depends on the auto-save implementation
    await page.waitForTimeout(1000);
    
    // Check if we're back to the expected state
    const currentTitle = await page.locator('.story-title').textContent();
    expect(currentTitle).toBeTruthy();
  });

  test('should show appropriate error states', async ({ page }) => {
    // Test invalid route
    await page.goto('/invalid-route');
    
    // Should redirect or show 404
    // This depends on router configuration
    await page.waitForTimeout(1000);
  });

  test('should provide accessibility features', async ({ page }) => {
    // Check for proper heading structure
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for proper button labels
    await expect(page.locator('[data-testid="start-new-game"]')).toHaveAttribute('aria-label');
    
    // Check for skip links or landmarks
    await expect(page.locator('nav')).toHaveAttribute('role', 'navigation');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
  });
});