/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-intro
 * Base block: columns
 * Source: https://wknd-trendsetters.site/about-us
 * Generated: 2026-08-04
 *
 * Library convention: Columns is a flexible block. First row is the block name.
 * Subsequent rows contain one cell per visual column, derived from the natural
 * grouping of source content.
 *
 * Source structure: a grid-layout with 2 direct child divs — a text column
 * (h1 heading, subheading paragraph, button group) and an image column (a grid
 * of cover images) — so one 2-column row.
 */
export default function parse(element, { document }) {
  // Direct children of the grid layout are the columns.
  const columns = element.querySelectorAll(':scope > div');

  const cells = [];

  if (columns.length) {
    // One content row, one cell per column, referencing each column element to
    // preserve headings, paragraphs, buttons, and images.
    const row = Array.from(columns).map((col) => col);
    cells.push(row);
  }

  // Empty-block guard
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-intro', cells });
  element.replaceWith(block);
}
