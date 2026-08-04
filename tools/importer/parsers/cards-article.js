/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-article
 * Base block: cards
 * Source: https://wknd-trendsetters.site/about-us
 * Generated: 2026-08-04
 *
 * Library convention: Cards is a 2-column block. First row is the block name.
 * Each subsequent row is a card: [image/icon, text content].
 * Text content cell may hold title (heading), description, and CTA link.
 */
export default function parse(element, { document }) {
  // Each card is an anchor with class article-card (card-link).
  const cards = element.querySelectorAll(':scope > a.article-card, :scope > .article-card, a.card-link');

  const cells = [];

  cards.forEach((card) => {
    // Image cell — the cover image inside the card image wrapper.
    const img = card.querySelector('.article-card-image img, img');

    // Text content cell — meta (tag/date), heading, and a CTA link.
    const textCell = [];

    const meta = card.querySelector('.article-card-meta');
    if (meta) textCell.push(meta);

    const heading = card.querySelector('h1, h2, h3, h4, h5, h6, [class*="heading"]');
    if (heading) textCell.push(heading);

    // The whole card is a link — surface it as a CTA using the heading text.
    const href = card.getAttribute('href');
    if (href) {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = heading ? heading.textContent.trim() : 'Read more';
      textCell.push(link);
    }

    // Only add a row if we have essential content.
    if (img || textCell.length) {
      cells.push([img || '', textCell.length ? textCell : '']);
    }
  });

  // Empty-block guard
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  element.replaceWith(block);
}
