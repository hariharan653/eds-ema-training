/* eslint-disable */
/* global WebImporter */
/**
 * Parser for wknd-article-hero. Base block: hero.
 * Source: WKND magazine article pages (/us/en/magazine/*).
 * Generated: 2026-08-05
 *
 * The mapped `element` is the article title block (`div.title` holding the h1).
 * The author byline is the sibling `div.title` (h4, "By ...") and the lead
 * banner image lives in a separate `main.cmp-layout-container--fixed` container.
 * We assemble a single-column, 2-row hero: [lead image], [title + byline], then
 * replace the title element and remove the consumed byline sibling so it is not
 * left behind as stray default content.
 */
export default function parse(element, { document }) {
  // Title (h1) inside the mapped element.
  const title = element.querySelector('h1.cmp-title__text, h1');

  // Author byline: the sibling .title block holding an h4 ("By ...").
  let bylineDiv = null;
  let byline = null;
  const parent = element.parentElement;
  if (parent) {
    const titleDivs = Array.from(parent.querySelectorAll(':scope > div.title'));
    bylineDiv = titleDivs.find((d) => d !== element && d.querySelector('h4')) || null;
    if (bylineDiv) byline = bylineDiv.querySelector('h4.cmp-title__text, h4');
  }

  // Lead banner image (from the fixed layout container, not the content column).
  const leadImg = document.querySelector(
    'main.cmp-layout-container--fixed > div.cmp-container > div.aem-Grid > div.image img, '
    + 'main.cmp-layout-container--fixed .cmp-image img',
  );
  const picture = leadImg ? (leadImg.closest('picture') || leadImg) : '';

  const textCell = [];
  if (title) textCell.push(title);
  if (byline) textCell.push(byline);

  // Empty-block guard.
  if (!picture && textCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  cells.push([picture]); // image-only row first
  cells.push([textCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'wknd-article-hero', cells });
  element.replaceWith(block);
  if (bylineDiv) bylineDiv.remove();
}
