import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector2,
} from 'three';
import type { AnchorId } from '../content';
import { backdropShader, ringShader } from './shaders';
import { knitNormalMap } from './textures';

function shellProfile(): Vector2[] {
  const pts: Vector2[] = [];
  const r = 1;
  const h = 0.95;
  const arc = (cx: number, cy: number, radius: number, from: number, to: number, steps = 16) => {
    for (let i = 0; i <= steps; i++) {
      const a = from + ((to - from) * i) / steps;
      pts.push(new Vector2(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius));
    }
  };
  pts.push(new Vector2(0.62, -h));
  arc(r - 0.32, -h + 0.32, 0.32, -Math.PI / 2, 0);
  arc(r - 0.22, h - 0.22, 0.22, 0, Math.PI / 2);
  return pts;
}

const dark = (color: string, roughness = 0.5, metalness = 0) => new MeshStandardMaterial({ color, roughness, metalness });

interface Part {
  object: Object3D;
  baseY: number;
  lift: number;
}

export class Speaker {
  readonly root = new Group();
  readonly backdrop: Mesh;
  readonly anchors = {} as Record<AnchorId, Object3D>;

  private readonly shellMaterial: MeshPhysicalMaterial;
  private readonly ringMaterial: ShaderMaterial;
  private readonly backdropMaterial: ShaderMaterial;
  private readonly internals = new Group();
  private readonly parts: Part[] = [];
  readonly palette: [Color, Color, Color] = [new Color(), new Color(), new Color()];

  constructor() {
    const knit = knitNormalMap();
    knit.repeat.set(44, 15);
    this.shellMaterial = new MeshPhysicalMaterial({
      color: '#23263a',
      roughness: 0.92,
      sheen: 1,
      sheenRoughness: 0.35,
      sheenColor: new Color('#7d86c9'),
      normalMap: knit,
      normalScale: new Vector2(1.1, 1.1),
      transparent: true,
      side: DoubleSide,
    });
    const shell = new Mesh(new LatheGeometry(shellProfile(), 160), this.shellMaterial);
    shell.renderOrder = 2;
    this.root.add(shell);

    const top = new Group();
    const glass = new Mesh(
      new CylinderGeometry(0.8, 0.8, 0.03, 128),
      new MeshPhysicalMaterial({ color: '#07080c', roughness: 0.35, metalness: 0.1, clearcoat: 0.6, clearcoatRoughness: 0.3 }),
    );
    top.add(glass);
    this.ringMaterial = new ShaderMaterial({
      vertexShader: ringShader.vertex,
      fragmentShader: ringShader.fragment,
      uniforms: {
        uTime: { value: 0 },
        uGlow: { value: 0.6 },
        uInner: { value: 0.42 },
        uOuter: { value: 0.74 },
        uColorA: { value: this.palette[0] },
        uColorB: { value: this.palette[1] },
        uColorC: { value: this.palette[2] },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const ring = new Mesh(new RingGeometry(0.42, 0.74, 160, 1), this.ringMaterial);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.017;
    top.add(ring);
    const dotMaterial = new MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.35 });
    for (const x of [-0.12, 0.12]) {
      const dot = new Mesh(new CylinderGeometry(0.025, 0.025, 0.004, 24), dotMaterial);
      dot.position.set(x, 0.017, 0);
      top.add(dot);
    }
    this.addAnchor('led', top, 0, 0.02, 0.6);
    this.addPart(top, 0.955, 0.95);

    const mics = new Group();
    const micMaterial = dark('#c7ccd8', 0.35, 0.8);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const mic = new Mesh(new SphereGeometry(0.035, 16, 12), micMaterial);
      mic.position.set(Math.cos(a) * 0.72, 0, Math.sin(a) * 0.72);
      mics.add(mic);
    }
    mics.add(new Mesh(new TorusGeometry(0.72, 0.008, 8, 96).rotateX(Math.PI / 2), dark('#3a3f52', 0.6)));
    this.addAnchor('mics', mics, -0.72 * Math.cos(Math.PI / 6), 0, 0.72 * Math.sin(Math.PI / 6));
    this.addPart(mics, 0.85, 0.72, true);

    const board = new Group();
    board.add(new Mesh(new CylinderGeometry(0.7, 0.7, 0.025, 64), dark('#0f2a24', 0.55)));
    const chipMaterial = dark('#16181f', 0.4, 0.3);
    for (const [x, z, w, d] of [[0, 0, 0.3, 0.3], [0.35, -0.1, 0.12, 0.18], [-0.32, 0.18, 0.16, 0.1], [0.05, 0.4, 0.2, 0.08]] as const) {
      const chip = new Mesh(new BoxGeometry(w, 0.03, d), chipMaterial);
      chip.position.set(x, 0.025, z);
      board.add(chip);
    }
    this.addPart(board, 0.6, 0.48, true);

    const tweeters = new Group();
    const hornMaterial = dark('#1b1e28', 0.3, 0.6);
    const domeMaterial = dark('#d4d8e2', 0.2, 0.9);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const horn = new Group();
      const cone = new Mesh(new ConeGeometry(0.11, 0.1, 32, 1, true), hornMaterial);
      cone.rotation.x = -Math.PI / 2;
      horn.add(cone);
      const dome = new Mesh(new SphereGeometry(0.04, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), domeMaterial);
      dome.rotation.x = Math.PI / 2;
      dome.position.z = -0.02;
      horn.add(dome);
      horn.position.set(Math.sin(a) * 0.66, 0, Math.cos(a) * 0.66);
      horn.lookAt(Math.sin(a) * 2, 0, Math.cos(a) * 2);
      tweeters.add(horn);
    }
    tweeters.add(new Mesh(new TorusGeometry(0.58, 0.02, 10, 96).rotateX(Math.PI / 2), dark('#2a2e3c', 0.5, 0.5)));
    this.addAnchor('tweeters', tweeters, 0, 0, 0.72);
    this.addPart(tweeters, 0.18, 0.1, true);

    const woofer = new Group();
    const coneProfile = [
      new Vector2(0.08, 0.06),
      new Vector2(0.18, 0.04),
      new Vector2(0.5, -0.12),
      new Vector2(0.6, -0.1),
      new Vector2(0.66, -0.06),
      new Vector2(0.7, -0.08),
    ];
    woofer.add(new Mesh(new LatheGeometry(coneProfile, 96), new MeshStandardMaterial({ color: '#2b2f3d', roughness: 0.35, metalness: 0.6, side: DoubleSide })));
    woofer.add(new Mesh(new SphereGeometry(0.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), dark('#c9ced9', 0.25, 0.9)));
    const magnet = new Mesh(new CylinderGeometry(0.26, 0.26, 0.16, 48), dark('#5d6375', 0.35, 0.9));
    magnet.position.y = -0.2;
    woofer.add(magnet);
    this.addAnchor('woofer', woofer, 0, -0.05, 0.66);
    this.addPart(woofer, -0.38, -0.32, true);

    const base = new Mesh(new CylinderGeometry(0.6, 0.62, 0.06, 96), dark('#0c0d12', 0.85));
    this.addPart(base, -0.975, -0.62);

    this.root.add(this.internals);

    this.backdropMaterial = new ShaderMaterial({
      vertexShader: backdropShader.vertex,
      fragmentShader: backdropShader.fragment,
      uniforms: {
        uTime: { value: 0 },
        uStrength: { value: 0.4 },
        uColorA: { value: this.palette[0] },
        uColorB: { value: this.palette[1] },
        uColorC: { value: this.palette[2] },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.backdrop = new Mesh(new PlaneGeometry(44, 22), this.backdropMaterial);
    this.backdrop.position.z = -14;

    this.setExplode(0);
  }

  private addPart(object: Object3D, baseY: number, lift: number, internal = false) {
    object.position.y = baseY;
    (internal ? this.internals : this.root).add(object);
    this.parts.push({ object, baseY, lift });
  }

  private addAnchor(id: AnchorId, parent: Object3D, x: number, y: number, z: number) {
    const anchor = new Object3D();
    anchor.position.set(x, y, z);
    parent.add(anchor);
    this.anchors[id] = anchor;
  }

  setExplode(t: number) {
    for (const part of this.parts) part.object.position.y = part.baseY + part.lift * t;
    this.shellMaterial.opacity = 1 - 0.88 * t;
    this.shellMaterial.depthWrite = t < 0.05;
    this.internals.visible = t > 0.01;
  }

  setGlow(glow: number) {
    this.ringMaterial.uniforms.uGlow!.value = glow;
    this.backdropMaterial.uniforms.uStrength!.value = 0.18 + glow * 0.32;
  }

  setPalette(colors: [Color, Color, Color]) {
    colors.forEach((c, i) => this.palette[i]!.copy(c));
  }

  get fabric() {
    return { color: this.shellMaterial.color, sheen: this.shellMaterial.sheenColor };
  }

  update(time: number) {
    this.ringMaterial.uniforms.uTime!.value = time;
    this.backdropMaterial.uniforms.uTime!.value = time;
  }
}
