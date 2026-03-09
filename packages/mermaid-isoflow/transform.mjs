/**
 * Diagram transform: architecture vs generic. Composable, takes deps.
 */

import { proj, ISO_MATRIX, FACE_MATRIX } from './projection.mjs';
import { computeAssetAnchor, renderAsset } from './asset.mjs';
import { extractNodeId, parseTranslateTransform } from './dom.mjs';
import { computeViewBox, parseViewBoxCorners } from './viewbox.mjs';
import {
  SERVICES_LAYER,
  SERVICE_NODE,
  EDGES_LAYER,
  GROUPS_LAYER,
  LABEL,
  ICON,
} from './selectors.mjs';
import { DEFAULTS } from './constants.mjs';

const SVG_NS = 'http://www.w3.org/2000/svg';
const DEFAULT_ICON_SIZE = DEFAULTS.nodeIconSize;
const ICON_HALF = DEFAULT_ICON_SIZE / 2;

function resolveAsset(config, nodeId) {
  if (config.floorAsset) return config.floorAsset;
  const map = config.iconToAssetMap ?? DEFAULTS.iconToAssetMap;
  const iconId = nodeId?.replace(/^[^:]+:/, '');
  return map[nodeId] || map[iconId] || null;
}

function renderDefaultIcon(container, iconSvg, nodeSize, config) {
  const center = proj(nodeSize / 2, nodeSize / 2, 0);
  const size = config.iconStandingSize ?? DEFAULTS.iconStandingSize;
  const doc = container.ownerDocument;
  const group = doc.createElementNS(SVG_NS, 'g');
  group.setAttribute('transform', `translate(${center.x}, ${center.y}) ${FACE_MATRIX} scale(${size / DEFAULT_ICON_SIZE}, -${size / DEFAULT_ICON_SIZE})`);
  const clone = iconSvg.cloneNode(true);
  if (!clone.getAttribute('viewBox')) clone.setAttribute('viewBox', `0 0 ${DEFAULT_ICON_SIZE} ${DEFAULT_ICON_SIZE}`);
  clone.setAttribute('x', -ICON_HALF);
  clone.setAttribute('y', -ICON_HALF);
  clone.setAttribute('width', String(DEFAULT_ICON_SIZE));
  clone.setAttribute('height', String(DEFAULT_ICON_SIZE));
  group.appendChild(clone);
  container.appendChild(group);
}

function replaceServiceNode(svgElement, serviceElement, config) {
  const iconSvg = serviceElement.querySelector(ICON);
  if (!iconSvg) return false;
  const { x: translateX, y: translateY } = parseTranslateTransform(serviceElement);
  const position = proj(translateX, translateY);
  const nodeSize = config.nodeIconSize ?? DEFAULTS.nodeIconSize;
  const assetDefaultWidth = config.assetDefaultWidth ?? DEFAULTS.assetDefaultWidth;
  const doc = svgElement.ownerDocument;
  const group = doc.createElementNS(SVG_NS, 'g');
  group.setAttribute('transform', `translate(${position.x}, ${position.y})`);
  const nodeId = extractNodeId(serviceElement);
  const assetSvg = resolveAsset(config, nodeId);
  if (assetSvg) {
    const floorBottomEdgeLen = nodeSize * Math.sqrt(3) / 2;
    const assetBottomEdgeLen = config.assetBottomEdgeLength ?? DEFAULTS.assetBottomEdgeLength;
    const scale = floorBottomEdgeLen / assetBottomEdgeLen;
    const anchor = computeAssetAnchor(nodeSize, config.assetAnchor);
    const svgRoot = serviceElement.closest('svg');
    renderAsset(group, assetSvg, {
      scaleX: scale,
      scaleY: scale,
      anchorX: anchor.x,
      anchorY: anchor.y,
      assetDefaultWidth,
      svgRoot,
      outlineWidth: config.assetOutlineWidth ?? DEFAULTS.assetOutlineWidth,
      outlineColor: config.assetOutlineColor ?? DEFAULTS.assetOutlineColor,
    });
  } else {
    renderDefaultIcon(group, iconSvg, nodeSize, config);
  }
  const labelElement = serviceElement.querySelector(LABEL);
  if (labelElement) {
    const labelClone = labelElement.cloneNode(true);
    const labelPosition = proj(nodeSize / 2, nodeSize, 0);
    labelClone.setAttribute('transform', `translate(${labelPosition.x}, ${labelPosition.y}) ${ISO_MATRIX}`);
    group.appendChild(labelClone);
  }
  serviceElement.parentNode.replaceChild(group, serviceElement);
  return true;
}

function transformArchitectureDiagram(svgElement, config) {
  const servicesLayer = svgElement.querySelector(SERVICES_LAYER);
  const edgesLayer = svgElement.querySelector(EDGES_LAYER);
  const groupsLayer = svgElement.querySelector(GROUPS_LAYER);
  let hasIconNodes = false;
  servicesLayer?.querySelectorAll(SERVICE_NODE).forEach((el) => {
    if (el.querySelector(ICON) && replaceServiceNode(svgElement, el, config)) hasIconNodes = true;
  });
  if (edgesLayer) edgesLayer.setAttribute('transform', ISO_MATRIX);
  if (groupsLayer) groupsLayer.setAttribute('transform', ISO_MATRIX);
  if (!hasIconNodes && servicesLayer) servicesLayer.setAttribute('transform', ISO_MATRIX);
}

function transformGenericDiagram(svgElement) {
  const doc = svgElement.ownerDocument;
  const wrapper = doc.createElementNS(SVG_NS, 'g');
  wrapper.setAttribute('transform', ISO_MATRIX);
  while (svgElement.firstChild) wrapper.appendChild(svgElement.firstChild);
  svgElement.appendChild(wrapper);
}

/**
 * Applies isometric transform to SVG. Dispatches to architecture or generic.
 */
export function applyIsoflowTransform(svgElement, config) {
  const servicesLayer = svgElement.querySelector(SERVICES_LAYER);
  if (servicesLayer) transformArchitectureDiagram(svgElement, config);
  else transformGenericDiagram(svgElement);
  const corners = parseViewBoxCorners(svgElement.getAttribute('viewBox'));
  if (corners) {
    const pad = config.viewBoxPadding ?? DEFAULTS.viewBoxPadding;
    const extra = config.viewBoxExtra ?? DEFAULTS.viewBoxExtra;
    svgElement.setAttribute('viewBox', computeViewBox(corners, pad, extra));
  }
}
