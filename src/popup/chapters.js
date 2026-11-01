/* chapters.js — what stands up on the Mehndi and Barat pages.
 *
 * Each chapter is a list of pieces built with popup/pieces.js (rainy-study's
 * builders). A piece has an `order` for spring-bloom's rise stagger (0 the
 * back arch, 1 the planters and lanterns, 2 the foreground blooms), a foot
 * position on the right page in page units (u 0.5..1 across the spread, v
 * 0..1 down the page) and a builder that fills a THREE.Group whose origin is
 * its foot. The cream-and-gold base is shared; only a few blooms carry the
 * event's accent.
 */

import * as THREE from 'three';
import { WEDDING } from '../config/wedding.js';
import { arch, planter, lantern, foliage, ell } from './pieces.js';

const SCALE = 0.42;     // page pieces are small: the arch stands about 26 cm

function common(accent) {
  return [
    { id: 'arch', order: 0, at: [0.75, 0.30], build: (g) => arch(g, 0, 0, 0.78, 0.68, accent) },
    { id: 'planter-left', order: 1, at: [0.58, 0.42], build: (g) => planter(g, 0, 0, 0.9, { accent }) },
    { id: 'planter-right', order: 1, at: [0.92, 0.42], build: (g) => planter(g, 0, 0, 0.9, { accent }) },
    { id: 'lantern-left', order: 1, at: [0.61, 0.62], build: (g) => lantern(g, 0, 0, 0.62, 1) },
    { id: 'lantern-right', order: 1, at: [0.89, 0.62], build: (g) => lantern(g, 0, 0, 0.62, 1) },
    {
      id: 'blooms',
      order: 2,
      at: [0.75, 0.72],
      build: (g, wind) => {
        const t = foliage(g, wind, -0.22, 0.05, 0.22, ['#f3e8d2', '#eadcc0', '#f8f1e2', accent], '#b9955a', 20);
        const t2 = foliage(g, wind, 0.24, 0.0, 0.19, ['#f3e8d2', accent, '#f8f1e2', '#eadcc0'], '#b9955a', 20);
        t.rotation.y = 0.6; t2.rotation.y = -0.9;
        for (let i = 0; i < 6; i += 1) {
          ell(i % 3 === 0 ? accent : '#f6ecd8', -0.1 + i * 0.045, 0.03, 0.12 + Math.sin(i) * 0.03, 0.03, 0.025, 0.03, g);
        }
      },
    },
  ];
}

export const CHAPTERS = {
  3: { event: 'mehndi', pieces: common(WEDDING.events[0].accent) },
  4: { event: 'barat', pieces: common(WEDDING.events[1].accent) },
};

export const PIECE_SCALE = SCALE;

/* Build every piece of a chapter into `root`. Returns the records the
   scheduler animates. */
export function buildChapter(spread, root) {
  const def = CHAPTERS[spread];
  if (!def) return [];
  const wind = [];
  const out = [];
  for (const p of def.pieces) {
    const g = new THREE.Group();
    g.name = `piece-${spread}-${p.id}`;
    const inner = new THREE.Group();
    inner.scale.setScalar(SCALE);
    g.add(inner);
    p.build(inner, wind);
    root.add(g);
    out.push({ id: p.id, order: p.order, at: p.at, group: g, inner, p: 0, phase: 0 });
  }
  return { pieces: out, wind };
}
