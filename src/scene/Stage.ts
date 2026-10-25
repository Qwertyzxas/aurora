import {
  ACESFilmicToneMapping,
  Color,
  DirectionalLight,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { AnchorId } from '../content';
import { Speaker } from './Speaker';
import { dampState, type SceneState } from './state';

const FOV = 30;
const CAMERA_Z = 9;
const MODEL_HEIGHT = 2;

export interface ScreenPoint {
  x: number;
  y: number;
}

export class Stage {
  readonly speaker = new Speaker();
  target: SceneState;
  private current: SceneState;

  private readonly renderer: WebGLRenderer;
  private readonly composer: EffectComposer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
  private readonly rimA = new PointLight('#2affc6', 30, 0, 2);
  private readonly rimB = new PointLight('#b45cff', 30, 0, 2);
  private readonly pointer = new Vector2();
  private readonly pointerSmooth = new Vector2();
  private readonly tmp = new Vector3();
  private baseScale = 1;
  private halfWidth = 1;
  private halfHeight = 1;
  private narrow = false;
  private lastTime = 0;
  private frameListeners: (() => void)[] = [];

  constructor(
    private readonly canvas: HTMLCanvasElement,
    initial: SceneState,
    private readonly options: { reducedMotion: boolean },
  ) {
    this.target = { ...initial };
    this.current = { ...initial };

    this.renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene.background = new Color('#06070b');
    const pmrem = new PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.22;

    const key = new DirectionalLight('#ffffff', 2.6);
    key.position.set(5, 3.5, 4);
    const fill = new DirectionalLight('#9fb4ff', 0.35);
    fill.position.set(-5, 1, 4);
    this.rimA.position.set(-4, 2, -2.5);
    this.rimB.position.set(4, -1, -2.5);
    this.scene.add(key, fill, this.rimA, this.rimB, this.speaker.root, this.speaker.backdrop);

    this.camera.position.set(0, 0.6, CAMERA_Z);
    this.camera.lookAt(0, 0, 0);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(new UnrealBloomPass(new Vector2(256, 256), 0.7, 0.5, 0.9));
    this.composer.addPass(new OutputPass());

    window.addEventListener('resize', () => this.resize());
    if (!options.reducedMotion) {
      window.addEventListener('pointermove', (e) => {
        this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
      });
    }
    this.resize();
  }

  warmUp() {
    this.speaker.setExplode(0.5);
    this.renderer.compile(this.scene, this.camera);
    this.apply(this.current, 0);
    this.composer.render();
  }

  start() {
    this.renderer.setAnimationLoop((time) => this.tick(time / 1000));
  }

  onFrame(listener: () => void) {
    this.frameListeners.push(listener);
  }

  setRimColors(a: Color, b: Color) {
    this.rimA.color.copy(a);
    this.rimB.color.copy(b);
  }

  project(anchor: AnchorId): ScreenPoint {
    this.speaker.anchors[anchor].getWorldPosition(this.tmp).project(this.camera);
    const rect = this.canvas.getBoundingClientRect();
    return { x: (this.tmp.x * 0.5 + 0.5) * rect.width, y: (-this.tmp.y * 0.5 + 0.5) * rect.height };
  }

  get isNarrow() {
    return this.narrow;
  }

  private resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.halfHeight = Math.tan(((FOV / 2) * Math.PI) / 180) * CAMERA_Z;
    this.halfWidth = this.halfHeight * this.camera.aspect;
    this.narrow = this.camera.aspect < 0.9;
    this.baseScale = Math.min((this.halfHeight * 2 * 0.56) / MODEL_HEIGHT, (this.halfWidth * 2 * 0.62) / MODEL_HEIGHT);
  }

  private apply(s: SceneState, time: number) {
    const root = this.speaker.root;
    const xFactor = this.narrow ? 0 : 1;
    const yShift = this.narrow ? -0.56 : 0;
    root.position.set(s.x * this.halfWidth * xFactor, (s.y + yShift) * this.halfHeight, 0);
    root.scale.setScalar(this.baseScale * s.scale * (this.narrow ? 0.72 : 1));
    const idle = this.options.reducedMotion ? 0 : Math.sin(time * 0.6) * 0.04;
    root.rotation.set(s.rotX + this.pointerSmooth.y * 0.12, s.rotY + this.pointerSmooth.x * 0.25, idle * 0.3);
    root.position.y += idle * 0.3;
    this.speaker.setExplode(s.explode);
    this.speaker.setGlow(s.glow);
  }

  private tick(time: number) {
    const dt = this.lastTime ? Math.min(time - this.lastTime, 0.1) : 0.016;
    this.lastTime = time;
    this.current = dampState(this.current, this.target, this.options.reducedMotion ? 3 : 5, dt);
    this.pointerSmooth.lerp(this.pointer, 1 - Math.exp(-3 * dt));

    this.canvas.style.opacity = String(this.current.opacity);
    if (this.current.opacity < 0.01) return;
    this.speaker.update(time);
    this.apply(this.current, time);
    this.composer.render(dt);
    for (const listener of this.frameListeners) listener();
  }
}
