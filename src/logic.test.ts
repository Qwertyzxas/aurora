import { describe, expect, it } from 'vitest';
import { CALLOUTS, COLORS, LIGHT_MODES, SPECS } from './content';
import { formatNumber, hexToRgb } from './lib/format';
import { ANCHOR_IDS } from './scene/anchors';
import { damp, dampState, sceneAt, type Keyframe, type SceneState } from './scene/state';

const s = (over: Partial<SceneState>): SceneState => ({ x: 0, y: 0, scale: 1, rotY: 0, rotX: 0, explode: 0, glow: 0, opacity: 1, ...over });

describe('sceneAt', () => {
  const frames: Keyframe[] = [
    { at: 0, state: s({ x: 0 }) },
    { at: 100, state: s({ x: 1, explode: 1 }) },
    { at: 300, state: s({ x: -1, explode: 0 }) },
  ];

  it('clamps before the first and after the last keyframe', () => {
    expect(sceneAt(frames, -50).x).toBe(0);
    expect(sceneAt(frames, 999).x).toBe(-1);
  });

  it('eases between neighbouring keyframes', () => {
    expect(sceneAt(frames, 50).x).toBeCloseTo(0.5);
    expect(sceneAt(frames, 25).x).toBeCloseTo(0.125); // ease-in at the start of a segment
    expect(sceneAt(frames, 200)).toMatchObject({ x: expect.closeTo(0, 5), explode: expect.closeTo(0.5, 5) });
  });

  it('is a pure function of scroll (scrubbing back gives the same state)', () => {
    expect(sceneAt(frames, 140)).toEqual(sceneAt(frames, 140));
  });

  it('handles keyframes at the same position', () => {
    const jump: Keyframe[] = [
      { at: 0, state: s({ x: 0 }) },
      { at: 0, state: s({ x: 1 }) },
    ];
    expect(sceneAt(jump, 0).x).toBe(0);
    expect(sceneAt(jump, 1).x).toBe(1);
  });
});

describe('damp', () => {
  it('converges independently of frame rate', () => {
    let a = 0;
    for (let i = 0; i < 60; i++) a = damp(a, 1, 5, 1 / 60);
    let b = 0;
    for (let i = 0; i < 30; i++) b = damp(b, 1, 5, 1 / 30);
    expect(a).toBeCloseTo(b, 10);
    expect(a).toBeCloseTo(1 - Math.exp(-5), 10);
  });

  it('smooths every field of the scene state', () => {
    const next = dampState(s({ x: 0, glow: 0 }), s({ x: 1, glow: 1 }), 1000, 1);
    expect(next.x).toBeCloseTo(1);
    expect(next.glow).toBeCloseTo(1);
  });
});

describe('format', () => {
  const plain = (v: string) => v.replace(/[  ]/g, ' ');
  it('formats counters the Russian way', () => {
    expect(plain(formatNumber(16777216))).toBe('16 777 216');
    expect(formatNumber(1.4, 1)).toBe('1,4');
  });

  it('parses hex colours', () => {
    expect(hexToRgb('#ff8000')).toEqual([1, 128 / 255, 0]);
    expect(() => hexToRgb('red')).toThrow();
  });
});

describe('content', () => {
  it('attaches every callout to an existing model anchor', () => {
    for (const c of CALLOUTS) expect(ANCHOR_IDS).toContain(c.anchor);
  });

  it('uses valid colours and unique ids', () => {
    for (const m of LIGHT_MODES) m.colors.forEach((c) => expect(() => hexToRgb(c)).not.toThrow());
    for (const c of COLORS) [c.fabric, c.sheen, c.swatch].forEach((x) => expect(() => hexToRgb(x)).not.toThrow());
    expect(new Set(COLORS.map((c) => c.id)).size).toBe(COLORS.length);
    expect(new Set(LIGHT_MODES.map((m) => m.id)).size).toBe(LIGHT_MODES.length);
    expect(SPECS.every((spec) => spec.value > 0)).toBe(true);
  });
});
