/**
 * Factory for isoflow instances. Functional, compositional, no globals.
 * Each instance has its own config and render counter. Dependencies are injected.
 *
 * @param {Object} [deps] - Dependencies
 * @param {Document} [deps.document] - Document for DOM ops (default: global document)
 * @param {() => Promise<object>} [deps.getMermaid] - Async loader for mermaid (default: dynamic import)
 * @returns {Object} { initialize, render, run, parse }
 */

import { mergeConfig, DEFAULTS } from './constants.mjs';
import { applyIsoflowTransform } from './transform.mjs';
import { DEFAULT_RUN_SELECTOR } from './selectors.mjs';

function defaultGetMermaid() {
  if (typeof window !== 'undefined' && window.mermaid) return Promise.resolve(window.mermaid);
  return import('mermaid').then((m) => m.default || m);
}

export function createIsoflow(deps = {}) {
  const doc = deps.document ?? (typeof document !== 'undefined' ? document : null);
  const getMermaid = deps.getMermaid ?? defaultGetMermaid;
  let config = { ...DEFAULTS };
  let mermaidLib = null;
  let renderCounter = 0;

  async function ensureMermaid() {
    if (!mermaidLib) {
      mermaidLib = await getMermaid();
      mermaidLib.initialize({ startOnLoad: false, securityLevel: 'loose', ...config });
    }
    return mermaidLib;
  }

  return {
    initialize(overrides = {}) {
      config = mergeConfig(config, overrides);
      mermaidLib = null;
    },
    async render(id, text, containerElement) {
      const mermaid = await ensureMermaid();
      const renderId = `isoflow-${renderCounter++}`;
      const { svg } = await mermaid.render(renderId, text);
      const div = doc.createElement('div');
      div.id = id;
      div.className = 'mermaid-isoflow-container';
      div.innerHTML = svg;
      if (containerElement) containerElement.appendChild(div);
      const svgElement = div.querySelector('svg');
      if (svgElement) {
        svgElement.removeAttribute('width');
        svgElement.removeAttribute('height');
        applyIsoflowTransform(svgElement, config);
      }
      return { svg, element: div };
    },
    async run(options = {}) {
      const selector = options.querySelector ?? DEFAULT_RUN_SELECTOR;
      const nodes = options.nodes ? Array.from(options.nodes) : Array.from(doc.querySelectorAll(selector));
      for (let i = 0; i < nodes.length; i++) {
        const element = nodes[i];
        const text = element.textContent?.trim();
        if (!text) continue;
        const elementId = element.id || `isoflow-${i}`;
        const { element: rendered } = await this.render(elementId, text);
        element.parentNode?.replaceChild(rendered, element);
      }
    },
    async parse(text) {
      const mermaid = await ensureMermaid();
      return mermaid.parse(text);
    },
  };
}
