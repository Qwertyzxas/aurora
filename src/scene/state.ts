/**
 * Everything the 3D scene needs to know about the page at a given scroll
 * position. Animated purely as a function of scroll, so it is testable and
 * scrubbing backwards always gives exactly the same picture.
 */
export interface SceneState {
  /** horizontal placement, -1 … 1 of the visible half-width */
  x: number;
  /** vertical placement, -1 … 1 of the visible half-height */
  y: number;
  scale: number;
  rotY: number;
  rotX: number;
  /** 0 — assembled, 1 — fully exploded view */
  explode: number;
  /** light ring brightness */
  glow: number;
  /** canvas visibility (hidden behind the horizontal gallery) */
  opacity: number;
}

export interface Keyframe {
  /** scroll position in px */
  at: number;
  state: SceneState;
}

export const KEYS = ['x', 'y', 'scale', 'rotY', 'rotX', 'explode', 'glow', 'opacity'] as const;

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Piecewise interpolation between keyframes (sorted by `at`), eased per segment. */
export function sceneAt(frames: Keyframe[], scroll: number): SceneState {
  if (!frames.length) throw new Error('sceneAt needs at least one keyframe');
  if (scroll <= frames[0]!.at) return { ...frames[0]!.state };
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1]!;
    const b = frames[i]!;
    if (scroll <= b.at) {
      const span = b.at - a.at;
      const t = span > 0 ? easeInOut((scroll - a.at) / span) : 1;
      const out = {} as SceneState;
      for (const k of KEYS) out[k] = a.state[k] + (b.state[k] - a.state[k]) * t;
      return out;
    }
  }
  return { ...frames.at(-1)!.state };
}

/**
 * Reduced-motion variant: no interpolation, the scene simply shows the state of the
 * section being read (the last keyframe at or before `scroll`).
 */
export function sceneStep(frames: Keyframe[], scroll: number): SceneState {
  if (!frames.length) throw new Error('sceneStep needs at least one keyframe');
  let current = frames[0]!;
  for (const frame of frames) {
    if (frame.at > scroll) break;
    current = frame;
  }
  return { ...current.state };
}

/**
 * Frame-rate independent exponential smoothing: the current value covers the
 * same share of the distance per second whatever the FPS.
 */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return target + (current - target) * Math.exp(-lambda * dt);
}

export function dampState(current: SceneState, target: SceneState, lambda: number, dt: number): SceneState {
  const out = {} as SceneState;
  for (const k of KEYS) out[k] = damp(current[k], target[k], lambda, dt);
  return out;
}
