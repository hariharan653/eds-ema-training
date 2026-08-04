/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-gallery
 * Base block: cards
 * Source: https://wknd-trendsetters.site/about-us
 * Generated: 2026-08-04
 *
 * Library convention: Cards is a 2-column block. First row is the block name.
 * Each subsequent row is a card: [image/icon, text content].
 * This gallery variant is image-only (each card is just a cover image), so the
 * text content cell is empty. Every row keeps 2 cells to match the column count.
 */
export default function parse(element, { document }) {
  // Each gallery card is a wrapper div (utility-aspect-*) holding a cover image.
  const items = element.querySelectorAll(':scope > div, :scope > .utility-aspect-1x1, [class*="utility-aspect"]');

  const cells = [];

  items.forEach((item) => {
    const img = item.querySelector('img');
    if (img) {
      // 2-column row: image + empty text cell to preserve column count.
      cells.push([img, '']);
    }
  });

  // Empty-block guard
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-gallery', cells });
  element.replaceWith(block);
}
