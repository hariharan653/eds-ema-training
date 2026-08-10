import { createOptimizedPicture } from '../../scripts/aem.js';
import {
  fetchIndex,
  filterByPathPrefix,
  sortByTitle,
  renderCardsFromEntries,
} from '../../scripts/cards-from-index.js';

/*
 * Category filter map (from wknd.site/us/en/adventures). Keys are the tab
 * labels; values are the adventure slugs that belong to each category. "All"
 * is derived (every card), so it is not listed here.
 *
 * NOTE: category is not yet available as page metadata, so filtering still
 * uses this static map. A follow-up that emits a `category` meta tag per
 * adventure page would let this be derived from the index too.
 */
const CATEGORY_MAP = {
  Climbing: ['climbing-new-zealand', 'colorado-rock-climbing'],
  Cycling: ['whistler-mountain-biking', 'cycling-tuscany', 'west-coast-cycling'],
  Skiing: ['downhill-skiing-wyoming', 'ski-touring-mont-blanc', 'tahoe-skiing'],
  Surfing: ['bali-surf-camp', 'surf-camp-costa-rica'],
  Travel: ['beervana-portland', 'cycling-tuscany', 'gastronomic-marais-tour',
    'napa-wine-tasting', 'riverside-camping-australia', 'yosemite-backpacking'],
};

const TAB_ORDER = ['All', 'Climbing', 'Cycling', 'Skiing', 'Surfing', 'Travel'];

/* Published query index of adventure-detail pages (see helix-query.yaml). Used
 * as the default when a data-source block omits an explicit path. */
const ADVENTURES_INDEX = '/us/en/adventures/query-index.json';

/**
 * Read the data-driven config authored in the block's content, if present. The
 * data-source authoring model (matching the source) replaces hand-authored card
 * rows with a couple of config cells: an optional `tabs` marker (turns on the
 * category filter strip) and a `…query-index.json` path the cards are built
 * from. Returns { indexPath, showTabs } for a data-source block, or null when
 * the block holds normal authored cards (e.g. the homepage "Next Adventures"
 * grid) so those keep working unchanged.
 */
function getConfig(block) {
  let indexPath = null;
  let showTabs = false;
  // Scan the innermost content cells so this works whether the config is
  // authored as two rows (tabs / path) or one row with two columns. Authored
  // card cells carry an image (image cell) or a title link to an adventure page
  // (body cell), so neither matches the config patterns below.
  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    if (cell.querySelector('picture, img')) return;
    const link = cell.querySelector('a');
    const text = (link?.getAttribute('href') || cell.textContent || '').trim();
    if (/query-index\.json$/.test(text)) indexPath = text;
    else if (/^tabs$/i.test(text)) showTabs = true;
  });
  return indexPath ? { indexPath, showTabs } : null;
}

/**
 * Derive an adventure slug from a card's link (…/adventures/<slug>.html).
 */
function slugForCard(li) {
  const a = li.querySelector('a[href*="/adventures/"]');
  if (!a) return null;
  return a.getAttribute('href').replace(/.*\/adventures\//, '').replace(/\.html$/, '');
}

/**
 * Build the category filter tab strip and wire click filtering.
 * Only used on the adventures listing (many cards); skipped elsewhere.
 */
function addFilterTabs(block, ul) {
  const items = [...ul.children];
  // tag each card with its slug for filtering
  items.forEach((li) => {
    const slug = slugForCard(li);
    if (slug) li.dataset.slug = slug;
  });

  const tablist = document.createElement('div');
  tablist.className = 'cards-adventures-wknd-tabs';
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Filter adventures by category');

  const applyFilter = (label) => {
    items.forEach((li) => {
      const show = label === 'All' || (CATEGORY_MAP[label] || []).includes(li.dataset.slug);
      li.hidden = !show;
    });
  };

  TAB_ORDER.forEach((label, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cards-adventures-wknd-tab';
    btn.textContent = label;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    btn.addEventListener('click', () => {
      tablist.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', 'false'));
      btn.setAttribute('aria-selected', 'true');
      applyFilter(label);
    });
    tablist.append(btn);
  });

  block.prepend(tablist);
}

export default async function decorate(block) {
  // Data-source authoring model (matches the source): the block content is a
  // `tabs` marker + a query-index.json path instead of hand-authored cards.
  const config = getConfig(block);

  // The full adventures listing is index-driven; the homepage "Next Adventures"
  // grid (few authored cards, no config) stays authored as-is. Treat a
  // data-source block, or a large authored grid (legacy source), as the listing.
  const isListing = !!config || [...block.children].length >= 8;
  // Tabs come on for a data-source block only when its `tabs` marker is present;
  // for the legacy authored grid, keep the old "many cards" heuristic.
  const showTabs = config ? config.showTabs : isListing;

  // Data-driven cards from the adventures query index (shared helper). Falls
  // back to authored rows if the index is empty/unavailable (design unchanged).
  if (isListing) {
    const indexPath = config?.indexPath || ADVENTURES_INDEX;
    const entries = sortByTitle(filterByPathPrefix(await fetchIndex(indexPath), '/us/en/adventures/'));
    if (!renderCardsFromEntries(block, entries)) block.textContent = '';
  }

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-adventures-wknd-card-image';
      else div.className = 'cards-adventures-wknd-card-body';
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
    const imageWrap = li.querySelector('.cards-adventures-wknd-card-image');
    const titleLink = li.querySelector('.cards-adventures-wknd-card-body h3 a');
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

  // Category filter tabs only on the full adventures listing; the homepage
  // "Next Adventures" grid (few cards) keeps a simple grid.
  if (showTabs && ul.children.length >= 8) {
    addFilterTabs(block, ul);
  }
}
