/* eslint-disable */
/* global WebImporter */
/**
 * Parser for wknd-image-carousel. Base block: carousel (image-only).
 * Source: WKND adventure detail pages (.carousel.cmp-carousel--mini).
 * Generated: 2026-08-05
 *
 * Structure (per wknd-image-carousel decorator): one row per slide, each row
 * holding a single image cell. Source is an AEM cmp-carousel with N items,
 * each item containing an image.
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.cmp-carousel__item'));
  const cells = [];

  items.forEach((item) => {
    const img = item.querySelector('img');
    if (!img) return;
    const picture = img.closest('picture') || img;
    cells.push([picture]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'wknd-image-carousel', cells });
  element.replaceWith(block);
}
