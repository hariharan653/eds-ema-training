import { createOptimizedPicture } from '../../scripts/aem.js';

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

/* Published query index of adventure-detail pages (see helix-query.yaml). */
const ADVENTURES_INDEX = '/us/en/adventures/query-index.json';

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

/**
 * Fetch the adventures query index and return its entries sorted by title.
 * Returns [] on any failure so the caller falls back to authored content.
 */
async function fetchAdventures() {
  try {
    const resp = await fetch(ADVENTURES_INDEX);
    if (!resp.ok) return [];
    const json = await resp.json();
    const data = Array.isArray(json?.data) ? json.data : [];
    // only real detail pages with a title; sort alphabetically (matches source)
    return data
      .filter((e) => e.path && e.title)
      .sort((a, b) => a.title.localeCompare(b.title));
  } catch {
    return [];
  }
}

/**
 * Build an authored-shape row (image cell + body cell) from an index entry,
 * so the shared transform below produces exactly the same card DOM as the
 * hand-authored content.
 */
function rowFromEntry(entry) {
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

export default async function decorate(block) {
  // Only the full adventures listing (many authored cards) is index-driven;
  // the homepage "Next Adventures" grid (few cards) stays authored as-is.
  const authoredRows = [...block.children];
  const isListing = authoredRows.length >= 8;

  // Data-driven card source when the index is published; otherwise fall back
  // to the hand-authored rows (design unchanged, no dependency on the index).
  let rows = authoredRows;
  if (isListing) {
    const entries = await fetchAdventures();
    if (entries.length) {
      rows = entries.map(rowFromEntry);
      block.textContent = '';
      block.append(...rows);
    }
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

  // Category filter tabs only on the full adventures listing (many cards);
  // the homepage "Next Adventures" grid (4 cards) keeps a simple grid.
  if (ul.children.length >= 8) {
    addFilterTabs(block, ul);
  }
}
