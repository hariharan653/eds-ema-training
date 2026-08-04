/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-faq
 * Base block: accordion
 * Source: https://wknd-trendsetters.site/about-us
 * Generated: 2026-08-04
 *
 * Library convention: Accordion is a 2-column block. First row is the block name.
 * Each subsequent row is an accordion item with 2 cells: [title, content].
 */
export default function parse(element, { document }) {
  // Each accordion item in the source is a <details class="faq-item">
  const items = element.querySelectorAll(':scope > details, :scope > .faq-item, details.faq-item');

  const cells = [];

  items.forEach((item) => {
    // Title: the clickable summary/question. Prefer inner span text wrapper, fall back to summary itself.
    const summary = item.querySelector('summary, .faq-question');
    const titleSource = summary ? (summary.querySelector('span') || summary) : null;

    // Content: the answer body (may contain paragraphs, media, etc.)
    const answer = item.querySelector('.faq-answer, div');

    // Build title cell — preserve text content
    let titleCell = '';
    if (titleSource) {
      titleCell = titleSource.textContent.trim();
    }

    // Build content cell — reference the answer element to preserve semantic HTML
    let contentCell = '';
    if (answer) {
      const contentNodes = Array.from(answer.childNodes).filter((n) => {
        return n.nodeType !== Node.TEXT_NODE || n.textContent.trim();
      });
      contentCell = contentNodes.length ? contentNodes : answer;
    }

    // Only add a row if we have a title (mandatory)
    if (titleCell || contentCell) {
      cells.push([titleCell, contentCell]);
    }
  });

  // Empty-block guard: if no items found, unwrap
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
