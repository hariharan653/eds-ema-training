/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import columnsIntroParser from './parsers/columns-intro.js';
import columnsArticleParser from './parsers/columns-article.js';
import cardsGalleryParser from './parsers/cards-gallery.js';
import tabsTestimonialParser from './parsers/tabs-testimonial.js';
import cardsArticleParser from './parsers/cards-article.js';
import accordionFaqParser from './parsers/accordion-faq.js';
import heroBannerParser from './parsers/hero-banner.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-trendsetters-cleanup.js';
import sectionsTransformer from './transformers/wknd-trendsetters-sections.js';

// PARSER REGISTRY
const parsers = {
  'columns-intro': columnsIntroParser,
  'columns-article': columnsArticleParser,
  'cards-gallery': cardsGalleryParser,
  'tabs-testimonial': tabsTestimonialParser,
  'cards-article': cardsArticleParser,
  'accordion-faq': accordionFaqParser,
  'hero-banner': heroBannerParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'about-us',
  description: 'About/editorial landing page with hero, article header, image gallery, testimonials tabs, latest-articles cards, FAQ accordion, and CTA banner',
  urls: [
    'https://wknd-trendsetters.site/about-us',
  ],
  blocks: [
    { name: 'section-intro', instances: ['#main-content > header.section.secondary-section'], section: 'secondary' },
    { name: 'columns-intro', instances: ['#main-content > header.section.secondary-section > div.container > div.grid-layout'] },
    { name: 'columns-article', instances: ['#main-content > section.section:nth-of-type(1) > div.container > div.grid-layout'] },
    { name: 'section-gallery', instances: ['#main-content > section.section.secondary-section:nth-of-type(2)'], section: 'secondary' },
    { name: 'cards-gallery', instances: ['#main-content > section.section.secondary-section:nth-of-type(2) > div.container > div.grid-layout.grid-gap-sm'] },
    { name: 'tabs-testimonial', instances: ['#main-content > section.section:nth-of-type(3) > div.container > div.tabs-wrapper'] },
    { name: 'section-articles', instances: ['#main-content > section.section.secondary-section:nth-of-type(4)'], section: 'secondary' },
    { name: 'cards-article', instances: ['#main-content > section.section.secondary-section:nth-of-type(4) > div.container > div.grid-layout.grid-gap-md'] },
    { name: 'accordion-faq', instances: ['#main-content > section.section:nth-of-type(5) .faq-list'] },
    { name: 'hero-banner', instances: ['#main-content > section.section.inverse-section > div.container > div.grid-layout'] },
  ],
  sections: [
    { id: 'section-1', name: 'Intro', selector: '#main-content > header.section.secondary-section', style: 'secondary', blocks: ['columns-intro'], defaultContent: [] },
    { id: 'section-2', name: 'Article header', selector: '#main-content > section.section:nth-of-type(1)', style: null, blocks: ['columns-article'], defaultContent: [] },
    { id: 'section-3', name: 'Gallery', selector: '#main-content > section.section.secondary-section:nth-of-type(2)', style: 'secondary', blocks: ['cards-gallery'], defaultContent: ['#main-content > section.section.secondary-section:nth-of-type(2) > div.container > div.utility-text-align-center'] },
    { id: 'section-4', name: 'Testimonials', selector: '#main-content > section.section:nth-of-type(3)', style: null, blocks: ['tabs-testimonial'], defaultContent: [] },
    { id: 'section-5', name: 'Latest articles', selector: '#main-content > section.section.secondary-section:nth-of-type(4)', style: 'secondary', blocks: ['cards-article'], defaultContent: ['#main-content > section.section.secondary-section:nth-of-type(4) > div.container > div.utility-text-align-center'] },
    { id: 'section-6', name: 'FAQ', selector: '#main-content > section.section:nth-of-type(5)', style: null, blocks: ['accordion-faq'], defaultContent: ['#main-content > section.section:nth-of-type(5) > div.container > div.grid-layout > div:first-child'] },
    { id: 'section-7', name: 'CTA banner', selector: '#main-content > section.section.inverse-section', style: null, blocks: ['hero-banner'], defaultContent: [] },
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
