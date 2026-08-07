/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
// (none — the us-es "Coming Soon" stub is entirely default content: heading + image + hr)

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'us-es',
  description: "WKND Spanish 'Coming Soon' placeholder: a hero teaser (h2 + large image) and a horizontal separator. Minimal stub, entirely default content (no blocks).",
  urls: [
    'https://wknd.site/us/es.html',
  ],
  blocks: [],
  sections: [
    { id: 'sec-1', name: 'section-hero-coming-soon', selector: 'main.container.responsivegrid > div.cmp-container > div.teaser.cmp-teaser--hero', style: null, blocks: [], defaultContent: ['div.teaser.cmp-teaser--hero .cmp-teaser__image .cmp-image img', 'div.teaser.cmp-teaser--hero .cmp-teaser__title'] },
    { id: 'sec-2', name: 'section-separator', selector: 'main.container.responsivegrid > div.cmp-container > main.container.responsivegrid.cmp-layout-container--fixed', style: null, blocks: [], defaultContent: ['main.container.responsivegrid.cmp-layout-container--fixed .cmp-separator__horizontal-rule'] },
  ],
};

// TRANSFORMER REGISTRY - cleanup first, sections after (when 2+ sections)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all parseable block instances on the page (skips section-* metadata entries)
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    if (blockDef.name.startsWith('section-')) return; // handled by sections transformer
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element, section: blockDef.section || null });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. beforeTransform cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. Discover blocks (none for this template)
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements already replaced)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform cleanup + section breaks/metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);

    // 5b. Page-scope the WKND theme so its design does not leak into other
    // templates. decorateTemplateAndTheme() adds a "wknd" class to <body> from
    // this metadata row; brand/block CSS is scoped under body.wknd. Nav/Footer
    // point at the shared WKND header & footer fragments (the header's language
    // selector already exposes es-US as a locale). Template "us-es" adds a
    // body.us-es class so this stub's hero layout (full-bleed image above the
    // heading, matching the source) can be scoped without affecting other pages.
    const metaBlock = main.lastElementChild;
    if (metaBlock && metaBlock.tagName === 'TABLE') {
      const body = metaBlock.querySelector('tbody') || metaBlock;
      [['Template', 'us-es'], ['Theme', 'wknd'], ['Nav', '/us/nav'], ['Footer', '/us/footer']].forEach(([k, v]) => {
        const tr = document.createElement('tr');
        const keyCell = document.createElement('td');
        keyCell.textContent = k;
        const valCell = document.createElement('td');
        valCell.textContent = v;
        tr.append(keyCell, valCell);
        body.append(tr);
      });
    }

    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
