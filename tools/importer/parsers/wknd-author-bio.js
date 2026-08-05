/* eslint-disable */
/* global WebImporter */
/**
 * Parser for wknd-author-bio. Base block: columns.
 * Source: WKND magazine article pages (/us/en/magazine/*), author card at the
 * bottom of the article (.cmp-byline inside a trailing experience fragment).
 * Generated: 2026-08-05
 *
 * Structure (per wknd-author-bio decorator): single row, 2 cells.
 *   Cell 1: author photo (picture).
 *   Cell 2: author name (h2) + role/occupations (p) + social links (a list).
 */
export default function parse(element, { document }) {
  const img = element.querySelector('.cmp-byline__image img, .cmp-image img, img');
  const picture = img ? (img.closest('picture') || img) : '';

  const name = element.querySelector('.cmp-byline__name, h2');
  const role = element.querySelector('.cmp-byline__occupations, p');

  // Social links: the icon buttons (Facebook / Twitter / Instagram). Rebuild as
  // plain links carrying the label text so they render as a simple link list.
  const links = Array.from(element.querySelectorAll('a.cmp-button, .cmp-button a, a[aria-label]'));
  const socialList = document.createElement('ul');
  links.forEach((a) => {
    const label = (a.getAttribute('aria-label') || a.textContent || '').trim();
    const href = a.getAttribute('href') || '#';
    if (!label) return;
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.setAttribute('href', href);
    link.textContent = label;
    li.append(link);
    socialList.append(li);
  });

  const detailsCell = [];
  if (name) detailsCell.push(name);
  if (role) detailsCell.push(role);
  if (socialList.children.length) detailsCell.push(socialList);

  // Empty-block guard.
  if (!picture && detailsCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[picture, detailsCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'wknd-author-bio', cells });
  element.replaceWith(block);
}
