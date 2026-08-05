/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import wkndFeaturedTeaserParser from './parsers/wknd-featured-teaser.js';
import cardsAdventuresWkndParser from './parsers/cards-adventures-wknd.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'wknd-featured-teaser': wkndFeaturedTeaserParser,
  'cards-adventures-wknd': cardsAdventuresWkndParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "adventures-listing",
  "description": "WKND Adventures index: title + intro teaser + trip card grid (All tab)",
  "urls": [
    "https://wknd.site/us/en/adventures.html"
  ],
  "blocks": [
    {
      "name": "wknd-featured-teaser",
      "instances": [
        ".teaser.cmp-teaser--hero"
      ]
    },
    {
      "name": "cards-adventures-wknd",
      "instances": [
        ".cmp-tabs__tabpanel--active .image-list.list"
      ]
    }
  ],
  "sections": [
    {
      "id": "sec-1",
      "name": "Intro",
      "selector": ".teaser.cmp-teaser--hero",
      "style": null,
      "blocks": [
        "wknd-featured-teaser"
      ],
      "defaultContent": []
    },
    {
      "id": "sec-2",
      "name": "All trips",
      "selector": ".cmp-tabs__tabpanel--active .image-list.list",
      "style": null,
      "blocks": [
        "cards-adventures-wknd"
      ],
      "defaultContent": []
    }
  ]
};

const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try { transformerFn.call(null, hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    if (blockDef.name.startsWith('section-')) return;
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
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
    executeTransformers('beforeTransform', main, payload);
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try { parser(block.element, { document, url, params }); }
        catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
      } else console.warn(`No parser found for block: ${block.name}`);
    });
    executeTransformers('afterTransform', main, payload);
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    const metaBlock = main.lastElementChild;
    if (metaBlock && metaBlock.tagName === 'TABLE') {
      const body = metaBlock.querySelector('tbody') || metaBlock;
      [['Theme', 'wknd'], ['Nav', '/us/nav'], ['Footer', '/us/footer']].forEach(([k, v]) => {
        const tr = document.createElement('tr');
        const kc = document.createElement('td'); kc.textContent = k;
        const vc = document.createElement('td'); vc.textContent = v;
        tr.append(kc, vc); body.append(tr);
      });
    }
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    const path = WebImporter.FileUtils.sanitizePath(new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''));
    return [{ element: main, path, report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) } }];
  },
};
