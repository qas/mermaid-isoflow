/**
 * DOM utilities for Mermaid architecture elements.
 * Pure parsers + thin adapters over elements.
 */

const MERMAID_ID_PREFIX = /^(?:service|group)-/;
const TRANSLATE_RE = /translate\(([^,]+),\s*([^)]+)\)/;

/**
 * Parses node id from Mermaid element id string. Pure.
 * @param {string} id - Raw id (e.g. "service-s3")
 * @returns {string} Bare node id (e.g. "s3")
 */
export function parseNodeId(id) {
  const s = id || '';
  return s.replace(MERMAID_ID_PREFIX, '') || s;
}

/**
 * Parses translate(x, y) from transform attribute string. Pure.
 * @param {string} [attr] - transform attribute value
 * @returns {{ x: number, y: number }}
 */
export function parseTranslate(attr) {
  const m = (attr || '').match(TRANSLATE_RE);
  return { x: m ? parseFloat(m[1]) : 0, y: m ? parseFloat(m[2]) : 0 };
}

/**
 * Extracts node id from element. Adapter over parseNodeId.
 */
export function extractNodeId(element) {
  const id = element?.id || element?.querySelector?.('[id]')?.id || '';
  return parseNodeId(id);
}

/**
 * Parses translate from element's transform. Adapter over parseTranslate.
 */
export function parseTranslateTransform(element) {
  return parseTranslate(element?.getAttribute?.('transform'));
}
