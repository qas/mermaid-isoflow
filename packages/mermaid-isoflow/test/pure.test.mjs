/**
 * Tests for pure functions. No DOM, no mermaid. Run: node --test test/pure.test.mjs
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { proj } from '../projection.mjs';
import { parseNodeId, parseTranslate } from '../dom.mjs';
import { computeAssetAnchor } from '../asset.mjs';
import { computeViewBox, parseViewBoxCorners } from '../viewbox.mjs';
import { mergeConfig, DEFAULTS } from '../constants.mjs';

describe('projection', () => {
  test('proj returns 2D point', () => {
    const p = proj(10, 20, 0);
    assert.strictEqual(typeof p.x, 'number');
    assert.strictEqual(typeof p.y, 'number');
  });
  test('proj(0,0,0) is origin', () => {
    const p = proj(0, 0, 0);
    assert.strictEqual(p.x, 0);
    assert.strictEqual(p.y, 0);
  });
});

describe('dom', () => {
  test('parseNodeId strips service- prefix', () => {
    assert.strictEqual(parseNodeId('service-s3'), 's3');
    assert.strictEqual(parseNodeId('group-cloud'), 'cloud');
  });
  test('parseNodeId returns id when no prefix', () => {
    assert.strictEqual(parseNodeId('s3'), 's3');
    assert.strictEqual(parseNodeId(''), '');
  });
  test('parseTranslate extracts x,y', () => {
    const t = parseTranslate('translate(100, 50)');
    assert.strictEqual(t.x, 100);
    assert.strictEqual(t.y, 50);
  });
  test('parseTranslate returns zeros for invalid', () => {
    const t = parseTranslate('scale(2)');
    assert.strictEqual(t.x, 0);
    assert.strictEqual(t.y, 0);
  });
});

describe('asset', () => {
  test('computeAssetAnchor returns point', () => {
    const a = computeAssetAnchor(80, 'vertex-near-label');
    assert.strictEqual(typeof a.x, 'number');
    assert.strictEqual(typeof a.y, 'number');
  });
  test('computeAssetAnchor floor-center is midpoint', () => {
    const a = computeAssetAnchor(80, 'floor-center');
    const expected = proj(40, 40, 0);
    assert.strictEqual(a.x, expected.x);
    assert.strictEqual(a.y, expected.y);
  });
});

describe('viewbox', () => {
  test('parseViewBoxCorners returns four corners', () => {
    const c = parseViewBoxCorners('0 0 100 80');
    assert.ok(Array.isArray(c));
    assert.strictEqual(c.length, 4);
    assert.deepStrictEqual(c[0], [0, 0]);
    assert.deepStrictEqual(c[2], [100, 80]);
  });
  test('parseViewBoxCorners returns null for invalid', () => {
    assert.strictEqual(parseViewBoxCorners(''), null);
    assert.strictEqual(parseViewBoxCorners('0 0'), null);
  });
  test('computeViewBox returns string', () => {
    const corners = [[0, 0], [100, 0], [100, 80], [0, 80]];
    const vb = computeViewBox(corners, 10, 20);
    assert.strictEqual(typeof vb, 'string');
    assert.ok(vb.includes(' '));
  });
});

describe('config', () => {
  test('mergeConfig merges overrides', () => {
    const merged = mergeConfig({}, { nodeIconSize: 100 });
    assert.strictEqual(merged.nodeIconSize, 100);
  });
  test('mergeConfig keeps defaults for missing keys', () => {
    const merged = mergeConfig({}, {});
    assert.strictEqual(merged.nodeIconSize, DEFAULTS.nodeIconSize);
  });
});
