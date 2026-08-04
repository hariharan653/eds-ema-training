import { createOptimizedPicture } from '../../scripts/aem.js';

// Matches a trailing date like "May 12" / "June 5" at the end of the meta text
const DATE_RE = /\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2})\s*$/i;

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-article-card-image';
      else div.className = 'cards-article-card-body';
    });

    const body = li.querySelector('.cards-article-card-body');
    if (body) {
      // The card link is a standalone <p><a> duplicate of the heading; use its href.
      const linkP = [...body.querySelectorAll('p')].find((p) => p.querySelector('a'));
      const href = linkP?.querySelector('a')?.getAttribute('href');
      if (linkP) linkP.remove();

      // The first remaining <p> holds "Category Date" (e.g. "Casual Cool May 12").
      const metaP = body.querySelector('p');
      if (metaP) {
        const raw = metaP.textContent.trim();
        const dateMatch = raw.match(DATE_RE);
        const dateText = dateMatch ? dateMatch[1].trim() : '';
        const categoryText = dateMatch ? raw.replace(DATE_RE, '').trim() : raw;

        const meta = document.createElement('div');
        meta.className = 'cards-article-card-meta';
        if (categoryText) {
          const cat = document.createElement('span');
          cat.className = 'cards-article-card-category';
          cat.textContent = categoryText;
          meta.append(cat);
        }
        if (dateText) {
          const date = document.createElement('span');
          date.className = 'cards-article-card-date';
          date.textContent = dateText;
          meta.append(date);
        }
        metaP.replaceWith(meta);
      }

      // Wrap the whole card in the article link.
      if (href) {
        const anchor = document.createElement('a');
        anchor.className = 'cards-article-card';
        anchor.href = href;
        while (li.firstElementChild) anchor.append(li.firstElementChild);
        li.append(anchor);
      }
    }

    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimizedPic);
  });

  block.textContent = '';
  block.append(ul);
}
