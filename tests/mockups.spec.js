import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const PAGES = [
  '/mockups/index.html',
  '/mockups/mobile-start/index.html',
  '/mockups/mobile-panorama/index.html',
  '/mockups/mobile-pivot/index.html',
  '/mockups/mobile-theme/index.html',
  '/mockups/desktop/index.html',
];

const project = (testInfo) => testInfo.project.name;

/* ── 1. static integrity: every page loads clean on every device type ── */
for (const path of PAGES) {
  test(`integrity: ${path}`, async ({ page }) => {
    const consoleErrors = [];
    const failedRequests = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('requestfailed', (r) => failedRequests.push(`${r.url()} (${r.failure()?.errorText})`));

    const res = await page.goto(path);
    expect(res.status()).toBe(200);
    await page.waitForLoadState('networkidle');
    expect(consoleErrors, 'no console errors').toEqual([]);
    expect(failedRequests, 'no failed asset requests (fonts/css/images)').toEqual([]);

    // no horizontal overflow at this device width (classic mobile layout bug)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, 'no horizontal overflow').toBeLessThanOrEqual(1);

    // Selawik webfont is actually loaded and usable
    const selawik = await page.evaluate(async () => {
      await document.fonts.ready;
      return document.fonts.check('16px Selawik');
    });
    expect(selawik, 'Selawik webfont loads').toBe(true);
  });
}

/* ── 2. start screen (touch devices) ── */
test.describe('start screen', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(project(testInfo) === 'desktop', 'phone-centric flow');
    await page.goto('/mockups/mobile-start/index.html');
  });

  test('renders six tiles with a live status-bar clock', async ({ page }) => {
    await expect(page.locator('.tile')).toHaveCount(6);
    await expect(page.locator('#clock')).toHaveText(/^\d{1,2}:\d{2}$/);
  });

  test('wide about tile spans both columns', async ({ page }) => {
    const span = await page.locator('.tile.wide').evaluate((el) => getComputedStyle(el).gridColumn);
    expect(span).toContain('span 2');
  });

  test('ellipsis opens the app-bar overflow menu', async ({ page }) => {
    await page.locator('.ab-more').click();
    await expect(page.locator('.ab-menu')).toBeVisible();
    await expect(page.locator('.ab-menu .mi').first()).toContainText('theme');
  });

  test('work tile navigates to the pivot page', async ({ page }) => {
    await page.locator('.tile', { hasText: 'work' }).click();
    await expect(page).toHaveURL(/mobile-pivot\/index\.html$/);
  });
});

/* ── 3. panorama: overflow, peeking sections, parallax, reduced motion ── */
test.describe('panorama', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(project(testInfo) === 'desktop', 'touch layout');
    await page.goto('/mockups/mobile-panorama/index.html');
  });

  test('is horizontally scrollable with the next section peeking', async ({ page }) => {
    const pano = page.locator('.pano');
    expect(await pano.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);

    const first = await page.locator('.psec').nth(0).boundingBox();
    const second = await page.locator('.psec').nth(1).boundingBox();
    expect(second.x).toBeLessThanOrEqual(first.x + first.width); // already on-screen: invites the swipe
    expect(second.x + second.width).toBeGreaterThan(first.x + first.width); // continues past the frame
  });

  test('parallax layers move on scroll (bg slower than content)', async ({ page }) => {
    const pano = page.locator('.pano');
    await pano.evaluate((el) => el.scrollTo({ left: 300, behavior: 'instant' }));
    await page.waitForFunction(() => {
      const v = document.querySelector('.pano').style.getPropertyValue('--px');
      return parseFloat(v) > 0;
    });

    const px = parseFloat(await pano.evaluate((el) => el.style.getPropertyValue('--px')));
    const bgX = await page.locator('.pano-bg').evaluate((el) => getComputedStyle(el).transform);
    const titleX = await page.locator('.pano-title').evaluate((el) => getComputedStyle(el).transform);
    expect(px).toBeGreaterThan(0);
    expect(bgX).not.toBe('none');
    expect(titleX).not.toBe('none');
    expect(bgX).not.toBe(titleX); // different layer rates
  });

  test('status clock and section titles are lowercase', async ({ page }) => {
    const titles = await page.locator('.psec h2').allTextContents();
    for (const t of titles) expect(t).toBe(t.toLowerCase());
  });

  test.describe('prefers-reduced-motion', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });
    test('disables parallax and snapping', async ({ page }) => {
      const pano = page.locator('.pano');
      await pano.evaluate((el) => el.scrollTo({ left: 300, behavior: 'instant' }));
      await page.waitForTimeout(50);
      expect(await page.locator('.pano-bg').evaluate((el) => getComputedStyle(el).transform)).toBe('none');
      expect(await pano.evaluate((el) => getComputedStyle(el).scrollSnapType)).toBe('none');
    });
  });
});

/* ── 4. pivot: three sibling pages, swipeable ── */
test('pivot swipes between three sibling pages', async ({ page }, testInfo) => {
  test.skip(project(testInfo) === 'desktop', 'touch layout');
  await page.goto('/mockups/mobile-pivot/index.html');
  await expect(page.locator('.ppage')).toHaveCount(3);
  const pivot = page.locator('.pivot');
  expect(await pivot.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  await pivot.evaluate((el) => el.scrollTo({ left: 600, behavior: 'instant' }));
  await page.waitForFunction(() => document.querySelector('.pivot').scrollLeft > 100);
});

/* ── 5. theme & accent: instant apply + persistence across pages ── */
test('accent + light theme apply instantly and persist across pages', async ({ page }, testInfo) => {
  test.skip(project(testInfo) === 'desktop', 'touch layout');
  await page.goto('/mockups/mobile-theme/index.html');

  await page.locator('.swatch[title^="lime"]').click();
  await expect.poll(() =>
    page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase())
  ).toBe('#8cbf26');

  await page.locator('#c-light').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('.device')).toHaveCSS('background-color', 'rgb(255, 255, 255)');

  // persistence: the personal theme follows to the start screen (localStorage)
  await page.goto('/mockups/mobile-start/index.html');
  const accent = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().toLowerCase()
  );
  expect(accent).toBe('#8cbf26');
  await expect(page.locator('.tile').nth(1)).toHaveCSS('background-color', 'rgb(140, 191, 38)');
});

/* ── 6. desktop swiss grid ── */
test.describe('desktop swiss', () => {
  test('four numbered sections, anchor nav scrolls into place', async ({ page }, testInfo) => {
    test.skip(project(testInfo) === 'mobile', 'desktop-first layout');
    await page.goto('/mockups/desktop/index.html');
    await expect(page.locator('.num')).toHaveCount(4);
    await page.locator('a[href="#work"]').click();
    await expect(page).toHaveURL(/#work$/);
    const top = await page.locator('#work').evaluate((el) => el.getBoundingClientRect().top);
    expect(Math.abs(top)).toBeLessThan(140); // under the sticky header
  });

  test('hero stacks (photo above text) below the 900px breakpoint', async ({ page }, testInfo) => {
    test.skip(project(testInfo) === 'mobile', 'explicit viewport set here');
    await page.setViewportSize({ width: 760, height: 900 });
    await page.goto('/mockups/desktop/index.html');
    const text = await page.locator('.hero-text').boundingBox();
    const photo = await page.locator('.hero-photo').boundingBox();
    expect(photo.y).toBeLessThan(text.y);
  });
});

/* ── 7. screenshot artifacts for PR review (one per device type) ── */
test('capture review screenshots', async ({ page }, testInfo) => {
  const pj = project(testInfo);
  const shots = {
    desktop: [
      ['/mockups/desktop/index.html', 'swiss-home', true],
      ['/mockups/index.html', 'hub', false],
    ],
    tablet: [['/mockups/desktop/index.html', 'swiss-tablet', true]],
    mobile: [
      ['/mockups/mobile-start/index.html', 'start', false],
      ['/mockups/mobile-panorama/index.html', 'panorama', false],
      ['/mockups/mobile-pivot/index.html', 'pivot', false],
      ['/mockups/mobile-theme/index.html', 'theme', false],
    ],
  };
  mkdirSync('tests/screenshots', { recursive: true });
  for (const [url, name, fullPage] of shots[pj] || []) {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `tests/screenshots/${pj}-${name}.png`, fullPage });
  }
});

test('capture interaction-state screenshots', async ({ page }, testInfo) => {
  test.skip(project(testInfo) !== 'mobile', 'mobile artifacts only');
  mkdirSync('tests/screenshots', { recursive: true });

  // panorama mid-swipe: parallax layers separated, next section visible
  await page.goto('/mockups/mobile-panorama/index.html');
  await page.locator('.pano').evaluate((el) => el.scrollTo({ left: el.clientWidth * 0.9, behavior: 'instant' }));
  await page.waitForFunction(() => document.querySelector('.pano').scrollLeft > 100);
  await page.screenshot({ path: 'tests/screenshots/mobile-panorama-scrolled.png' });

  // light theme + teal accent, applied live
  await page.goto('/mockups/mobile-theme/index.html');
  await page.locator('.swatch[title^="teal"]').click();
  await page.locator('#c-light').click();
  await page.waitForTimeout(60);
  await page.screenshot({ path: 'tests/screenshots/mobile-theme-light-teal.png' });
});
