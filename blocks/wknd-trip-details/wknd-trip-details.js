/*
 * WKND Trip Details
 * Renders a vertical spec list of trip metadata as label/value pairs.
 * Authoring model: each block row is one spec pair — the first cell holds the
 * label (e.g. "Activity"), the second holds the value (e.g. "Rock Climbing").
 * decorate() tags the cells so the CSS can render a small grey uppercase label
 * above a bold value, with a dividing rule between pairs.
 */

export default function decorate(block) {
  const rows = [...block.children];
  rows.forEach((row) => {
    row.classList.add('wknd-trip-details-item');
    const [label, value] = [...row.children];
    if (label) label.classList.add('wknd-trip-details-label');
    if (value) value.classList.add('wknd-trip-details-value');
  });

  // "Share this Adventure" label below the fact sheet (source shows an <h5>
  // here; the import stripped it along with the Pinterest share widget). Add
  // it back as a small uppercase label so the sidebar matches the source.
  if (!block.querySelector('.wknd-share-adventure')) {
    const share = document.createElement('p');
    share.className = 'wknd-share-adventure';
    share.textContent = 'Share this Adventure';
    block.append(share);
  }
}
