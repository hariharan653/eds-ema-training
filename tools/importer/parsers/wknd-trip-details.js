/* eslint-disable */
/* global WebImporter */
/**
 * Parser for wknd-trip-details. Base block: (custom spec list).
 * Source: WKND adventure detail pages (.contentfragment.cmp-contentfragment--elements).
 * Generated: 2026-08-05
 *
 * Structure (per wknd-trip-details decorator): one row per spec pair,
 *   cell 1 = label (e.g. "Activity"), cell 2 = value (e.g. "Rock Climbing").
 * Source is an AEM content fragment rendered as a <dl> of dt/dd pairs.
 */
export default function parse(element, { document }) {
  const cells = [];
  const dts = Array.from(element.querySelectorAll('dt'));

  dts.forEach((dt) => {
    const dd = dt.nextElementSibling && dt.nextElementSibling.tagName === 'DD'
      ? dt.nextElementSibling : null;
    const label = (dt.textContent || '').trim();
    const value = dd ? (dd.textContent || '').trim() : '';
    if (!label) return;
    cells.push([label, value]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'wknd-trip-details', cells });
  element.replaceWith(block);
}
