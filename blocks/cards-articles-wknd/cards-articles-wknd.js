import { createOptimizedPicture } from '../../scripts/aem.js';
import {
  fetchIndex,
  sortByTitle,
  renderCardsFromEntries,
} from '../../scripts/cards-from-index.js';

/**
 * Read a query-index path authored in the block's content, if present. The
 * data-driven authoring model puts a single cell holding a `…query-index.json`
 * path (as a link or plain text) instead of hand-authored card rows — the block
 * then renders every card from that index. Returns the path, or null when the
 * block holds normal authored cards (e.g. the homepage "Recent Articles" grid).
 */
function getIndexPath(block) {
  const cells = block.querySelectorAll(':scope > div > div');
  // a data-source block is a single cell whose only content is the json path
  if (cells.length !== 1) return null;
  const cell = cells[0];
  if (cell.querySelector('picture, img')) return null;
  const link = cell.querySelector('a');
  const text = (link?.getAttribute('href') || cell.textContent || '').trim();
  return /query-index\.json$/.test(text) ? text : null;
}

export default async function decorate(block) {
  // Data-driven mode (matches the source authoring model): when the block's
  // content is a single cell pointing at a query-index.json, render all article
  // cards from that index (sorted alphabetically) — no hand-authored cards, so
  // new articles appear automatically once published. Otherwise (authored card
  // rows, e.g. the homepage "Recent Articles" grid) behave exactly as before.
  const indexPath = getIndexPath(block);
  if (indexPath) {
    const entries = sortByTitle(await fetchIndex(indexPath));
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
