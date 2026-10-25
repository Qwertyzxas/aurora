import '@fontsource-variable/inter';
import '@fontsource-variable/unbounded';
import './styles.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { HERO_STATE } from './anim/keyframes';
import { connectLenis, driveScene, heroIntro, scrollAnimations } from './anim/scroll';
import { $, renderContent } from './dom/render';
import { Stage } from './scene/Stage';
import { setupAnchors, setupColors, setupLightModes, setupNavBackdrop, setupPointerEffects } from './ui/interactions';
import { fitWordmark } from './ui/wordmark';

const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
root.classList.toggle('reduced-motion', reducedMotion);

function hasWebGL() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

function progress(value: number) {
  const out = $('#preloader-value');
  const bar = $('#preloader-bar');
  const from = { v: Number(out.textContent) };
  return gsap.to(from, {
    v: value,
    duration: reducedMotion ? 0 : 0.5,
    ease: 'power2.out',
    onUpdate: () => {
      out.textContent = String(Math.round(from.v));
      bar.style.transform = `scaleX(${from.v / 100})`;
    },
  });
}

async function start() {
  renderContent();
  fitWordmark();
  const startedAt = performance.now();

  let stage: Stage | null = null;
  if (hasWebGL()) {
    try {
      stage = new Stage($<HTMLCanvasElement>('#stage'), HERO_STATE, { reducedMotion });
    } catch (error) {
      console.warn('Aurora: WebGL is unavailable, showing the static poster', error);
    }
  }
  root.classList.toggle('no-webgl', !stage);

  await progress(35);
  await document.fonts.ready;
  await progress(70);
  stage?.warmUp();
  await progress(100);
  const elapsed = performance.now() - startedAt;
  if (!reducedMotion && elapsed < 900) await new Promise((r) => setTimeout(r, 900 - elapsed));

  const durations = reducedMotion ? 0 : 1.2;
  setupLightModes(stage, durations);
  setupColors(stage, durations);

  let lenis: Lenis | null = null;
  if (!reducedMotion) {
    lenis = new Lenis({ autoRaf: false, lerp: 0.09 });
    connectLenis(lenis);
    scrollAnimations(stage);
    setupPointerEffects();
  }
  if (stage) driveScene(stage, reducedMotion);
  setupAnchors(lenis);
  setupNavBackdrop();
  stage?.start();

  const preloader = $('#preloader');
  if (reducedMotion) {
    preloader.remove();
  } else {
    gsap
      .timeline()
      .to(preloader, { yPercent: -100, duration: 1, ease: 'expo.inOut', onComplete: () => preloader.remove() })
      .add(heroIntro(), '-=0.45');
  }
  root.classList.add('is-ready');
  ScrollTrigger.refresh();
}

void start();
