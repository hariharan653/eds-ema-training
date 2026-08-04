/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-testimonial
 * Base block: tabs
 * Source: https://wknd-trendsetters.site/about-us
 * Generated: 2026-08-04
 *
 * Library convention: Tabs is a 2-column block. First row is the block name.
 * Each subsequent row is a single tab: [tab label, tab content].
 *
 * Source structure: a tabs-wrapper containing a .tabs-content group of
 * .tab-pane panels (the content, one per testimonial) and a .tab-menu group of
 * buttons (the labels, one per testimonial). Panels and buttons are paired by
 * their data-tab-index / data-tab-target ordering.
 */
export default function parse(element, { document }) {
  // Tab labels — the clickable menu buttons.
  const labels = Array.from(element.querySelectorAll('.tab-menu .tab-menu-link, .tab-menu button, [role="tab"]'));
  // Tab content panels.
  const panes = Array.from(element.querySelectorAll('.tabs-content .tab-pane, .tab-pane, [role="tabpanel"]'));

  const cells = [];

  const count = Math.max(labels.length, panes.length);
  for (let i = 0; i < count; i += 1) {
    const label = labels[i];
    const pane = panes[i];

    // Label cell — prefer the inner content (name/role) of the button; fall back to the button.
    let labelCell = '';
    if (label) {
      const inner = label.querySelector(':scope > div') || label;
      labelCell = inner;
    }

    // Content cell — the full panel content (image + testimonial text).
    let contentCell = '';
    if (pane) {
      const inner = pane.querySelector(':scope > div') || pane;
      contentCell = inner;
    }

    if (labelCell || contentCell) {
      cells.push([labelCell, contentCell]);
    }
  }

  // Empty-block guard
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-testimonial', cells });
  element.replaceWith(block);
}
