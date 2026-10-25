import gsap from 'gsap';
import type Lenis from 'lenis';
import { Color } from 'three';
import { COLORS, LIGHT_MODES, type ColorVariant, type LightMode } from '../content';
import { $ } from '../dom/render';
import type { Stage } from '../scene/Stage';

function pressOnly(group: HTMLElement, active: HTMLElement) {
  for (const button of group.querySelectorAll('button')) button.setAttribute('aria-pressed', String(button === active));
}

/** Tween a three.js Color towards a hex value. */
const tweenColor = (color: Color, hex: string, duration: number) => {
  const to = new Color(hex);
  return gsap.to(color, { r: to.r, g: to.g, b: to.b, duration, ease: 'power2.out' });
};

export function setupLightModes(stage: Stage | null, duration: number) {
  const group = $('#modes');
  const description = $('#mode-description');
  const apply = (mode: LightMode, animate: boolean) => {
    description.textContent = `${mode.name}: ${mode.description}`;
    if (!stage) return;
    const d = animate ? duration : 0;
    stage.speaker.palette.forEach((color, i) => tweenColor(color, mode.colors[i]!, d));
    const rims = [new Color(mode.colors[0]), new Color(mode.colors[2])] as const;
    stage.setRimColors(rims[0], rims[1]);
  };
  group.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>('[data-mode]');
    const mode = button && LIGHT_MODES.find((m) => m.id === button.dataset.mode);
    if (!button || !mode) return;
    pressOnly(group, button);
    apply(mode, true);
  });
  apply(LIGHT_MODES[0]!, false);
}

export function setupColors(stage: Stage | null, duration: number) {
  const group = $('#swatches');
  const name = $('#color-name');
  const description = $('#color-description');
  const apply = (variant: ColorVariant, animate: boolean) => {
    name.textContent = variant.name;
    description.textContent = variant.description;
    document.documentElement.style.setProperty('--variant', variant.swatch);
    if (!stage) return;
    const d = animate ? duration : 0;
    tweenColor(stage.speaker.fabric.color, variant.fabric, d);
    tweenColor(stage.speaker.fabric.sheen, variant.sheen, d);
  };
  group.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>('[data-color]');
    const variant = button && COLORS.find((c) => c.id === button.dataset.color);
    if (!button || !variant) return;
    pressOnly(group, button);
    apply(variant, true);
  });
  apply(COLORS[0]!, false);
}

/** In-page links scroll smoothly and move focus for keyboard and screen-reader users. */
export function setupAnchors(lenis: Lenis | null) {
  document.addEventListener('click', (event) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    const id = link?.getAttribute('href');
    if (!link || !id || id === '#') return;
    const target = document.querySelector<HTMLElement>(id);
    if (!target) return;
    event.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.4 });
    else target.scrollIntoView();
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    history.replaceState(null, '', id);
  });
}

/** Once the page leaves the hero, the fixed nav gets a backdrop so headings don't run through it. */
export function setupNavBackdrop() {
  const nav = $('.nav');
  const update = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/** Dot cursor with a lagging ring; magnetic buttons pull towards the pointer. */
export function setupPointerEffects() {
  if (!matchMedia('(pointer: fine)').matches) return;
  document.documentElement.classList.add('has-cursor');
  const cursor = $('.cursor');
  const x = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
  const y = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
  window.addEventListener('pointermove', (e) => {
    x(e.clientX);
    y(e.clientY);
    cursor.classList.add('is-visible');
    const interactive = (e.target as HTMLElement).closest('a, button, [role="button"]');
    cursor.classList.toggle('is-active', !!interactive);
  });
  document.documentElement.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
  document.documentElement.addEventListener('pointerenter', () => cursor.classList.remove('is-hidden'));

  for (const button of document.querySelectorAll<HTMLElement>('.magnetic')) {
    const bx = gsap.quickTo(button, 'x', { duration: 0.4, ease: 'power3' });
    const by = gsap.quickTo(button, 'y', { duration: 0.4, ease: 'power3' });
    button.addEventListener('pointermove', (e) => {
      const r = button.getBoundingClientRect();
      bx((e.clientX - (r.left + r.width / 2)) * 0.3);
      by((e.clientY - (r.top + r.height / 2)) * 0.3);
    });
    button.addEventListener('pointerleave', () => {
      bx(0);
      by(0);
    });
  }
}
