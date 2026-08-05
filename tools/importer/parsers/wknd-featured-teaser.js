/* eslint-disable */
/* global WebImporter */
/**
 * Parser for wknd-featured-teaser. Base block: columns.
 * Source: https://wknd.site/us/en.html (#featured-teaser-home)
 * Generated: 2026-08-05
 *
 * Structure (per wknd-featured-teaser decorator): single row, 2 columns.
 *   col 0 = large image, col 1 = content (eyebrow + title + description + CTA).
 * Source is an AEM cmp-teaser with a content block and an image block.
 */
export default function parse(element, { document }) {
  // Image column
  const img = element.querySelector('.cmp-teaser__image img, .cmp-image img, img');
  const picture = img ? (img.closest('picture') || img) : '';

  // Content column
  const eyebrow = element.querySelector('.cmp-teaser__pretitle');
  const title = element.querySelector('.cmp-teaser__title, h1, h2, h3');
  const description = element.querySelector('.cmp-teaser__description, p:not(.cmp-teaser__pretitle)');
  const ctas = Array.from(element.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a'));

  const contentCell = [];
  if (eyebrow) contentCell.push(eyebrow);
  if (title) contentCell.push(title);
  if (description) contentCell.push(description);
  contentCell.push(...ctas);

  // Empty-block guard
  if (!picture && contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[picture, contentCell]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'wknd-featured-teaser', cells });
  element.replaceWith(block);
}
