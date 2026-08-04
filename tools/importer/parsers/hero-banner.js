/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-banner
 * Base block: hero
 * Source: https://wknd-trendsetters.site/about-us
 * Generated: 2026-08-04
 *
 * Library convention: Hero is a 1-column block with 3 rows.
 * Row 1: block name. Row 2: background image (optional). Row 3: title,
 * subheading, and CTA (each optional). Every content row has exactly 1 cell.
 *
 * Source structure: a relative-positioned container with a cover image
 * (background) and a card-body holding the heading, subheading, and button.
 */
export default function parse(element, { document }) {
  // Background image — the cover image behind the content.
  const bgImage = element.querySelector('img.cover-image, img[class*="overlay"], img');

  // Text content — heading, subheading, and CTA buttons from the card body.
  const heading = element.querySelector('h1, h2, [class*="h1-heading"], [class*="heading"]');
  const subheading = element.querySelector('p.subheading, p[class*="subheading"], .card-body p');
  const ctaLinks = Array.from(element.querySelectorAll('.button-group a, a.button'));

  const cells = [];

  // Row 2: background image (only if present).
  if (bgImage) {
    cells.push([bgImage]);
  }

  // Row 3: single cell holding all text content.
  const contentCell = [];
  if (heading) contentCell.push(heading);
  if (subheading) contentCell.push(subheading);
  contentCell.push(...ctaLinks);

  // Empty-block guard
  if (!bgImage && contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
