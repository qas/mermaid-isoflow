/**
 * Asset rendering for isometric node icons.
 * Pure anchor computation + impure render (uses container.ownerDocument).
 */

import { proj } from './projection.mjs';
import { DEFAULTS } from './constants.mjs';

const DEFAULT_ASSET_HEIGHT = DEFAULTS.nodeIconSize;

const SVG_NS = 'http://www.w3.org/2000/svg';

const ANCHOR_PRESETS = {
  'vertex-near-label': (floorSize) => proj(0, floorSize, 0),
  'bottom-center': (floorSize) => proj(0, floorSize / 2, 0),
  'floor-center': (floorSize) => proj(floorSize / 2, floorSize / 2, 0),
  'back-left': (floorSize) => proj(0, 0, 0),
};

/**
 * Computes the 2D anchor point for an asset. Pure.
 */
export function computeAssetAnchor(floorSize, anchorKey) {
  const key = anchorKey ?? DEFAULTS.assetAnchor;
  const fn = typeof key === 'function' ? key : ANCHOR_PRESETS[key] ?? ANCHOR_PRESETS['vertex-near-label'];
  return fn(floorSize);
}

const OUTLINE_FILTER_PREFIX = 'isoflow-asset-outline';

function ensureOutlineFilter(svgRoot, scale, outlineWidth = DEFAULTS.assetOutlineWidth, outlineColor = DEFAULTS.assetOutlineColor) {
  const doc = svgRoot.ownerDocument;
  const safeScale = String(scale).replace('.', 'p');
  const safeColor = outlineColor.replace('#', '');
  const filterId = `${OUTLINE_FILTER_PREFIX}-${safeScale}-${outlineWidth}-${safeColor}`;
  let defs = svgRoot.querySelector('defs');
  if (!defs) {
    defs = doc.createElementNS(SVG_NS, 'defs');
    svgRoot.insertBefore(defs, svgRoot.firstChild);
  }
  let filter = doc.getElementById(filterId);
  if (!filter) {
    filter = doc.createElementNS(SVG_NS, 'filter');
    filter.setAttribute('id', filterId);
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    const radius = outlineWidth / (2 * scale);
    const morph = doc.createElementNS(SVG_NS, 'feMorphology');
    morph.setAttribute('in', 'SourceAlpha');
    morph.setAttribute('operator', 'dilate');
    morph.setAttribute('radius', radius);
    morph.setAttribute('result', 'dilated');
    const compBand = doc.createElementNS(SVG_NS, 'feComposite');
    compBand.setAttribute('in', 'dilated');
    compBand.setAttribute('in2', 'SourceAlpha');
    compBand.setAttribute('operator', 'out');
    compBand.setAttribute('result', 'band');
    const flood = doc.createElementNS(SVG_NS, 'feFlood');
    flood.setAttribute('flood-color', outlineColor);
    flood.setAttribute('result', 'flood');
    const comp1 = doc.createElementNS(SVG_NS, 'feComposite');
    comp1.setAttribute('in', 'flood');
    comp1.setAttribute('in2', 'band');
    comp1.setAttribute('operator', 'in');
    comp1.setAttribute('result', 'outline');
    const merge = doc.createElementNS(SVG_NS, 'feMerge');
    const mergeNode1 = doc.createElementNS(SVG_NS, 'feMergeNode');
    mergeNode1.setAttribute('in', 'outline');
    const mergeNode2 = doc.createElementNS(SVG_NS, 'feMergeNode');
    mergeNode2.setAttribute('in', 'SourceGraphic');
    merge.append(mergeNode1, mergeNode2);
    filter.append(morph, compBand, flood, comp1, merge);
    defs.appendChild(filter);
  }
  return `url(#${filterId})`;
}

/**
 * Renders an SVG asset into a container. Uses container.ownerDocument for DOM ops.
 */
export function renderAsset(container, assetSvg, options) {
  const {
    scaleX,
    scaleY,
    anchorX,
    anchorY,
    assetDefaultWidth = DEFAULTS.assetDefaultWidth,
    svgRoot,
    outlineWidth = DEFAULTS.assetOutlineWidth,
    outlineColor = DEFAULTS.assetOutlineColor,
  } = options;
  const doc = container.ownerDocument;
  const parseDoc = new DOMParser().parseFromString(assetSvg, 'image/svg+xml');
  const svg = parseDoc.querySelector('svg');
  if (!svg) return;
  const viewBox = svg.getAttribute('viewBox')?.split(/\s+/).map(Number);
  const [minX = 0, minY = 0, width = assetDefaultWidth, height = DEFAULT_ASSET_HEIGHT] = viewBox?.length === 4 ? viewBox : [0, 0, assetDefaultWidth, DEFAULT_ASSET_HEIGHT];
  const bottomCenterX = minX + width / 2;
  const bottomCenterY = minY + height;
  const group = doc.createElementNS(SVG_NS, 'g');
  group.setAttribute('transform', `translate(${anchorX - bottomCenterX * scaleX}, ${anchorY - bottomCenterY * scaleY}) scale(${scaleX}, ${scaleY})`);
  const useOutline = svgRoot && outlineWidth > 0;
  if (useOutline) group.setAttribute('filter', ensureOutlineFilter(svgRoot, scaleX, outlineWidth, outlineColor));
  for (const el of svg.querySelectorAll('path, rect, polygon')) {
    const clone = doc.createElementNS(SVG_NS, el.tagName);
    for (const attr of el.attributes) {
      if (useOutline && (attr.name === 'stroke' || attr.name === 'stroke-width')) continue;
      clone.setAttribute(attr.name, attr.value);
    }
    if (useOutline) clone.setAttribute('stroke', 'none');
    group.appendChild(clone);
  }
  container.appendChild(group);
}
