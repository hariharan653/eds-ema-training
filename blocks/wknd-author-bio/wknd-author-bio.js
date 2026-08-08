/**
 * WKND Author Bio — magazine article author card.
 * Variant of the vanilla `columns` block.
 *
 * Expected content (author view / import):
 *   Single row, 2 cells:
 *     Cell 1: author photo (picture)
 *     Cell 2: author name (h2) + role/occupations (p) + social links (list of a)
 *
 * Renders as photo-left / details-right on desktop, stacked on mobile.
 * Preceded on the page by a separator rule (authored as default content).
 *
 * @param {Element} block The block element
 */

// Inline social glyphs (currentColor) so the author's Facebook/Twitter/
// Instagram links render as icons like the source, not text labels.
const SOCIAL_ICONS = {
  facebook: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H17V3.6c-.29-.04-1.28-.12-2.43-.12-2.4 0-4.07 1.47-4.07 4.17v2.25H7.8V13h2.7v8h3z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" fill="currentColor"><path d="M21 5.9c-.66.3-1.37.5-2.12.6.76-.46 1.35-1.18 1.63-2.05-.72.43-1.51.73-2.35.9A3.68 3.68 0 0 0 12 8.6c0 .29.03.57.1.83A10.44 10.44 0 0 1 4.5 4.6a3.7 3.7 0 0 0 1.14 4.93c-.6-.02-1.16-.18-1.65-.45v.04c0 1.79 1.27 3.28 2.96 3.62-.31.08-.63.13-.97.13-.24 0-.47-.02-.69-.07a3.69 3.69 0 0 0 3.44 2.56A7.4 7.4 0 0 1 3 17.42a10.42 10.42 0 0 0 5.65 1.66c6.78 0 10.49-5.62 10.49-10.49v-.48c.72-.52 1.34-1.17 1.86-1.91z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" fill="currentColor"><path d="M12 7.4A4.6 4.6 0 1 0 16.6 12 4.6 4.6 0 0 0 12 7.4zm0 7.6A3 3 0 1 1 15 12a3 3 0 0 1-3 3zm4.8-7.8a1.08 1.08 0 1 1-1.08-1.08A1.08 1.08 0 0 1 16.8 7.2zM20 7.9a5.3 5.3 0 0 0-1.45-3.75A5.3 5.3 0 0 0 14.8 2.7c-1.48-.08-5.9-.08-7.38 0a5.3 5.3 0 0 0-3.75 1.45A5.3 5.3 0 0 0 2.22 7.9c-.08 1.48-.08 5.9 0 7.38a5.3 5.3 0 0 0 1.45 3.75 5.3 5.3 0 0 0 3.75 1.45c1.48.08 5.9.08 7.38 0a5.3 5.3 0 0 0 3.75-1.45 5.3 5.3 0 0 0 1.45-3.75c.08-1.48.08-5.9 0-7.38zm-1.94 8.97a3 3 0 0 1-1.71 1.71c-1.18.47-4 .36-5.31.36s-4.13.11-5.31-.36a3 3 0 0 1-1.71-1.71c-.47-1.18-.36-4-.36-5.31s-.11-4.13.36-5.31A3 3 0 0 1 6.69 4.5c1.18-.47 4-.36 5.31-.36s4.13-.11 5.31.36a3 3 0 0 1 1.71 1.71c.47 1.18.36 4 .36 5.31s.11 4.13-.36 5.31z"/></svg>',
};

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`wknd-author-bio-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('wknd-author-bio-img-col');
        }
      }
    });
  });

  // Group the name (h2) + role (p) so the details column can lay them out on
  // the left with the social buttons pushed to the far right (matches source,
  // where the bio row is name-left / icon-buttons-right on desktop).
  const detailsCol = [...block.firstElementChild.children]
    .find((c) => !c.classList.contains('wknd-author-bio-img-col'));
  if (detailsCol && !detailsCol.querySelector('.wknd-author-bio-name')) {
    const nameWrap = document.createElement('div');
    nameWrap.className = 'wknd-author-bio-name';
    detailsCol.querySelectorAll(':scope > h2, :scope > p').forEach((el) => nameWrap.append(el));
    detailsCol.prepend(nameWrap);
  }

  // Replace social link text with icon glyphs (keeping an accessible label).
  block.querySelectorAll('ul a').forEach((a) => {
    const label = (a.textContent || '').trim();
    let net = null;
    if (/face/i.test(label)) net = 'facebook';
    else if (/twit/i.test(label)) net = 'twitter';
    else if (/insta/i.test(label)) net = 'instagram';
    if (net && SOCIAL_ICONS[net]) {
      a.setAttribute('aria-label', label);
      a.innerHTML = SOCIAL_ICONS[net];
    }
  });

  // Pull-quote: MOST articles render the blockquote inside a grey box (large
  // Asar serif quote + yellow underline + attribution). But some sources (e.g.
  // arctic-surfing) render the blockquote as plain inline body text with no
  // box — so we skip the grey-box treatment on those paths and leave the
  // blockquote plain. The import flattened the styled quote to a bare
  // <blockquote> + attribution <p> (e.g. "- Sofia Sjöberg").
  const path = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
  const PLAIN_BLOCKQUOTE_PATHS = ['/us/en/magazine/arctic-surfing'];
  const section = block.closest('.section');
  if (section) {
    if (!PLAIN_BLOCKQUOTE_PATHS.includes(path)) {
      section.querySelectorAll(':scope > div:first-child blockquote').forEach((bq) => {
        if (bq.closest('.wknd-pullquote')) return; // already wrapped
        const box = document.createElement('div');
        box.className = 'wknd-pullquote';
        bq.replaceWith(box);
        box.append(bq);
        // pull in a following short attribution paragraph (starts with "-" or
        // is a brief credit line), if present
        let next = box.nextElementSibling;
        while (next && next.tagName === 'P' && next.textContent.trim() === '') {
          const empty = next; next = next.nextElementSibling; empty.remove();
        }
        if (next && next.tagName === 'P') {
          const t = next.textContent.trim();
          if (t && (t.startsWith('-') || t.startsWith('–') || t.length <= 40)) {
            next.classList.add('wknd-pullquote-attribution');
            box.append(next);
          }
        }
      });
    }

    const relLinks = section.querySelectorAll(':scope > div:last-child ul:last-of-type > li > a[href*="/magazine/"]');
    relLinks.forEach((a) => {
      if (a.querySelector('.wknd-share-title')) return; // already split
      const text = (a.textContent || '').trim();
      // match a trailing date like "Thursday, 9 Jul 2020"
      const m = text.match(/\s+((?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day,\s+.+)$/);
      if (m) {
        const title = text.slice(0, m.index).trim();
        const date = m[1].trim();
        a.textContent = '';
        const titleEl = document.createElement('span');
        titleEl.className = 'wknd-share-title';
        titleEl.textContent = title;
        const dateEl = document.createElement('span');
        dateEl.className = 'wknd-share-date';
        dateEl.textContent = date;
        a.append(titleEl, dateEl);
      }
    });
  }
}
