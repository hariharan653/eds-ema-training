/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import wkndHeroCarouselParser from './parsers/wknd-hero-carousel.js';
import wkndFeaturedTeaserParser from './parsers/wknd-featured-teaser.js';
import cardsArticlesWkndParser from './parsers/cards-articles-wknd.js';
import wkndTeaserParser from './parsers/wknd-teaser.js';
import cardsAdventuresWkndParser from './parsers/cards-adventures-wknd.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'wknd-hero-carousel': wkndHeroCarouselParser,
  'wknd-featured-teaser': wkndFeaturedTeaserParser,
  'cards-articles-wknd': cardsArticlesWkndParser,
  'wknd-teaser': wkndTeaserParser,
  'cards-adventures-wknd': cardsAdventuresWkndParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'us-en',
  description: 'WKND Adventures homepage: hero carousel, featured article teaser, recent articles list, featured trip teaser, adventures list, plus header/footer',
  urls: [
    'https://wknd.site/us/en.html',
  ],
  blocks: [
    { name: 'wknd-hero-carousel', instances: ['.carousel.cmp-carousel--hero'] },
    { name: 'wknd-featured-teaser', instances: ['#featured-teaser-home'] },
    { name: 'cards-articles-wknd', instances: ['#container-9c4899b718 > div.aem-Grid > div.image-list.list:nth-of-type(3)'] },
    { name: 'wknd-teaser', instances: ['.teaser.cmp-teaser--imagebottom'] },
    { name: 'cards-adventures-wknd', instances: ['#container-4d3fed64ff > div.aem-Grid > div.image-list.list:nth-of-type(2)'] },
  ],
  sections: [
    { id: 'rc2', name: 'Hero carousel', selector: '.carousel.cmp-carousel--hero', style: null, blocks: ['wknd-hero-carousel'], defaultContent: [] },
    { id: 'rc3', name: 'Featured article', selector: '#featured-teaser-home', style: null, blocks: ['wknd-featured-teaser'], defaultContent: [] },
    { id: 'rc5', name: 'Recent articles', selector: '#container-9c4899b718', style: null, blocks: ['cards-articles-wknd'], defaultContent: ['#container-9c4899b718 > div.aem-Grid > div.title.cmp-title--underline:nth-of-type(2)', '#container-9c4899b718 > div.aem-Grid > div.button.cmp-button--primary:nth-of-type(4)', '#container-9c4899b718 > div.aem-Grid > div.title.cmp-title--underline:nth-of-type(6)'] },
    { id: 'rc9', name: 'Featured trip', selector: '.teaser.cmp-teaser--imagebottom', style: null, blocks: ['wknd-teaser'], defaultContent: [] },
    { id: 'rc11', name: 'Adventures', selector: '#container-4d3fed64ff', style: null, blocks: ['cards-adventures-wknd'], defaultContent: ['#container-4d3fed64ff > div.aem-Grid > div.title:nth-of-type(1)', '#container-4d3fed64ff > div.aem-Grid > div.button.cmp-button--primary:nth-of-type(3)'] },
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

    // 5b. Page-scope the WKND theme so its design does not leak into other
    // templates (e.g. about-us). decorateTemplateAndTheme() adds a "wknd" class
    // to <body> from this metadata row; brand/block CSS is scoped under body.wknd.
    // createMetadata appends the metadata block last, so it is main's last child
    // (at transform time the block is a <table>; append a Theme/wknd row to it).
    const metaBlock = main.lastElementChild;
    if (metaBlock && metaBlock.tagName === 'TABLE') {
      const body = metaBlock.querySelector('tbody') || metaBlock;
      // Theme scopes the WKND design; Nav/Footer point at the WKND-specific
      // header & footer fragments so the about-us page keeps its defaults.
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
