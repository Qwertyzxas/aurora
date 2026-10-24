import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function open(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await expect(page.locator('#preloader')).toHaveCount(0, { timeout: 20_000 });
  return errors;
}

async function scrollToSection(page: Page, selector: string, extra = 0) {
  await page.evaluate(
    ([sel, offset]) => {
      const top = document.querySelector(sel as string)!.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top + (offset as number));
    },
    [selector, extra] as const,
  );
}

test.describe('desktop', () => {
  test('loads the 3D scene without errors', async ({ page }) => {
    const errors = await open(page);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Звук,\s*который видно/);
    await expect(page.locator('html')).not.toHaveClass(/no-webgl/);
    await expect(page.locator('#stage')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('reveals the callouts in the pinned exploded view', async ({ page }) => {
    await open(page);
    const first = page.locator('.callout').first();
    await expect(first).toHaveCSS('opacity', '0');
    await scrollToSection(page, '#inside', 900);
    await expect(first).toHaveCSS('opacity', '1');
    await expect(first.getByRole('heading')).toHaveText('96 светодиодов');
    // the dot is placed on the model (right half of the screen), not left at the default
    const dot = await first.locator('.callout__dot').boundingBox();
    expect(dot!.x).toBeGreaterThan(600);
  });

  test('switches light modes and fabric colours', async ({ page }) => {
    await open(page);
    // scroll there first, like a person would: letting Playwright auto-scroll into a pinned
    // section under smooth scrolling makes it wait for the button to stop moving
    await scrollToSection(page, '#light', 200);
    const sunset = page.getByRole('group', { name: 'Режим света' }).getByRole('button', { name: 'Закат' });
    await expect(sunset).toBeInViewport();
    await sunset.click();
    await expect(sunset).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#mode-description')).toContainText('Тёплый свет');

    await scrollToSection(page, '#colors');
    const sand = page.getByRole('group', { name: 'Цвет корпуса' }).getByRole('button', { name: 'Песок' });
    await expect(sand).toBeInViewport();
    await sand.click();
    await expect(sand).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#color-name')).toHaveText('Песок');
  });

  test('navigation scrolls to the section and moves focus', async ({ page }) => {
    await open(page);
    await page.getByRole('navigation', { name: 'Разделы' }).getByRole('link', { name: 'Характеристики' }).click();
    await expect(page.locator('#specs')).toBeFocused();
    await expect(page.locator('#specs')).toBeInViewport();
    await expect(page.locator('.spec__value').first()).toHaveText('38');
  });

  test('has no serious accessibility violations', async ({ page }) => {
    await open(page);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
});

test.describe('fallbacks', () => {
  test('respects prefers-reduced-motion with a static, fully readable page', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    await expect(page.locator('html')).toHaveClass(/reduced-motion/);
    // no pinning, no scroll-driven reveals: every callout is simply there
    const callouts = page.locator('.callout');
    await expect(callouts).toHaveCount(4);
    for (const callout of await callouts.all()) await expect(callout).toHaveCSS('opacity', '1');
    await expect(page.locator('.callout__line').first()).toBeHidden();
    await expect(page.locator('.pin-spacer')).toHaveCount(0);

    // the product stays on screen below the first section and glides between per-section
    // states (it isn't scrubbed by every pixel of scroll)
    const stage = page.locator('#stage');
    await expect(stage).toHaveCSS('position', 'fixed');
    const opacity = () => stage.evaluate((el) => Number(getComputedStyle(el).opacity));
    await scrollToSection(page, '#colors');
    await expect.poll(opacity, { timeout: 20_000 }).toBe(1);
    await scrollToSection(page, '#scenarios', 100);
    const right = await opacity();
    expect(right).toBeGreaterThan(0); // not an instant jump
    await expect.poll(opacity, { timeout: 20_000 }).toBe(0);
  });

  test('shows a static poster when WebGL is unavailable', async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (type.startsWith('webgl')) return null;
        return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof original;
    });
    const errors = await open(page);
    await expect(page.locator('html')).toHaveClass(/no-webgl/);
    await expect(page.locator('.poster')).toBeVisible();
    await expect(page.locator('#stage')).toBeHidden();
    await page.getByRole('button', { name: 'Песок' }).click();
    await expect(page.locator('#color-name')).toHaveText('Песок');
    expect(errors).toEqual([]);
  });

  test('works on a phone-sized screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
    await expect(page.getByRole('navigation', { name: 'Разделы' })).toBeHidden();
    await scrollToSection(page, '#inside', 900);
    await expect(page.locator('.callout__line').first()).toBeHidden();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);
  });
});
