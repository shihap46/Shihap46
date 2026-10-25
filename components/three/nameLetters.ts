import * as THREE from "three";
import type { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

export const NAME_FONT_URL = "/fonts/helvetiker_bold.typeface.json";

export interface NameLetter {
  geometry: THREE.BufferGeometry;
  /** Centre of the letter along its line, in font units */
  x: number;
  line: number;
  order: number;
}

/* Builds one extruded mesh geometry per letter, each pivoted on its own centre so
   letters can fly, flip and assemble independently. Shared by the intro and hero. */
export function buildNameLetters(
  font: Font,
  lines: string[],
  { size = 1, depth = 0.34, gap = 0.03 }: { size?: number; depth?: number; gap?: number } = {}
) {
  const scale = size / font.data.resolution;
  const letters: NameLetter[] = [];
  const lineWidths: number[] = [];
  let order = 0;
  let capHeight = 0;

  lines.forEach((text, line) => {
    let x = 0;
    for (const ch of text) {
      const glyph = font.data.glyphs[ch];
      const advance = (glyph?.ha ?? 600) * scale;
      const geometry = new TextGeometry(ch, {
        font,
        size,
        depth,
        curveSegments: 4,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.024,
        bevelOffset: 0,
        bevelSegments: 2,
      });
      geometry.computeBoundingBox();
      const box = geometry.boundingBox!;
      capHeight = Math.max(capHeight, box.max.y);
      const cx = (box.min.x + box.max.x) / 2;
      geometry.translate(-cx, 0, -depth / 2);
      letters.push({ geometry, x: x + cx, line, order: order++ });
      x += advance + gap;
    }
    lineWidths.push(x - gap);
  });

  return { letters, lineWidths, capHeight };
}
