import { ISO_A, ISO_B, ISO_C, ISO_D } from './constants.mjs';

export function proj(x, y, z = 0) {
  return { x: ISO_A * x + ISO_C * y, y: ISO_B * x + ISO_D * y - z };
}

export const ISO_MATRIX = `matrix(${ISO_A} ${ISO_B} ${ISO_C} ${ISO_D} 0 0)`;
export const FACE_MATRIX = `matrix(${ISO_A} ${ISO_B} 0 -1 0 0)`;
