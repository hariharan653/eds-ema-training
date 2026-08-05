/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-adventures-wknd. Base block: cards.
 * Source: https://wknd.site/us/en.html (adventures image-list)
 * Generated: 2026-08-05
 *
 * Library convention (cards): 2 columns, one row per card.
 *   col 0 = image (mandatory), col 1 = text content (title as heading + description).
 * Source is an AEM cmp-image-list: each <li.cmp-image-list__item> holds an
 * image link, a title link, and a description span (trip/adventure cards).
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.cmp-image-list__item, li'));

  const cells = [];

  items.forEach((item) => {
    // Image column
    const img = item.querySelector('.cmp-image-list__item-image img, .cmp-image img, img');
    const picture = img ? (img.closest('picture') || img) : '';

    // Body column: linked title (as heading) + description
    const titleLink = item.querySelector('.cmp-image-list__item-title-link');
    const titleText = item.querySelector('.cmp-image-list__item-title');
    const description = item.querySelector('.cmp-image-list__item-description');

    const bodyCell = [];
    // Title styled as a heading, wrapping a link so the card is clickable.
    if (titleLink) {
      const href = titleLink.getAttribute('href');
      const link = document.createElement('a');
      link.setAttribute('href', href);
      link.textContent = (titleText ? titleText.textContent : titleLink.textContent).trim();
      const heading = document.createElement('h3');
      heading.append(link);
      bodyCell.push(heading);
    } else if (titleText) {
      const heading = document.createElement('h3');
      heading.textContent = titleText.textContent.trim();
      bodyCell.push(heading);
    }
    if (description) bodyCell.push(description);

    // Skip empty cards
    if (!picture && bodyCell.length === 0) return;

    cells.push([picture, bodyCell]);
  });

  // Empty-block guard
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-adventures-wknd', cells });
  element.replaceWith(block);
}
