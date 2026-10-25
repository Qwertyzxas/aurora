export interface SceneState {
  x: number;
  y: number;
  scale: number;
  rotY: number;
  rotX: number;
  explode: number;
  glow: number;
  opacity: number;
}

export interface Keyframe {
  at: number;
  state: SceneState;
}

export const KEYS = ['x', 'y', 'scale', 'rotY', 'rotX', 'explode', 'glow', 'opacity'] as const;

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

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

export function sceneStep(frames: Keyframe[], scroll: number): SceneState {
  if (!frames.length) throw new Error('sceneStep needs at least one keyframe');
  let current = frames[0]!;
  for (const frame of frames) {
    if (frame.at > scroll) break;
    current = frame;
  }
  return { ...current.state };
}

export function damp(current: number, target: number, lambda: number, dt: number): number {
  const next = target + (current - target) * Math.exp(-lambda * dt);
  return Math.abs(next - target) < 1e-4 ? target : next;
}

export function dampState(current: SceneState, target: SceneState, lambda: number, dt: number): SceneState {
  const out = {} as SceneState;
  for (const k of KEYS) out[k] = damp(current[k], target[k], lambda, dt);
  return out;
}
