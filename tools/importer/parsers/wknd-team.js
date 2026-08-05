/* eslint-disable */
/* global WebImporter */
/**
 * Parser for wknd-team. Base block: cards.
 * Source: WKND About Us (.cmp-experience-fragment--contributor person cards).
 * Generated: 2026-08-05
 *
 * The page body is one flat grid: headings/intros interspersed with person
 * cards (contributors, then guides). Each card = image + name (h3) + role (h5)
 * + social links. This parser runs on the FIRST card of a contiguous run,
 * gathers all immediately-following sibling cards, builds one wknd-team block
 * (one row per person: [photo, name, role, socials]) and removes the consumed
 * siblings — so each group (Contributors, Guides) becomes its own grid while
 * the section headings between them stay as default content.
 */
function isCard(el) {
  return el && el.classList && el.classList.contains('cmp-experience-fragment--contributor');
}

export default function parse(element, { document }) {
  // Only act on the first card of a run; skip cards already consumed.
  const prev = element.previousElementSibling;
  if (isCard(prev)) return; // a earlier card in this run already built the block

  // Collect this card + following contiguous card siblings.
  const cards = [element];
  let sib = element.nextElementSibling;
  while (isCard(sib)) {
    cards.push(sib);
    sib = sib.nextElementSibling;
  }

  const rows = [];
  cards.forEach((card) => {
    const img = card.querySelector('img');
    const picture = img ? (img.closest('picture') || img) : '';
    const name = card.querySelector('h3, .cmp-title__text');
    // role is the second title (h5); pick a heading that is not the name
    const headings = [...card.querySelectorAll('h1,h2,h3,h4,h5,h6')];
    const role = headings.find((h) => h !== name) || null;

    // social links
    const links = [...card.querySelectorAll('a')];
    const socialList = document.createElement('ul');
    links.forEach((a) => {
      const label = (a.getAttribute('aria-label') || a.textContent || '').trim();
      const href = a.getAttribute('href') || '#';
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.setAttribute('href', href);
      link.textContent = label || 'Link';
      li.append(link);
      socialList.append(li);
    });

    rows.push([
      picture,
      name || '',
      role || '',
      socialList.children.length ? socialList : '',
    ]);
  });

  if (rows.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'wknd-team', cells: rows });
  // replace the first card with the block, remove the rest of the run
  element.replaceWith(block);
  cards.slice(1).forEach((c) => c.remove());
}
