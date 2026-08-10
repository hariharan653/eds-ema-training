/*
 * Header search typeahead (WKND).
 * Replaces the static "/us/en/search" link (which 404s) with a real search
 * input + a results dropdown that filters the site query index by title as
 * the user types, matching the source (wknd.site) behaviour. Progressive
 * enhancement: if the index is unavailable the input simply shows no results
 * (it never navigates to the dead /search page).
 */

const SITE_INDEX = '/us/en/query-index.json';
const MAX_RESULTS = 8;

let indexPromise;

/** Fetch + cache the site query index once. Returns [] on any failure. */
async function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetch(SITE_INDEX)
      .then((resp) => (resp.ok ? resp.json() : { data: [] }))
      .then((json) => (Array.isArray(json?.data) ? json.data : []))
      .catch(() => []);
  }
  return indexPromise;
}

/**
 * Render a result label with the matched substring wrapped in <mark> so the
 * query is highlighted (matches the source's highlighted results).
 */
function highlight(title, query) {
  const idx = title.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return document.createTextNode(title);
  const frag = document.createDocumentFragment();
  frag.append(document.createTextNode(title.slice(0, idx)));
  const mark = document.createElement('mark');
  mark.textContent = title.slice(idx, idx + query.length);
  frag.append(mark, document.createTextNode(title.slice(idx + query.length)));
  return frag;
}

/**
 * Replace the WKND header search link with an input + results dropdown and
 * wire the typeahead. No-op if the search link isn't present (only the WKND
 * nav has it), so other headers are unaffected.
 * @param {Element} nav The decorated nav element
 */
export default function decorateSearch(nav) {
  const tools = nav.querySelector('.nav-tools');
  const link = tools?.querySelector('a[href$="/search"], a[href="#search"]');
  if (!tools || !link) return;

  const box = document.createElement('div');
  box.className = 'nav-search';

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'nav-search-input';
  input.setAttribute('placeholder', link.textContent.trim() || 'Search');
  input.setAttribute('aria-label', 'Search');
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('autocomplete', 'off');

  const results = document.createElement('ul');
  results.className = 'nav-search-results';
  results.setAttribute('role', 'listbox');
  results.hidden = true;

  box.append(input, results);
  link.replaceWith(box);

  let active = -1; // index of the keyboard-focused result

  const close = () => {
    results.hidden = true;
    results.textContent = '';
    input.setAttribute('aria-expanded', 'false');
    active = -1;
  };

  const setActive = (i) => {
    const opts = [...results.children];
    opts.forEach((li, idx) => li.setAttribute('aria-selected', idx === i ? 'true' : 'false'));
    active = i;
  };

  const render = (entries, query) => {
    results.textContent = '';
    if (!entries.length) {
      close();
      return;
    }
    entries.forEach((entry) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      const a = document.createElement('a');
      a.href = entry.path;
      a.append(highlight(entry.title, query));
      li.append(a);
      results.append(li);
    });
    results.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    setActive(-1);
  };

  const search = async () => {
    const query = input.value.trim();
    if (query.length < 2) {
      close();
      return;
    }
    const data = await loadIndex();
    const q = query.toLowerCase();
    const matches = data
      .filter((e) => e.path && e.title && e.title.toLowerCase().includes(q))
      .slice(0, MAX_RESULTS);
    render(matches, query);
  };

  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(search, 150);
  });

  input.addEventListener('keydown', (e) => {
    const opts = [...results.children];
    if (e.code === 'ArrowDown' && opts.length) {
      e.preventDefault();
      setActive((active + 1) % opts.length);
      opts[active].querySelector('a').focus();
    } else if (e.code === 'ArrowUp' && opts.length) {
      e.preventDefault();
      setActive((active - 1 + opts.length) % opts.length);
      opts[active].querySelector('a').focus();
    } else if (e.code === 'Enter') {
      const target = active >= 0 ? opts[active] : opts[0];
      const a = target?.querySelector('a');
      if (a) {
        e.preventDefault();
        window.location.href = a.href;
      }
    } else if (e.code === 'Escape') {
      close();
    }
  });

  // close on outside click
  document.addEventListener('click', (e) => {
    if (!box.contains(e.target)) close();
  });
}
