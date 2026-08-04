/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: wknd-trendsetters site-wide cleanup.
 * Removes non-authorable global chrome and layout artifacts.
 * All selectors verified against migration-work/cleaned.html.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Non-authorable breadcrumbs live INSIDE the article-header block's grid
    // (verified: <div class="breadcrumbs"> in #main-content > section.section:nth-of-type(1)).
    // Remove before block parsing so they don't pollute the columns-article block.
    WebImporter.DOMUtils.remove(element, [
      '.breadcrumbs',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable global chrome (verified in cleaned.html).
    // NOTE: section-1 (Intro) is authored as <header class="section secondary-section">,
    // so we must NOT use a bare `header` selector. Only remove specific chrome by class.
    WebImporter.DOMUtils.remove(element, [
      '.skip-link',        // <a href="#main-content" class="skip-link">
      '.navbar',           // top navigation container <div class="navbar">
      'footer.footer',     // site footer <footer class="footer inverse-footer">
      'noscript',
      'iframe',
      'link',
    ]);
  }
}
