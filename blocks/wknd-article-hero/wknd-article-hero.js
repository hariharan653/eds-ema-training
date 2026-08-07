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

  // Breadcrumb placement (matches source): the import puts the breadcrumb <ol>
  // in its own default-content-wrapper ABOVE the hero block, so it renders at
  // the very top of the page. The source shows it BELOW the lead image and just
  // above the title. Pull the breadcrumb into the hero block, inserted between
  // the image row and the text (title) row.
  const section = block.closest('.section');
  const breadcrumb = section
    && section.querySelector('.default-content-wrapper > ol');
  const imageRow = block.querySelector(':scope > .wknd-article-hero-image');
  const textRow = block.querySelector(':scope > .wknd-article-hero-text');
  if (breadcrumb && textRow) {
    breadcrumb.classList.add('wknd-article-hero-breadcrumb');
    // remove the now-empty wrapper the breadcrumb came from
    const emptyWrapper = breadcrumb.closest('.default-content-wrapper');
    block.insertBefore(breadcrumb, textRow);
    if (emptyWrapper && emptyWrapper.children.length === 0) emptyWrapper.remove();
    // if there is no lead image, the breadcrumb naturally sits first — fine.
    if (!imageRow) breadcrumb.classList.add('wknd-article-hero-breadcrumb--no-image');
  }
}
