/**
 * WKND Article Hero — magazine article header.
 * Variant of the vanilla `hero` block.
 *
 * Expected content (author view / import):
 *   Row 1: lead banner image (picture only)
 *   Row 2: article title (h1) + author byline (e.g. "By Sofia Sjöberg")
 *
 * Unlike the vanilla hero (text overlaid on image), this variant stacks the
 * image on top with the title/byline below it, matching wknd.site articles.
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  if (!block.querySelector(':scope > div:first-child picture')) {
    block.classList.add('no-image');
  }

  // LCP: the lead banner image is the article's LCP candidate — load it eagerly
  // at high priority (see modern-web optimize-image-priority).
  const leadImg = block.querySelector(':scope > div:first-child img');
  if (leadImg) {
    leadImg.setAttribute('loading', 'eager');
    leadImg.setAttribute('fetchpriority', 'high');
  }

  [...block.children].forEach((row) => {
    const pic = row.querySelector('picture');
    if (pic && row.textContent.trim() === '') {
      // row is image-only → the lead banner
      row.classList.add('wknd-article-hero-image');
    } else {
      // text row → title + byline
      row.classList.add('wknd-article-hero-text');
      // the author byline is the last heading/paragraph after the title
      const byline = row.querySelector('h4, h5, h6')
        || row.querySelector('h1 ~ p, h2 ~ p');
      if (byline) byline.classList.add('wknd-article-hero-byline');
    }
  });
}
