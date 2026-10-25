import { DataTexture, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, RGBAFormat } from 'three';

export function knitNormalMap(size = 256, period = 8, strength = 1.6): DataTexture {
  const data = new Uint8Array(size * size * 4);
  const k = (2 * Math.PI) / period;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = k * x;
      const v = k * y;
      const dx = k * (Math.cos(u) * Math.sin(v) + 0.3 * Math.cos(u + v));
      const dy = k * (Math.sin(u) * Math.cos(v) + 0.3 * Math.cos(u + v));
      let nx = -dx * strength;
      let ny = -dy * strength;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      const i = (y * size + x) * 4;
      data[i] = (nx * 0.5 + 0.5) * 255;
      data[i + 1] = (ny * 0.5 + 0.5) * 255;
      data[i + 2] = (nz * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  const texture = new DataTexture(data, size, size, RGBAFormat);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
