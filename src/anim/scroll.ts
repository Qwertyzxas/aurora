import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import type Lenis from 'lenis';
import { formatNumber } from '../lib/format';
import { $ } from '../dom/render';
import type { Stage } from '../scene/Stage';
import { sceneAt, sceneStep, type Keyframe } from '../scene/state';
import type { AnchorId } from '../content';
import { KEYFRAMES, stepKeyframes } from './keyframes';

gsap.registerPlugin(ScrollTrigger, SplitText);

export function connectLenis(lenis: Lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

export function driveScene(stage: Stage, reducedMotion: boolean) {
  const keys = reducedMotion ? stepKeyframes() : KEYFRAMES;
  const evaluate = reducedMotion ? sceneStep : sceneAt;
  const triggers = keys.map((key) => ScrollTrigger.create({ trigger: key.trigger, start: key.start }));
  let frames: Keyframe[] = [];
  const resolve = () => {
    frames = keys.map((key, i) => ({ at: triggers[i]!.start + (key.offset ?? 0) * window.innerHeight, state: key.state })).sort(
      (a, b) => a.at - b.at,
    );
  };
  ScrollTrigger.addEventListener('refresh', resolve);
  resolve();
  gsap.ticker.add(() => {
    stage.target = evaluate(frames, window.scrollY);
  });
}

export function heroIntro() {
  const split = SplitText.create('[data-split]', { type: 'chars, lines', mask: 'lines' });
  return gsap
    .timeline()
    .from(split.chars, { yPercent: 115, rotate: 6, duration: 1.1, ease: 'expo.out', stagger: 0.025 })
    .from('[data-intro]', { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 }, '-=0.8');
}

export function scrollAnimations(stage: Stage | null) {
  const words = SplitText.create('[data-words]', { type: 'words', aria: 'hidden' }).words;
  gsap.fromTo(
    words,
    { color: '#7a8096' },
    {
      color: '#f2f4fa',
      stagger: 0.1,
      ease: 'none',
      scrollTrigger: { trigger: '#manifesto', start: 'top 75%', end: 'bottom 55%', scrub: true },
    },
  );

  for (const heading of document.querySelectorAll<HTMLElement>('[data-reveal], .section-head h2')) {
    const lines = SplitText.create(heading, { type: 'lines', mask: 'lines' }).lines;
    gsap.from(lines, {
      yPercent: 110,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: { trigger: heading, start: 'top 85%', toggleActions: 'play none none reverse' },
    });
  }

  const callouts = gsap.utils.toArray<HTMLElement>('.callout');
  const inside = gsap.timeline({
    scrollTrigger: { trigger: '#inside', start: 'top top', end: '+=200%', pin: '.inside__pin', scrub: 0.6 },
  });
  inside.to({}, { duration: 0.3 });
  callouts.forEach((callout, i) => {
    const at = 0.3 + i * 0.12;
    const card = callout.querySelector('.callout__card')!;
    inside.fromTo(callout, { opacity: 0 }, { opacity: 1, duration: 0.18 }, at);
    inside.fromTo(card, { x: -30 }, { x: 0, duration: 0.18 }, at);
  });
  inside.to(callouts, { opacity: 0, duration: 0.12 }, 0.9);

  if (stage) {
    const placed = callouts.map((el) => ({
      el,
      card: el.querySelector<HTMLElement>('.callout__card')!,
      anchor: el.dataset.anchor as AnchorId,
    }));
    let active = false;
    ScrollTrigger.create({ trigger: '#inside', start: 'top bottom', end: 'bottom top', onToggle: (self) => (active = self.isActive) });
    const pin = $('.inside__pin');
    stage.onFrame(() => {
      if (!active || stage.isNarrow) return;
      const origin = pin.getBoundingClientRect();
      for (const { el, card, anchor } of placed) {
        const projected = stage.project(anchor);
        const p = { x: projected.x - origin.left, y: projected.y - origin.top };
        const r = card.getBoundingClientRect();
        const fromX = r.right + 12 - origin.left;
        const fromY = r.top + r.height / 2 - origin.top;
        const dx = p.x - fromX;
        const dy = p.y - fromY;
        el.style.setProperty('--ax', `${p.x}px`);
        el.style.setProperty('--ay', `${p.y}px`);
        el.style.setProperty('--lx', `${fromX}px`);
        el.style.setProperty('--ly', `${fromY}px`);
        el.style.setProperty('--len', `${Math.max(0, Math.hypot(dx, dy) - 10)}px`);
        el.style.setProperty('--angle', `${Math.atan2(dy, dx)}rad`);
      }
    });
  }

  const counter = $('#light-counter');
  const state = { value: 0 };
  gsap.to(state, {
    value: 16_777_216,
    ease: 'power1.in',
    scrollTrigger: { trigger: '#light', start: 'top top', end: '+=100%', pin: '.light__pin', scrub: 0.4 },
    onUpdate: () => {
      counter.textContent = formatNumber(Math.round(state.value));
    },
  });

  const track = $('#scenarios-track');
  const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 48);
  gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: '#scenarios',
      start: 'top top',
      end: () => `+=${distance()}`,
      pin: '.scenarios__pin',
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
  });

  for (const value of document.querySelectorAll<HTMLElement>('.spec__value')) {
    const target = Number(value.dataset.value);
    const decimals = Number(value.dataset.decimals);
    const proxy = { v: 0 };
    gsap.to(proxy, {
      v: target,
      duration: 1.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: value, start: 'top 90%', once: true },
      onUpdate: () => {
        value.textContent = formatNumber(proxy.v, decimals);
      },
    });
  }
}
