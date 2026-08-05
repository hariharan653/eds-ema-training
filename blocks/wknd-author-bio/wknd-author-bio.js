/**
 * WKND Author Bio — magazine article author card.
 * Variant of the vanilla `columns` block.
 *
 * Expected content (author view / import):
 *   Single row, 2 cells:
 *     Cell 1: author photo (picture)
 *     Cell 2: author name (h2) + role/occupations (p) + social links (list of a)
 *
 * Renders as photo-left / details-right on desktop, stacked on mobile.
 * Preceded on the page by a separator rule (authored as default content).
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`wknd-author-bio-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('wknd-author-bio-img-col');
        }
      }
    });
  });
}
