import { createOptimizedPicture } from '../../scripts/aem.js';
import {
  fetchIndex,
  sortByTitle,
  renderCardsFromEntries,
} from '../../scripts/cards-from-index.js';

/**
 * Read the data-source config authored in the block's content, if present. The
 * data-driven authoring model replaces hand-authored card rows with a few
 * config cells: a `…query-index.json` path (required), an optional `limit: N`
 * (cap the card count, e.g. the homepage "Recent Articles" grid shows 4), and
 * an optional `sort: asc|desc` (order by title; default asc). Returns
 * { indexPath, limit, sortDir }, or null when the block holds normal authored
 * cards so those keep working unchanged. Config cells carry no image and are
 * not a title link to an article, so they never collide with authored rows.
 */
function getConfig(block) {
  let indexPath = null;
  let limit = 0;
  let sortDir = 'asc';
  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    if (cell.querySelector('picture, img')) return;
    const link = cell.querySelector('a');
    const text = (link?.getAttribute('href') || cell.textContent || '').trim();
    const limitMatch = text.match(/^limit\s*[:=]?\s*(\d+)$/i);
    const sortMatch = text.match(/^sort\s*[:=]?\s*(asc|desc|none)$/i);
    if (/query-index\.json$/.test(text)) indexPath = text;
    else if (limitMatch) limit = parseInt(limitMatch[1], 10);
    else if (sortMatch) sortDir = sortMatch[1].toLowerCase();
  });
  if (!indexPath) return null;
  return { indexPath, limit, sortDir };
}

export default async function decorate(block) {
  // Data-driven mode (matches the source authoring model): when the block's
  // content is a cell pointing at a query-index.json (+ optional limit/sort),
  // render article cards from that index — no hand-authored cards, so new
  // articles appear automatically once published. Otherwise (authored card
  // rows, e.g. an authored grid) behave exactly as before.
  const config = getConfig(block);
  if (config) {
    // `sort: none` keeps the sheet's authored row order (curated); asc/desc
    // sort by title (default asc).
    const raw = await fetchIndex(config.indexPath);
    let entries = config.sortDir === 'none' ? [...raw] : sortByTitle(raw);
    if (config.sortDir === 'desc') entries.reverse();
    if (config.limit > 0) entries = entries.slice(0, config.limit);
    // replace the path cell with the built cards; if the index is empty/
    // unavailable, clear the stray path cell so it never renders as text.
    if (!renderCardsFromEntries(block, entries)) block.textContent = '';
  }

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-articles-wknd-card-image';
      else div.className = 'cards-articles-wknd-card-body';
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
    const imageWrap = li.querySelector('.cards-articles-wknd-card-image');
    const titleLink = li.querySelector('.cards-articles-wknd-card-body h3 a');
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
}
