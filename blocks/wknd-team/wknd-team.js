import { createOptimizedPicture } from '../../scripts/aem.js';

/* Inline social glyphs (currentColor) — the source used an icon font. */
const SOCIAL_ICONS = {
  facebook: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H17V3.6c-.29-.04-1.28-.12-2.43-.12-2.4 0-4.07 1.47-4.07 4.17v2.25H7.8V13h2.7v8h3z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" fill="currentColor"><path d="M21 5.9c-.66.3-1.37.5-2.12.6.76-.46 1.35-1.18 1.63-2.05-.72.43-1.51.73-2.35.9A3.68 3.68 0 0 0 12 8.6c0 .29.03.57.1.83A10.44 10.44 0 0 1 4.5 4.6a3.7 3.7 0 0 0 1.14 4.93c-.6-.02-1.16-.18-1.65-.45v.04c0 1.79 1.27 3.28 2.96 3.62-.31.08-.63.13-.97.13-.24 0-.47-.02-.69-.07a3.69 3.69 0 0 0 3.44 2.56A7.4 7.4 0 0 1 3 17.42a10.42 10.42 0 0 0 5.65 1.66c6.78 0 10.49-5.62 10.49-10.49v-.48c.72-.52 1.34-1.17 1.86-1.91z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" fill="currentColor"><path d="M12 7.4A4.6 4.6 0 1 0 16.6 12 4.6 4.6 0 0 0 12 7.4zm0 7.6A3 3 0 1 1 15 12a3 3 0 0 1-3 3zm4.8-7.8a1.08 1.08 0 1 1-1.08-1.08A1.08 1.08 0 0 1 16.8 7.2zM20 7.9a5.3 5.3 0 0 0-1.45-3.75A5.3 5.3 0 0 0 14.8 2.7c-1.48-.08-5.9-.08-7.38 0a5.3 5.3 0 0 0-3.75 1.45A5.3 5.3 0 0 0 2.22 7.9c-.08 1.48-.08 5.9 0 7.38a5.3 5.3 0 0 0 1.45 3.75 5.3 5.3 0 0 0 3.75 1.45c1.48.08 5.9.08 7.38 0a5.3 5.3 0 0 0 3.75-1.45 5.3 5.3 0 0 0 1.45-3.75c.08-1.48.08-5.9 0-7.38zm-1.94 8.97a3 3 0 0 1-1.71 1.71c-1.18.47-4 .36-5.31.36s-4.13.11-5.31-.36a3 3 0 0 1-1.71-1.71c-.47-1.18-.36-4-.36-5.31s-.11-4.13.36-5.31A3 3 0 0 1 6.69 4.5c1.18-.47 4-.36 5.31-.36s4.13-.11 5.31.36a3 3 0 0 1 1.71 1.71c.47 1.18.36 4 .36 5.31s.11 4.13-.36 5.31z"/></svg>',
};

const NETWORKS = ['facebook', 'twitter', 'instagram'];

/**
 * Read the data-source config authored in the block's content, if present. The
 * data-source authoring model (matching the source) replaces hand-authored
 * person rows with two cells: a `…query-index.json` path (a sheet of people)
 * and a `type` keyword (e.g. `contributor` or `guide`) to filter that sheet.
 * Returns { indexPath, type }, or null when the block holds authored person
 * rows (so the existing authoring keeps working).
 */
function getConfig(block) {
  let indexPath = null;
  let type = '';
  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    if (cell.querySelector('picture, img')) return; // authored photo cell => content
    const link = cell.querySelector('a');
    const text = (link?.getAttribute('href') || cell.textContent || '').trim();
    if (/query-index\.json$/.test(text) || /\.json$/.test(text)) indexPath = text;
    else if (text) type = text.toLowerCase();
  });
  return indexPath ? { indexPath, type } : null;
}

/**
 * Fetch a sheet of people and return its rows filtered by type, or [] on any
 * failure (so the caller falls back to authored content, never throws).
 */
async function fetchPeople(indexPath, type) {
  try {
    const resp = await fetch(indexPath);
    if (!resp.ok) return [];
    const json = await resp.json();
    const data = Array.isArray(json?.data) ? json.data : [];
    return type ? data.filter((r) => (r.type || '').toLowerCase() === type) : data;
  } catch {
    return [];
  }
}

/**
 * Build authored-shape person rows (photo | name | role | social-links) from
 * sheet entries so the transform below produces identical card DOM.
 */
function rowsFromPeople(block, people) {
  block.textContent = '';
  people.forEach((p) => {
    const name = (p.name || p.title || '').trim();
    if (!name) return;
    const row = document.createElement('div');

    const photoCell = document.createElement('div');
    if (p.image) {
      const picture = document.createElement('picture');
      const img = document.createElement('img');
      [img.src] = String(p.image).split('?');
      img.alt = name;
      img.loading = 'lazy';
      picture.append(img);
      photoCell.append(picture);
    }

    const nameCell = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.textContent = name;
    nameCell.append(h3);

    const roleCell = document.createElement('div');
    const h5 = document.createElement('h5');
    h5.textContent = (p.role || '').trim();
    roleCell.append(h5);

    const socialCell = document.createElement('div');
    const list = document.createElement('ul');
    NETWORKS.forEach((net) => {
      const href = (p[net] || '').trim();
      if (!href) return;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = href;
      a.textContent = net; // label; the transform swaps it for an icon glyph
      li.append(a);
      list.append(li);
    });
    if (list.children.length) socialCell.append(list);

    row.append(photoCell, nameCell, roleCell, socialCell);
    block.append(row);
  });
}

/*
 * WKND Team — contributor / guide cards.
 * Authoring model: one block row per person, cells in order:
 *   [ photo (picture) ][ name (h3) ][ role (text) ][ social links (list of a) ]
 * Data-source model (matches the source): a `query-index.json` path cell + a
 * `type` cell — the block builds every card from that sheet, filtered by type.
 * Renders a responsive grid of centered cards: circular photo, name, role, and
 * a row of social icon links. Matches wknd.site/us/en/about-us.
 */
export default async function decorate(block) {
  const config = getConfig(block);
  if (config) {
    const people = await fetchPeople(config.indexPath, config.type);
    if (people.length) rowsFromPeople(block, people);
    else block.textContent = '';
  }

  const ul = document.createElement('ul');
  ul.className = 'wknd-team-list';

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'wknd-team-card';

    const cells = [...row.children];
    cells.forEach((cell) => {
      if (cell.querySelector('picture, img')) {
        cell.className = 'wknd-team-card-photo';
      } else if (cell.querySelector('a')) {
        cell.className = 'wknd-team-card-social';
        // The source social links use an icon font we don't ship. Replace the
        // visible label text with an inline SVG glyph inferred from the label
        // (Facebook / Twitter / Instagram); keep the label as aria-label.
        cell.querySelectorAll('a').forEach((a) => {
          const label = a.textContent.trim();
          let net = '';
          if (/face/i.test(label)) net = 'facebook';
          else if (/twit/i.test(label)) net = 'twitter';
          else if (/insta/i.test(label)) net = 'instagram';
          if (net) a.setAttribute('aria-label', net.charAt(0).toUpperCase() + net.slice(1));
          else if (label) a.setAttribute('aria-label', label);
          a.textContent = '';
          if (SOCIAL_ICONS[net]) a.innerHTML = SOCIAL_ICONS[net];
        });
      } else {
        cell.className = 'wknd-team-card-info';
      }
      li.append(cell);
    });

    ul.append(li);
  });

  // optimize person photos (small, square)
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]);
    img.closest('picture').replaceWith(optimized);
  });

  block.textContent = '';
  block.append(ul);
}
