import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/* Inline social glyphs (currentColor) — the source uses the classic Facebook
   "f", Twitter bird, and Instagram marks. The imported SVG assets are the newer
   filled Facebook / X logos, so swap them for these to match the source. */
const SOCIAL_ICONS = {
  facebook: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H17V3.6c-.29-.04-1.28-.12-2.43-.12-2.4 0-4.07 1.47-4.07 4.17v2.25H7.8V13h2.7v8h3z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" fill="currentColor"><path d="M21 5.9c-.66.3-1.37.5-2.12.6.76-.46 1.35-1.18 1.63-2.05-.72.43-1.51.73-2.35.9A3.68 3.68 0 0 0 12 8.6c0 .29.03.57.1.83A10.44 10.44 0 0 1 4.5 4.6a3.7 3.7 0 0 0 1.14 4.93c-.6-.02-1.16-.18-1.65-.45v.04c0 1.79 1.27 3.28 2.96 3.62-.31.08-.63.13-.97.13-.24 0-.47-.02-.69-.07a3.69 3.69 0 0 0 3.44 2.56A7.4 7.4 0 0 1 3 17.42a10.42 10.42 0 0 0 5.65 1.66c6.78 0 10.49-5.62 10.49-10.49v-.48c.72-.52 1.34-1.17 1.86-1.91z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" fill="currentColor"><path d="M12 7.4A4.6 4.6 0 1 0 16.6 12 4.6 4.6 0 0 0 12 7.4zm0 7.6A3 3 0 1 1 15 12a3 3 0 0 1-3 3zm4.8-7.8a1.08 1.08 0 1 1-1.08-1.08A1.08 1.08 0 0 1 16.8 7.2zM20 7.9a5.3 5.3 0 0 0-1.45-3.75A5.3 5.3 0 0 0 14.8 2.7c-1.48-.08-5.9-.08-7.38 0a5.3 5.3 0 0 0-3.75 1.45A5.3 5.3 0 0 0 2.22 7.9c-.08 1.48-.08 5.9 0 7.38a5.3 5.3 0 0 0 1.45 3.75 5.3 5.3 0 0 0 3.75 1.45c1.48.08 5.9.08 7.38 0a5.3 5.3 0 0 0 3.75-1.45 5.3 5.3 0 0 0 1.45-3.75c.08-1.48.08-5.9 0-7.38zm-1.94 8.97a3 3 0 0 1-1.71 1.71c-1.18.47-4 .36-5.31.36s-4.13.11-5.31-.36a3 3 0 0 1-1.71-1.71c-.47-1.18-.36-4-.36-5.31s-.11-4.13.36-5.31A3 3 0 0 1 6.69 4.5c1.18-.47 4-.36 5.31-.36s4.13-.11 5.31.36a3 3 0 0 1 1.71 1.71c.47 1.18.36 4 .36 5.31s.11 4.13-.36 5.31z"/></svg>',
};

/**
 * Replace a social link's imported <img> icon with the matching classic inline
 * SVG glyph (inferred from its label / href), so the footer shows the source's
 * bird/"f"/camera marks rather than the newer X / filled-Facebook assets.
 */
function swapSocialIcon(a) {
  const hint = `${a.getAttribute('href') || ''} ${a.getAttribute('aria-label') || ''} ${a.textContent}`.toLowerCase();
  let net = '';
  if (/face/.test(hint)) net = 'facebook';
  else if (/twit|x\b/.test(hint)) net = 'twitter';
  else if (/insta/.test(hint)) net = 'instagram';
  if (!SOCIAL_ICONS[net]) return;
  a.querySelectorAll('img, picture').forEach((n) => n.remove());
  a.insertAdjacentHTML('afterbegin', SOCIAL_ICONS[net]);
}

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
    const list = col.querySelector('ul');
    // a list whose links carry images is a social-icon list (e.g. "Follow Us")
    const isSocialList = !!list && [...list.querySelectorAll('a')].some((a) => a.querySelector('img'));

    if (heading && !isSocialList) {
      col.classList.add('footer-nav');
      heading.classList.add('footer-nav-heading');
      if (list) {
        list.classList.add('footer-nav-list');
        list.querySelectorAll('a').forEach((a) => a.classList.add('footer-nav-link'));
      }
      return;
    }

    // social column: an explicit "Follow Us"-style heading over icon links
    if (heading && isSocialList) {
      col.classList.add('footer-social-column');
      heading.classList.add('footer-social-heading');
      list.classList.add('footer-social');
      list.querySelectorAll('a').forEach((a) => {
        a.classList.add('footer-social-link');
        const label = a.textContent.trim();
        if (label) a.setAttribute('aria-label', label);
        [...a.childNodes].forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) node.remove();
        });
        swapSocialIcon(a);
      });
      return;
    }

    // a column with no heading and no list is a legal/copyright column — it may
    // contain inline links (e.g. Core Components, Adobe Stock) but has no image
    // (logo) — which is what distinguishes it from the brand column.
    const hasImage = !!col.querySelector('img');
    if (!hasImage) {
      col.classList.add('footer-legal');
      return;
    }

    // brand column: first link is the logo, the list holds social icon links
    col.classList.add('footer-brand');
    const brandLink = col.querySelector('p a') || col.querySelector('a');
    if (brandLink) brandLink.classList.add('footer-logo');
    const socialList = list;
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
        swapSocialIcon(a);
      });
    }
  });

  block.append(footer);
}
