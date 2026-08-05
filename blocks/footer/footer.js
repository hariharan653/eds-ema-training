import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer content from the fragment (localhost / aem up first, then DA/EDS)
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // classify the section columns: a column with a heading is a navigation column;
  // the column without a heading is the brand column (logo + social icons).
  // Note: EDS wraps default content in a `.default-content-wrapper`, so queries
  // must not assume the paragraph/list are direct children of the column.
  const columns = [...footer.children];
  columns.forEach((col) => {
    col.classList.add('footer-column');
    const heading = col.querySelector('h1, h2, h3, h4, h5, h6');

    if (heading) {
      col.classList.add('footer-nav');
      heading.classList.add('footer-nav-heading');
      const list = col.querySelector('ul');
      if (list) {
        list.classList.add('footer-nav-list');
        list.querySelectorAll('a').forEach((a) => a.classList.add('footer-nav-link'));
      }
      return;
    }

    // brand column: first link is the logo, the list holds social icon links
    col.classList.add('footer-brand');
    const brandLink = col.querySelector('p a') || col.querySelector('a');
    if (brandLink) brandLink.classList.add('footer-logo');
    const socialList = col.querySelector('ul');
    if (socialList) {
      socialList.classList.add('footer-social');
      socialList.querySelectorAll('a').forEach((a) => {
        a.classList.add('footer-social-link');
        // expose the label to assistive tech, then hide the visible text (icon only)
        const label = a.textContent.trim();
        if (label) a.setAttribute('aria-label', label);
        [...a.childNodes].forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) node.remove();
        });
      });
    }
  });

  block.append(footer);
}
