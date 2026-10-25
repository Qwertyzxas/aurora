import type { SceneState } from '../scene/state';

export interface KeySpec {
  trigger: string;
  start: string;
  offset?: number;
  state: SceneState;
}

const base: SceneState = { x: 0, y: 0, scale: 1, rotY: 0, rotX: 0.15, explode: 0, glow: 0.6, opacity: 1 };
const at = (over: Partial<SceneState>): SceneState => ({ ...base, ...over });

export const HERO_STATE = at({ x: 0.42, y: -0.04, scale: 0.92, rotY: -0.5, rotX: 0.2, glow: 0.75 });
const CTA_STATE = at({ x: 0, y: 0.02, scale: 0.62, rotY: 6.9, rotX: 0.3, glow: 1.1, opacity: 0.3 });

export const KEYFRAMES: KeySpec[] = [
  { trigger: '#top', start: 'top top', state: HERO_STATE },
  { trigger: '#manifesto', start: 'top center', state: at({ x: -0.5, scale: 0.75, rotY: 0.7, opacity: 0.3, glow: 0.4 }) },
  { trigger: '#inside', start: 'top top', state: at({ x: 0.28, y: -0.14, scale: 0.8, rotY: 1.3, rotX: 0.3 }) },
  { trigger: '#inside', start: 'top top', offset: 0.55, state: at({ x: 0.28, y: -0.18, scale: 0.74, rotY: 1.7, rotX: 0.3, explode: 1, glow: 0.5 }) },
  { trigger: '#inside', start: 'top top', offset: 1.6, state: at({ x: 0.28, y: -0.18, scale: 0.74, rotY: 2.2, rotX: 0.3, explode: 1, glow: 0.5 }) },
  { trigger: '#light', start: 'top top', state: at({ x: 0.42, y: -0.06, scale: 0.95, rotY: 3, rotX: 0.55, glow: 1.3 }) },
  { trigger: '#light', start: 'top top', offset: 1, state: at({ x: 0.42, y: -0.06, scale: 0.95, rotY: 3.7, rotX: 0.55, glow: 1.5 }) },
  { trigger: '#scenarios', start: 'top 70%', state: at({ x: 0.42, rotY: 4, rotX: 0.4, glow: 1, opacity: 1 }) },
  { trigger: '#scenarios', start: 'top 20%', state: at({ x: 0.42, rotY: 4.2, rotX: 0.4, glow: 1, opacity: 0 }) },
  { trigger: '#colors', start: 'top 80%', state: at({ x: 0.45, scale: 0.9, rotY: 4.4, glow: 0.6, opacity: 0 }) },
  { trigger: '#colors', start: 'top 30%', state: at({ x: 0.45, scale: 0.9, rotY: 5, rotX: 0.12, glow: 0.6 }) },
  { trigger: '#specs', start: 'top center', state: at({ x: 0.75, y: 0.1, scale: 0.7, rotY: 5.8, opacity: 0.22, glow: 0.5 }) },
  { trigger: '#cta', start: 'top center', state: CTA_STATE },
  { trigger: '.footer', start: 'top bottom', state: CTA_STATE },
  { trigger: '.footer', start: 'top 70%', state: { ...CTA_STATE, opacity: 0 } },
];

export function stepKeyframes(): KeySpec[] {
  const last = new Map<string, KeySpec>();
  for (const key of KEYFRAMES) last.set(key.trigger, key);
  return [...last.values()].map((key) => ({ trigger: key.trigger, start: 'top center', state: key.state }));
}
