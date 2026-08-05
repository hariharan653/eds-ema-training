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

  // classify the section columns: the one with a logo link and no heading is the brand
  // column (logo + social icons); the rest are navigation columns.
  const columns = [...footer.children];
  columns.forEach((col) => {
    col.classList.add('footer-column');
    const heading = col.querySelector('h1, h2, h3, h4, h5, h6');
    const brandLink = col.querySelector(':scope > p a');

    if (brandLink && !heading) {
      col.classList.add('footer-brand');
      brandLink.classList.add('footer-logo');
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
    } else if (heading) {
      col.classList.add('footer-nav');
      heading.classList.add('footer-nav-heading');
      const list = col.querySelector('ul');
      if (list) {
        list.classList.add('footer-nav-list');
        list.querySelectorAll('a').forEach((a) => a.classList.add('footer-nav-link'));
      }
    }
  });

  block.append(footer);
}
