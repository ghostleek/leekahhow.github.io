import { test, expect } from '@playwright/test';

const project = (t) => t.project.name;

test.describe('WP7 motion', () => {
  test.describe('full motion', () => {
    test('turnstile entrance animation plays on phone pages', async ({ page }, testInfo) => {
      test.skip(project(testInfo) === 'desktop', 'phone pages only');
      await page.goto('/mockups/mobile-pivot/index.html');
      const anim = await page.locator('.device').evaluate((el) => getComputedStyle(el).animationName);
      expect(anim).toContain('turnstile-in');
    });

    test('tilt applies a 3d transform toward the press point', async ({ page }, testInfo) => {
      test.skip(project(testInfo) === 'desktop', 'touch layout');
      await page.goto('/mockups/mobile-start/index.html');
      const tile = page.locator('.tile').first();
      const box = await tile.boundingBox();
      await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.15);
      await page.mouse.down();
      await expect
        .poll(() => tile.evaluate((el) => getComputedStyle(el).transform))
        .not.toBe('none');
      expect(await tile.evaluate((el) => el.classList.contains('tilted'))).toBe(true);
      await page.mouse.up();
      await expect
        .poll(() => tile.evaluate((el) => el.classList.contains('tilted')))
        .toBe(false);
    });

    test('tile tap plays the launch animation before navigating', async ({ page }, testInfo) => {
      test.skip(project(testInfo) === 'desktop', 'touch layout');
      await page.goto('/mockups/mobile-start/index.html');
      await page.locator('.tile', { hasText: 'work' }).click({ noWaitAfter: true });
      await expect(page.locator('body')).toHaveClass(/launching/);
      await expect(page.locator('.tile', { hasText: 'work' })).toHaveClass(/launched/);
      await expect(page).toHaveURL(/mobile-pivot\/index\.html$/, { timeout: 5000 });
    });

    test('pivot headers slide at half the content rate', async ({ page }, testInfo) => {
      test.skip(project(testInfo) === 'desktop', 'touch layout');
      await page.goto('/mockups/mobile-pivot/index.html');
      const pivot = page.locator('.pivot');
      const before = await page.locator('.pivhead .ph').first()
        .evaluate((el) => getComputedStyle(el).transform);
      await pivot.evaluate((el) => el.scrollTo({ left: 300, behavior: 'instant' }));
      await expect
        .poll(() => page.locator('.pivhead .ph').first()
          .evaluate((el) => getComputedStyle(el).transform))
        .not.toBe(before);
    });

    test('app-bar link plays the turnstile exit before navigating', async ({ page }, testInfo) => {
      test.skip(project(testInfo) === 'desktop', 'touch layout');
      await page.goto('/mockups/mobile-pivot/index.html');
      await page.locator('.appbar a[href*="mobile-start"]').first().click({ noWaitAfter: true });
      await expect(page.locator('body')).toHaveClass(/turning-out/);
      await expect(page).toHaveURL(/mobile-start\/index\.html$/, { timeout: 5000 });
    });
  });

  test.describe('prefers-reduced-motion', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });

    test('all motion is suppressed and navigation is instant', async ({ page }, testInfo) => {
      test.skip(project(testInfo) === 'desktop', 'phone pages only');
      await page.goto('/mockups/mobile-pivot/index.html');
      expect(await page.locator('.device').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');

      await page.goto('/mockups/mobile-start/index.html');
      await page.locator('.tile', { hasText: 'work' }).click({ noWaitAfter: true });
      await expect(page.locator('body')).not.toHaveClass(/launching/);
      await expect(page).toHaveURL(/mobile-pivot\/index\.html$/, { timeout: 5000 });
    });
  });
});
