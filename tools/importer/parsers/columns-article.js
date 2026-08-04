/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-article
 * Base block: columns
 * Source: https://wknd-trendsetters.site/about-us
 * Generated: 2026-08-04
 *
 * Library convention: Columns is a flexible block. First row is the block name.
 * Subsequent rows contain one cell per visual column. Column count is derived
 * from the natural grouping of content in the source.
 *
 * Source structure: a grid-layout with 2 direct child divs — an image column and
 * a content column (breadcrumbs, heading, author/date meta) — so one 2-column row.
 */
export default function parse(element, { document }) {
  // Direct children of the grid layout are the columns.
  const columns = element.querySelectorAll(':scope > div');

  const cells = [];

  if (columns.length) {
    // One content row, one cell per column. Keep the full column content
    // (image, breadcrumbs, heading, meta) by referencing each column element.
    const row = Array.from(columns).map((col) => col);
    cells.push(row);
  }

  // Empty-block guard
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-article', cells });
  element.replaceWith(block);
}
