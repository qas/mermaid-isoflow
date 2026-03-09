/**
 * ViewBox computation for isometric transform. Pure core + apply.
 */

import { ISO_A, ISO_B, ISO_C, ISO_D } from './constants.mjs';

/**
 * Computes new viewBox string from original corners after isometric transform. Pure.
 * @param {number[][]} corners - [[x,y], ...] four corners of original viewBox
 * @param {number} pad - Padding to subtract from min
 * @param {number} extra - Extra to add to width/height
 * @returns {string} viewBox attribute value
 */
export function computeViewBox(corners, pad, extra) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [px, py] of corners) {
    const tx = ISO_A * px + ISO_C * py;
    const ty = ISO_B * px + ISO_D * py;
    minX = Math.min(minX, tx);
    minY = Math.min(minY, ty);
    maxX = Math.max(maxX, tx);
    maxY = Math.max(maxY, ty);
  }
  return `${minX - pad} ${minY - pad} ${maxX - minX + extra} ${maxY - minY + extra}`;
}

/**
 * Parses viewBox attribute into corners array. Pure.
 * @param {string} [vb] - viewBox attribute
 * @returns {number[][]|null} Four corners or null if invalid
 */
export function parseViewBoxCorners(vb) {
  const parts = vb?.split(/\s+/).map(Number);
  if (!parts || parts.length !== 4) return null;
  const [x, y, w, h] = parts;
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
}
