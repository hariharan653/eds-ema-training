/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import wkndImageCarouselParser from './parsers/wknd-image-carousel.js';
import wkndTripDetailsParser from './parsers/wknd-trip-details.js';
import wkndTripTabsParser from './parsers/wknd-trip-tabs.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'wknd-image-carousel': wkndImageCarouselParser,
  'wknd-trip-details': wkndTripDetailsParser,
  'wknd-trip-tabs': wkndTripTabsParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'adventure-detail',
  description: 'WKND adventure detail: image carousel, trip title, trip-details spec, Overview/Itinerary/What-to-Bring tabs',
  urls: [
    'https://wknd.site/us/en/adventures/climbing-new-zealand.html',
  ],
  blocks: [
    { name: 'wknd-image-carousel', instances: ['.carousel.cmp-carousel--mini'] },
    { name: 'wknd-trip-details', instances: ['.contentfragment.cmp-contentfragment--elements'] },
    { name: 'wknd-trip-tabs', instances: ['.tabs.panelcontainer'] },
  ],
  sections: [
    { id: 'sec-1', name: 'Carousel', selector: '.carousel.cmp-carousel--mini', style: null, blocks: ['wknd-image-carousel'], defaultContent: [] },
    { id: 'sec-2', name: 'Title + details', selector: '.title.cmp-title--underline', style: null, blocks: ['wknd-trip-details'], defaultContent: ['.title.cmp-title--underline'] },
    { id: 'sec-3', name: 'Trip tabs', selector: '.tabs.panelcontainer', style: null, blocks: ['wknd-trip-tabs'], defaultContent: [] },
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

    // 2. Discover blocks
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

    // 5b. Page-scope the WKND theme + point at the WKND header/footer fragments.
    const metaBlock = main.lastElementChild;
    if (metaBlock && metaBlock.tagName === 'TABLE') {
      const body = metaBlock.querySelector('tbody') || metaBlock;
      [['Theme', 'wknd'], ['Nav', '/us/nav'], ['Footer', '/us/footer']].forEach(([k, v]) => {
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
