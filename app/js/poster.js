// poster.js — the poster composer of Tideline Cover Press.
//
// One renderer draws every cover: the panel mosaic (8 layouts), the hard
// uniform sunset grade on every photo, the opaque chrome title, the neon
// script subtitle, the role tags, the tagline banner and all the furniture.
// All geometry is normalised (0..1 of the frame), so the same layout works
// for landscape, story and square exports, and faces are kept clear of the
// title band by construction: every panel's face sits in its upper third.

import { gradeById, applyGradeFilter, clearGradeFilter, applyGradeWash } from './grades.js';
import { drawChromeTitle } from './chrome-title.js';
import {
  drawPressStrip,
  drawRoundel,
  drawRatingBox,
  drawPlatformPill,
  drawGoldSeal,
  drawBarcode,
  drawBillingBlock,
  drawFilmGrain,
  drawVignette,
} from './furniture.js';

/** The named cast: photo id -> the character and role the billing follows. */
export const CAST = {
  convertible: { name: 'Marina Sol', role: 'THE DRIVER' },
  rooftop: { name: 'Dante Reyes', role: 'THE COURIER' },
  neon: { name: 'Roxy Vane', role: 'THE INSIDER' },
  pier: { name: 'Elias Cove', role: 'THE LOOKOUT' },
  boss: { name: 'Silas Marlowe', role: 'THE BOSS' },
  rider: { name: 'Cole Brannon', role: 'THE RIDER' },
  causeway: null, // scene panel, no person, no tag
};

/** The eight layouts. Panels are normalised rects; rot is radians. */
export const LAYOUTS = [
  {
    id: 'hero-stack',
    name: 'Hero Stack',
    def: true,
    panels: [
      { photo: 'convertible', x: 0.015, y: 0.075, w: 0.208, h: 0.74, rot: -0.038, cx: 0.55, cy: 0.35, zoom: 1.0 },
      { photo: 'boss', x: 0.235, y: 0.065, w: 0.323, h: 0.455, rot: 0.024, cx: 0.5, cy: 0.45, zoom: 1.5 },
      { photo: 'rooftop', x: 0.572, y: 0.072, w: 0.202, h: 0.228, rot: -0.031, cx: 0.5, cy: 0.3, zoom: 1.05 },
      { photo: 'neon', x: 0.784, y: 0.072, w: 0.202, h: 0.228, rot: 0.028, cx: 0.5, cy: 0.4, zoom: 1.0 },
      { photo: 'rider', x: 0.572, y: 0.32, w: 0.202, h: 0.2, rot: 0.038, cx: 0.5, cy: 0.4, zoom: 0.85 },
      { photo: 'pier', x: 0.784, y: 0.32, w: 0.202, h: 0.2, rot: -0.024, cx: 0.5, cy: 0.42, zoom: 0.9 },
      { photo: 'causeway', x: 0.572, y: 0.54, w: 0.414, h: 0.28, rot: 0, cx: 0.5, cy: 0.55, zoom: 1.0 },
    ],
  },
  {
    id: 'four-square',
    name: 'Four Square',
    panels: [
      { photo: 'convertible', x: 0.015, y: 0.07, w: 0.48, h: 0.36, rot: -0.026, cx: 0.55, cy: 0.35, zoom: 1.0 },
      { photo: 'boss', x: 0.505, y: 0.07, w: 0.48, h: 0.36, rot: 0.026, cx: 0.5, cy: 0.3, zoom: 1.4 },
      { photo: 'rider', x: 0.015, y: 0.45, w: 0.48, h: 0.36, rot: 0.021, cx: 0.5, cy: 0.28, zoom: 1.3 },
      { photo: 'causeway', x: 0.505, y: 0.45, w: 0.48, h: 0.36, rot: -0.017, cx: 0.5, cy: 0.55, zoom: 1.0 },
    ],
  },
  {
    id: 'nine-lives',
    name: 'Nine Lives',
    panels: [
      { photo: 'convertible', x: 0.015, y: 0.065, w: 0.31, h: 0.16, rot: -0.026, cx: 0.55, cy: 0.3, zoom: 1.0 },
      { photo: 'boss', x: 0.345, y: 0.065, w: 0.31, h: 0.16, rot: 0.026, cx: 0.5, cy: 0.3, zoom: 1.5 },
      { photo: 'rooftop', x: 0.675, y: 0.065, w: 0.31, h: 0.16, rot: -0.02, cx: 0.5, cy: 0.3, zoom: 1.05 },
      { photo: 'neon', x: 0.015, y: 0.245, w: 0.31, h: 0.16, rot: 0.02, cx: 0.5, cy: 0.35, zoom: 1.0 },
      { photo: 'rider', x: 0.345, y: 0.245, w: 0.31, h: 0.16, rot: -0.026, cx: 0.5, cy: 0.28, zoom: 1.35 },
      { photo: 'pier', x: 0.675, y: 0.245, w: 0.31, h: 0.16, rot: 0.026, cx: 0.5, cy: 0.3, zoom: 1.3 },
      { photo: 'causeway', x: 0.015, y: 0.425, w: 0.31, h: 0.16, rot: -0.017, cx: 0.5, cy: 0.55, zoom: 1.0 },
      { photo: 'convertible', x: 0.345, y: 0.425, w: 0.31, h: 0.16, rot: 0.026, cx: 0.45, cy: 0.35, zoom: 1.0 },
      { photo: 'boss', x: 0.675, y: 0.425, w: 0.31, h: 0.16, rot: -0.02, cx: 0.5, cy: 0.3, zoom: 1.5 },
    ],
  },
  {
    id: 'tilted-snaps',
    name: 'Tilted Snaps',
    panels: [
      { photo: 'convertible', x: 0.03, y: 0.08, w: 0.34, h: 0.55, rot: -0.087, cx: 0.55, cy: 0.35, zoom: 1.0 },
      { photo: 'boss', x: 0.3, y: 0.06, w: 0.38, h: 0.62, rot: 0.035, cx: 0.5, cy: 0.3, zoom: 1.5 },
      { photo: 'rooftop', x: 0.62, y: 0.1, w: 0.32, h: 0.42, rot: 0.07, cx: 0.5, cy: 0.3, zoom: 1.05 },
      { photo: 'rider', x: 0.55, y: 0.44, w: 0.3, h: 0.32, rot: -0.052, cx: 0.5, cy: 0.28, zoom: 1.3 },
      { photo: 'causeway', x: 0.1, y: 0.6, w: 0.42, h: 0.2, rot: 0.017, cx: 0.5, cy: 0.55, zoom: 1.0 },
    ],
  },
  {
    id: 'full-bleed',
    name: 'Full Bleed',
    scrim: true,
    panels: [
      { photo: 'boss', x: 0, y: 0, w: 1, h: 1, rot: 0, cx: 0.5, cy: 0.35, zoom: 1.15, noTag: true },
    ],
  },
  {
    id: 'split-duo',
    name: 'Split Duo',
    panels: [
      { photo: 'convertible', x: 0.015, y: 0.07, w: 0.48, h: 0.75, rot: -0.026, cx: 0.55, cy: 0.35, zoom: 1.0 },
      { photo: 'boss', x: 0.505, y: 0.07, w: 0.48, h: 0.75, rot: 0.026, cx: 0.5, cy: 0.3, zoom: 1.45 },
    ],
  },
  {
    id: 'triptych',
    name: 'Triptych',
    panels: [
      { photo: 'convertible', x: 0.015, y: 0.07, w: 0.31, h: 0.75, rot: -0.026, cx: 0.55, cy: 0.35, zoom: 1.0 },
      { photo: 'boss', x: 0.345, y: 0.06, w: 0.31, h: 0.76, rot: 0, cx: 0.5, cy: 0.3, zoom: 1.5 },
      { photo: 'rider', x: 0.675, y: 0.07, w: 0.31, h: 0.75, rot: 0.026, cx: 0.5, cy: 0.28, zoom: 1.3 },
    ],
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    panels: [
      { photo: 'boss', x: 0.3, y: 0.06, w: 0.4, h: 0.7, rot: 0, cx: 0.5, cy: 0.3, zoom: 1.5 },
      { photo: 'convertible', x: 0.015, y: 0.07, w: 0.24, h: 0.3, rot: -0.052, cx: 0.55, cy: 0.35, zoom: 1.0 },
      { photo: 'rooftop', x: 0.745, y: 0.07, w: 0.24, h: 0.3, rot: 0.052, cx: 0.5, cy: 0.3, zoom: 1.05 },
      { photo: 'neon', x: 0.015, y: 0.42, w: 0.24, h: 0.22, rot: 0.035, cx: 0.5, cy: 0.3, zoom: 1.0 },
      { photo: 'pier', x: 0.745, y: 0.42, w: 0.24, h: 0.22, rot: -0.035, cx: 0.5, cy: 0.25, zoom: 1.3 },
    ],
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS.find((l) => l.def);
}

/**
 * The source rectangle of `img` that cover-fills a w x h box, biased by
 * the crop (cx, cy = focus point, 0..1; zoom >= 1 tightens on the focus).
 * Faces live near the top of these photos, so cy biases toward the top.
 */
export function coverSourceRect(img, w, h, crop) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const base = Math.max(w / iw, h / ih);
  const s = base * (crop.zoom || 1);
  const sw = Math.min(iw, w / s);
  const sh = Math.min(ih, h / s);
  const sx = Math.max(0, Math.min(iw - sw, crop.cx * iw - sw / 2));
  const sy = Math.max(0, Math.min(ih - sh, crop.cy * ih - sh / 2));
  return { sx, sy, sw, sh };
}

/** One slanted black role tag with a gold tick, e.g. THE DRIVER. */
export function drawRoleTag(ctx, panelW, panelH, role, u) {
  // Shrink the tag when the panel is narrow (portrait exports), so the
  // tag always fits inside its panel instead of running off the frame.
  let tagH = Math.max(20 * u, panelH * 0.085);
  const measureTag = (h) => {
    ctx.font = `${Math.round(h * 0.58)}px Anton, "Arial Narrow", sans-serif`;
    const textW = ctx.measureText(role).width;
    const tickW = h * 0.42;
    const padX = h * 0.5;
    return { textW, tickW, padX, tagW: tickW + padX + textW + padX };
  };
  let m = measureTag(tagH);
  const maxTagW = panelW - 12 * u;
  if (m.tagW > maxTagW && maxTagW > 0) {
    tagH *= maxTagW / m.tagW;
    m = measureTag(tagH);
  }
  const { textW, tickW, padX, tagW } = m;
  const x = panelW / 2 - tagW - 6 * u;
  const y = -panelH / 2 + 6 * u;
  const slant = tagH * 0.32;
  ctx.save();
  // Gold tick, then the black tag body.
  ctx.fillStyle = '#f5c542';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + tickW, y);
  ctx.lineTo(x + tickW - slant, y + tagH);
  ctx.lineTo(x - slant, y + tagH);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(12,4,12,0.94)';
  ctx.beginPath();
  ctx.moveTo(x + tickW, y);
  ctx.lineTo(x + tagW, y);
  ctx.lineTo(x + tagW - slant, y + tagH);
  ctx.lineTo(x + tickW - slant, y + tagH);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(role, x + tickW + padX, y + tagH / 2 + tagH * 0.04);
  ctx.restore();
}

/** Draw one photo panel: graded photo, gold border, role tag. */
export function drawPhotoPanel(ctx, img, panel, W, H, grade, showTags, u) {
  const x = panel.x * W;
  const y = panel.y * H;
  const w = panel.w * W;
  const h = panel.h * H;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const src = coverSourceRect(img, w, h, panel);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(panel.rot || 0);
  ctx.beginPath();
  ctx.rect(-w / 2, -h / 2, w, h);
  ctx.clip();
  applyGradeFilter(ctx, grade);
  ctx.drawImage(img, src.sx, src.sy, src.sw, src.sh, -w / 2, -h / 2, w, h);
  clearGradeFilter(ctx);
  applyGradeWash(ctx, grade, -w / 2, -h / 2, w, h);
  ctx.restore();
  // Gold border + dark outer edge, then the role tag, in the same tilt.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(panel.rot || 0);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = Math.max(1.5, 3 * u);
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = 'rgba(12,4,12,0.85)';
  ctx.lineWidth = Math.max(1, 1.2 * u);
  ctx.strokeRect(-w / 2 - 2 * u, -h / 2 - 2 * u, w + 4 * u, h + 4 * u);
  if (showTags && !panel.noTag) {
    const cast = CAST[panel.photo];
    if (cast) drawRoleTag(ctx, w, h, cast.role, u);
  }
  ctx.restore();
}

/** The slanted black tagline banner under the title, with pink end ticks. */
export function drawTaglineBanner(ctx, W, H, tagline, taglineY) {
  const u = W / 1920;
  const fontSize = Math.round(30 * u);
  ctx.save();
  ctx.font = `${fontSize}px Anton, "Arial Narrow", sans-serif`;
  const text = tagline.toUpperCase();
  const textW = ctx.measureText(text).width;
  const barH = H * 0.034;
  const barW = textW + 70 * u;
  ctx.translate(W / 2, H * taglineY);
  ctx.rotate(-0.012);
  ctx.fillStyle = 'rgba(12,4,12,0.94)';
  ctx.beginPath();
  const slant = barH * 0.5;
  ctx.moveTo(-barW / 2 + slant, -barH / 2);
  ctx.lineTo(barW / 2, -barH / 2);
  ctx.lineTo(barW / 2 - slant, barH / 2);
  ctx.lineTo(-barW / 2, barH / 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff5da2';
  ctx.fillRect(-barW / 2 - 14 * u, -barH / 2, 8 * u, barH);
  ctx.fillRect(barW / 2 + 6 * u, -barH / 2, 8 * u, barH);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, barH * 0.05);
  ctx.restore();
}

/** The billing cast line: only the cast actually placed on the cover. */
export function billingCastLine(slots) {
  const seen = new Set();
  const parts = [];
  for (const slot of slots) {
    const cast = CAST[slot.photo];
    if (!cast || seen.has(slot.photo)) continue;
    seen.add(slot.photo);
    parts.push(cast.name.toUpperCase());
  }
  return parts.length > 0 ? `STARRING ${parts.join(' \u00B7 ')}` : 'STARRING YOU \u00B7 SHOT ON YOUR OWN CAMERA \u00B7 GRADED BY HAND';
}

/**
 * Draw the whole cover on `ctx` at W x H.
 * `state` carries layout, grade, title, subtitle, tagline, quote, gazette,
 * vol and the furniture toggles; `state.slots` overrides the layout's
 * default photo/crop per slot. `images` maps photo id -> loaded image.
 */
export function renderPoster(ctx, W, H, state, images) {
  const u = W / 1920;
  const layout = layoutById(state.layout);
  const grade = gradeById(state.grade);
  const slots = layout.panels.map((def, i) => ({ ...def, ...(state.slots?.[i] || {}) }));

  // Deep plum frame + a warm glow behind the mosaic.
  ctx.save();
  ctx.fillStyle = '#1c0a1e';
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, W * 0.55);
  glow.addColorStop(0, 'rgba(255,122,60,0.12)');
  glow.addColorStop(1, 'rgba(255,122,60,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Panels, tilted, graded hard and uniform.
  for (const slot of slots) {
    const img = images[slot.photo];
    if (!img) continue;
    drawPhotoPanel(ctx, img, slot, W, H, grade, state.showTags !== false, u);
  }

  // Full-bleed scrim so the title stays legible over the photo.
  if (layout.scrim) {
    const scrim = ctx.createLinearGradient(0, H * 0.45, 0, H);
    scrim.addColorStop(0, 'rgba(20,4,20,0)');
    scrim.addColorStop(1, 'rgba(20,4,20,0.62)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, H * 0.45, W, H * 0.55);
  }

  const titleBaseline = H * (layout.titleBaseline ?? 0.72);
  const subtitleBaseline = H * (layout.subtitleBaseline ?? 0.795);
  const taglineY = layout.taglineY ?? 0.845;

  // Giant opaque chrome title, 70% of the frame width.
  drawChromeTitle(ctx, state.title, W / 2, titleBaseline, W * 0.7, {
    fontFamily: 'Anton, "Arial Narrow", sans-serif',
    shear: -0.14,
    startSize: Math.round(230 * u),
  });

  // Neon script subtitle, glowing pink, overlapping the title's lower right.
  ctx.save();
  ctx.translate(W * 0.63, subtitleBaseline);
  ctx.rotate(-0.07);
  ctx.font = `${Math.round(74 * u)}px Pacifico, cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = '#ff2ea6';
  ctx.shadowBlur = Math.round(22 * u);
  ctx.fillStyle = '#ff8ac2';
  ctx.fillText(state.subtitle, 0, 0);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffd7ea';
  ctx.fillText(state.subtitle, 0, -2 * u);
  ctx.restore();

  // Tagline banner.
  drawTaglineBanner(ctx, W, H, state.tagline, taglineY);

  // Press strip on top.
  if (state.showPress !== false) drawPressStrip(ctx, W, H, state);

  // Corner furniture: roundel on a panel corner, platform pill top-right.
  if (state.showCorners !== false) {
    drawRoundel(ctx, W * 0.045, H * 0.16, W * 0.032);
    drawPlatformPill(ctx, W * 0.935, H * 0.085, W * 0.125, H * 0.026);
  }

  // Billing block, rating box, big gold seal, barcode.
  if (state.showBilling !== false) {
    drawBillingBlock(ctx, W, H, billingCastLine(slots));
    drawRatingBox(ctx, W * 0.015, H * 0.885, W * 0.085, H * 0.1);
    drawGoldSeal(ctx, W * 0.885, H * 0.905, W * 0.048, ['ORIGINAL', 'COVER ART']);
    drawBarcode(ctx, W * 0.945, H * 0.9, W * 0.045, H * 0.075, '019872065913');
  }

  // Finish: grain + vignette.
  drawFilmGrain(ctx, W, H, 0.05);
  drawVignette(ctx, W, H);
}
