export const ISO_A = 0.707;
export const ISO_B = -0.5;
export const ISO_C = 0.707;
export const ISO_D = 0.5;

export const DEFAULTS = {
  /** Mermaid node icon canvas size (px). */
  nodeIconSize: 80,
  /** Icon scale when rendered standing upright on the iso face. */
  iconStandingSize: 40,
  assetDefaultWidth: 57,
  /** Bottom-edge length of the iso floor tile, used to fit assets to grid. */
  assetBottomEdgeLength: 20 * Math.sqrt(3),
  assetOutlineWidth: 3,
  assetOutlineColor: '#000',
  viewBoxPadding: 40,
  viewBoxExtra: 80,
  assetAnchor: 'vertex-near-label',
  iconToAssetMap: {},
};

/** Merges config layers. Later keys override earlier. Pure. */
export function mergeConfig(base, overrides) {
  return { ...DEFAULTS, ...base, ...overrides };
}
