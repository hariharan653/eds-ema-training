/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import wkndArticleHeroParser from './parsers/wknd-article-hero.js';
import wkndAuthorBioParser from './parsers/wknd-author-bio.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'wknd-article-hero': wkndArticleHeroParser,
  'wknd-author-bio': wkndAuthorBioParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'magazine-article',
  description: 'WKND magazine article detail: lead image + title + author byline, article body (default content), author bio card',
  urls: [
    'https://wknd.site/us/en/magazine/western-australia.html',
  ],
  blocks: [
    { name: 'wknd-article-hero', instances: ['main.responsivegrid > div.cmp-container > div.title:nth-of-type(1)'] },
    { name: 'wknd-author-bio', instances: ['main.responsivegrid .experiencefragment:has(.cmp-byline)'] },
  ],
  sections: [
    { id: 'sec-1', name: 'Article hero', selector: 'main.responsivegrid > div.cmp-container', style: null, blocks: ['wknd-article-hero'], defaultContent: [] },
    { id: 'sec-2', name: 'Article body', selector: 'main.responsivegrid article.contentfragment', style: null, blocks: [], defaultContent: ['main.responsivegrid article.contentfragment'] },
    { id: 'sec-3', name: 'Author bio', selector: 'main.responsivegrid .experiencefragment:has(.cmp-byline)', style: null, blocks: ['wknd-author-bio'], defaultContent: [] },
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
