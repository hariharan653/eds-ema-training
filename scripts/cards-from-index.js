/*
 * Shared helper for index-driven card grids (cards-articles-wknd,
 * cards-adventures-wknd). Fetches an EDS query-index.json, filters/sorts the
 * entries, and rebuilds authored-shape rows (image cell + body cell) into the
 * block so each block's own transform produces byte-identical card DOM.
 *
 * Keeping this in one place means new dynamic card grids reuse the same
 * fetch/filter/build logic instead of duplicating it per block.
 */

import { createOptimizedPicture } from './aem.js';

const indexCache = new Map();

/**
 * Fetch + cache an EDS query index. Returns its `data` array, or [] on any
 * failure (so callers can fall back to authored content).
 * @param {string} indexPath e.g. '/us/en/query-index.json'
 * @returns {Promise<Array<object>>}
 */
export async function fetchIndex(indexPath) {
  if (!indexCache.has(indexPath)) {
    const p = fetch(indexPath)
      .then((resp) => (resp.ok ? resp.json() : { data: [] }))
      .then((json) => (Array.isArray(json?.data) ? json.data : []))
      .catch(() => []);
    indexCache.set(indexPath, p);
  }
  return indexCache.get(indexPath);
}

/**
 * Keep only entries whose path is UNDER the given prefix (i.e. a child page,
 * not the prefix/listing page itself), that have a title, and are not in
 * excludePaths. e.g. filterByPathPrefix(data, '/us/en/magazine/').
 * @param {Array<object>} entries
 * @param {string} prefix path prefix ending in '/'
 * @param {string[]} [excludePaths] exact paths to drop
 */
export function filterByPathPrefix(entries, prefix, excludePaths = []) {
  return entries.filter((e) => e.path
    && e.title
    && e.path.startsWith(prefix)
    && e.path !== prefix.replace(/\/$/, '')
    && !excludePaths.includes(e.path));
}

/** Sort entries alphabetically by title (self-maintaining, no hardcoded order). */
export function sortByTitle(entries) {
  return [...entries].sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Build one authored-shape row (image cell + body cell) from an index entry.
 * Mirrors the hand-authored block markup so the block's ul/li transform yields
 * identical DOM: <div><div><picture><img></div><div><h3><a>Title</a></h3>
 * <p>description</p></div></div>.
 * @param {object} entry index row with path/title/description/image
 * @returns {HTMLElement}
 */
export function rowFromEntry(entry) {
  const row = document.createElement('div');

  const imgCell = document.createElement('div');
  const picture = document.createElement('picture');
  const img = document.createElement('img');
  // strip any existing rendition query so createOptimizedPicture builds clean params
  [img.src] = (entry.image || '').split('?');
  img.alt = entry.title || '';
  picture.append(img);
  imgCell.append(picture);

  const bodyCell = document.createElement('div');
  const h3 = document.createElement('h3');
  const a = document.createElement('a');
  a.href = entry.path;
  a.textContent = entry.title;
  h3.append(a);
  bodyCell.append(h3);
  if (entry.description) {
    const p = document.createElement('p');
    p.textContent = entry.description;
    bodyCell.append(p);
  }
  row.append(imgCell, bodyCell);
  return row;
}

/**
 * Replace a block's children with authored-shape rows built from index entries,
 * so the block's own transform renders them as cards. No-op (returns false) if
 * there are no entries, so the caller keeps whatever authored content exists.
 * @param {HTMLElement} block
 * @param {Array<object>} entries already filtered/sorted index rows
 * @returns {boolean} true if the block was populated from the index
 */
export function renderCardsFromEntries(block, entries) {
  if (!entries || !entries.length) return false;
  block.textContent = '';
  entries.forEach((entry) => block.append(rowFromEntry(entry)));
  return true;
}

/**
 * Transform a card block's rows into the shared `ul`/`li` card DOM: each row
 * becomes an `<li>` with an image cell (`{prefix}-card-image`) and a body cell
 * (`{prefix}-card-body`), images run through createOptimizedPicture, and the
 * card image is made a link to the same target as the title. Produces the exact
 * markup the card blocks built inline; `prefix` (e.g. 'cards-articles-wknd')
 * keeps each block's existing class names byte-identical. Returns the `<ul>`.
 * @param {HTMLElement} block
 * @param {string} prefix block class prefix used for the card cell classes
 * @returns {HTMLUListElement}
 */
export function cardsToList(block, prefix) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = `${prefix}-card-image`;
      else div.className = `${prefix}-card-body`;
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimizedPic);
  });
  // Make the card image clickable, linking to the same target as the title
  // (matches the source, where both the image and title are links).
  ul.querySelectorAll('li').forEach((li) => {
    const imageWrap = li.querySelector(`.${prefix}-card-image`);
    const titleLink = li.querySelector(`.${prefix}-card-body h3 a`);
    const picture = imageWrap && imageWrap.querySelector('picture');
    if (imageWrap && titleLink && picture && !imageWrap.querySelector('a')) {
      const link = document.createElement('a');
      link.href = titleLink.getAttribute('href');
      link.setAttribute('aria-label', titleLink.textContent.trim());
      picture.replaceWith(link);
      link.append(picture);
    }
  });
  block.textContent = '';
  block.append(ul);
  return ul;
}
