/* eslint-disable */
/* global WebImporter */
/**
 * Parser for wknd-hero-carousel. Base block: carousel.
 * Source: https://wknd.site/us/en.html (.carousel.cmp-carousel--hero)
 * Generated: 2026-08-05
 *
 * Structure (per wknd-hero-carousel decorator): one row per slide, 2 columns.
 *   col 0 = slide image, col 1 = slide content (title + description + CTA).
 * Source is an AEM cmp-carousel: each slide is a `.cmp-carousel__item`
 * containing a `.cmp-teaser` (title/description/CTA + image).
 */
export default function parse(element, { document }) {
  // Each carousel item is one slide. Fall back to teaser if item wrapper is absent.
  let slides = Array.from(element.querySelectorAll('.cmp-carousel__item'));
  if (!slides.length) {
    slides = Array.from(element.querySelectorAll('.cmp-teaser, .teaser'));
  }

  const cells = [];

  slides.forEach((slide) => {
    // Image column
    const img = slide.querySelector('.cmp-teaser__image img, .cmp-image img, img');
    const picture = img ? (img.closest('picture') || img) : '';

    // Content column
    const title = slide.querySelector('.cmp-teaser__title, h1, h2, h3');
    const description = slide.querySelector('.cmp-teaser__description, p');
    const ctas = Array.from(slide.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a, a'));

    const contentCell = [];
    if (title) contentCell.push(title);
    if (description) contentCell.push(description);
    contentCell.push(...ctas);

    // Skip empty slides
    if (!picture && contentCell.length === 0) return;

    cells.push([picture, contentCell]);
  });

  // Empty-block guard
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'wknd-hero-carousel', cells });
  element.replaceWith(block);
}
