/* eslint-disable */
/* global WebImporter */
/**
 * Parser for wknd-trip-tabs. Base block: (custom tabs).
 * Source: WKND adventure detail pages (.tabs.panelcontainer).
 * Generated: 2026-08-05
 *
 * Structure (per wknd-trip-tabs decorator): one row per tab,
 *   cell 1 = tab label (e.g. "Overview"), cell 2 = panel content (headings,
 *   images, paragraphs, lists). Empty panels are tolerated.
 * Source is an AEM cmp-tabs: tab labels in `.cmp-tabs__tab`, panel bodies in
 * `.cmp-tabs__tabpanel` (same order).
 */
export default function parse(element, { document }) {
  const labels = Array.from(element.querySelectorAll('.cmp-tabs__tab'));
  const panels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel'));
  const cells = [];

  panels.forEach((panel, i) => {
    const label = labels[i] ? (labels[i].textContent || '').trim() : `Tab ${i + 1}`;
    // Move the panel's meaningful content into a cell. Keep the panel element's
    // children (headings, images, paragraphs, lists); drop empty wrappers.
    const content = [];
    Array.from(panel.childNodes).forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) content.push(node);
      else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = node.textContent.trim();
        content.push(p);
      }
    });
    cells.push([label, content.length ? content : '']);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'wknd-trip-tabs', cells });
  element.replaceWith(block);
}
