/* eslint-disable */
/* global WebImporter */
/**
 * Parser for wknd-teaser. Base block: hero.
 * Source: https://wknd.site/us/en.html (.teaser.cmp-teaser--imagebottom)
 * Generated: 2026-08-05
 *
 * Structure (per wknd-teaser decorator): single column.
 *   Row 1 = background image (decorator checks first div for a picture).
 *   Row 2 = content (title + description + CTA) overlaid on the image.
 * Source is an AEM cmp-teaser with a content block and an image block.
 */
export default function parse(element, { document }) {
  // Background image row
  const img = element.querySelector('.cmp-teaser__image img, .cmp-image img, img');
  const picture = img ? (img.closest('picture') || img) : '';

  // Content row
  const title = element.querySelector('.cmp-teaser__title, h1, h2, h3');
  const description = element.querySelector('.cmp-teaser__description, p');
  const ctas = Array.from(element.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a'));

  const contentCell = [];
  if (title) contentCell.push(title);
  if (description) contentCell.push(description);
  contentCell.push(...ctas);

  // Empty-block guard
  if (!picture && contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  // Image first so decorator's ':scope > div:first-child picture' check passes.
  cells.push([picture]);
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'wknd-teaser', cells });
  element.replaceWith(block);
}
