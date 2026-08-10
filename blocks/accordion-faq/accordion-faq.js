/*
 * Accordion Block
 * Recreate an accordion
 * https://www.hlx.live/developer/block-collection/accordion
 */

/**
 * Read a data-file path authored in the block's content, if present. The
 * data-source authoring model (matching the source) replaces hand-authored
 * question/answer rows with a single cell holding a `…faq-data.json` path (a
 * DA sheet with `question`/`answer` columns) — the block then builds every
 * accordion item from that sheet. Returns the path, or null when the block
 * holds normal authored Q&A rows (e.g. the about-us accordion).
 */
function getDataPath(block) {
  const rows = [...block.children];
  if (rows.length !== 1) return null;
  const cells = [...rows[0].children];
  if (cells.length !== 1) return null;
  const cell = cells[0];
  const link = cell.querySelector('a');
  const text = (link?.getAttribute('href') || cell.textContent || '').trim();
  return /\.json$/.test(text) ? text : null;
}

/**
 * Fetch a DA sheet and return its rows, or [] on any failure so the caller can
 * fall back to authored content (never throws, never leaves a stray path cell).
 */
async function fetchRows(path) {
  try {
    const resp = await fetch(path);
    if (!resp.ok) return [];
    const json = await resp.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

/**
 * Build hand-authored-shape rows (question cell + answer cell) from sheet rows
 * so the transform below produces identical accordion DOM. Answers are plain
 * text (authored in the sheet as plain text).
 */
function rowsFromData(block, data) {
  block.textContent = '';
  data.forEach((entry) => {
    const question = (entry.question || '').trim();
    const answer = (entry.answer || '').trim();
    if (!question) return;
    const row = document.createElement('div');
    const q = document.createElement('div');
    q.textContent = question;
    const a = document.createElement('div');
    a.textContent = answer;
    row.append(q, a);
    block.append(row);
  });
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Data-source mode (matches the source authoring model): when the block's
  // content is a single cell pointing at a …faq-data.json sheet, build every
  // accordion item from that sheet — no hand-authored rows, so FAQs are edited
  // in one place. Otherwise (authored Q&A rows, e.g. the about-us accordion)
  // behave exactly as before.
  const dataPath = getDataPath(block);
  if (dataPath) {
    const data = await fetchRows(dataPath);
    // if the sheet is empty/unavailable, clear the stray path cell so it never
    // renders as text; otherwise build authored-shape rows to transform below.
    if (data.length) rowsFromData(block, data);
    else block.textContent = '';
  }

  [...block.children].forEach((row) => {
    // decorate accordion item label
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-faq-item-label';
    summary.append(...label.childNodes);
    // decorate accordion item body
    const body = row.children[1];
    body.className = 'accordion-faq-item-body';
    // decorate accordion item
    const details = document.createElement('details');
    details.className = 'accordion-faq-item';
    details.append(summary, body);
    row.replaceWith(details);
  });
}
