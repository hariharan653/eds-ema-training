/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the WKND FAQ accordion. Emits an `accordion-faq` block (reusing
 * that block's decorator + CSS).
 * Source: WKND FAQ page (.accordion.panelcontainer → .cmp-accordion__item).
 * Generated: 2026-08-05
 *
 * Block table (accordion convention): row 0 = block name (added by createBlock);
 * each following row is one accordion item as 2 cells:
 *   [ title (question), content (answer) ].
 * Each source item: `.cmp-accordion__title` (question) + `.cmp-accordion__panel`
 * (answer body).
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.cmp-accordion__item'));
  const cells = [];

  items.forEach((item) => {
    const titleEl = item.querySelector('.cmp-accordion__title, .cmp-accordion__button, .cmp-accordion__header');
    const panel = item.querySelector('.cmp-accordion__panel');
    const title = titleEl ? (titleEl.textContent || '').trim() : '';

    let content = '';
    if (panel) {
      const nodes = Array.from(panel.childNodes).filter(
        (n) => n.nodeType !== Node.TEXT_NODE || n.textContent.trim(),
      );
      content = nodes.length ? nodes : panel;
    }

    // Both cells mandatory per accordion convention (title + content).
    if (title || content) cells.push([title, content]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
