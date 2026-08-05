// eslint-disable-next-line import/no-unresolved
import { toClassName } from '../../scripts/aem.js';

/*
 * WKND Trip Tabs
 * Generic tabbed content switcher for adventure detail pages (Overview /
 * Itinerary / What to Bring). Authoring model: each block row is one tab — the
 * first cell is the tab label, the second cell is the (rich) panel content
 * (headings, images, paragraphs, lists). Empty panels are tolerated.
 * Implements the ARIA tabs pattern with roving tabindex + arrow-key support.
 */

export default async function decorate(block) {
  const tablist = document.createElement('div');
  tablist.className = 'wknd-trip-tabs-list';
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Trip information');

  const rows = [...block.children];
  rows.forEach((row, i) => {
    const label = row.firstElementChild;
    const panel = row.lastElementChild;
    const id = toClassName(label ? label.textContent : `tab-${i}`);

    // decorate tabpanel (the content cell)
    panel.className = 'wknd-trip-tabs-panel';
    panel.id = `wknd-trip-tabs-panel-${id}`;
    panel.setAttribute('aria-hidden', !!i);
    panel.setAttribute('aria-labelledby', `wknd-trip-tabs-tab-${id}`);
    panel.setAttribute('role', 'tabpanel');
    if (i) panel.setAttribute('hidden', '');
    // the row itself becomes the panel wrapper; drop the now-empty label cell
    row.className = 'wknd-trip-tabs-panel-wrapper';

    // build tab button from the label cell
    const button = document.createElement('button');
    button.className = 'wknd-trip-tabs-tab';
    button.id = `wknd-trip-tabs-tab-${id}`;
    button.textContent = label ? label.textContent.trim() : `Tab ${i + 1}`;
    button.setAttribute('aria-controls', `wknd-trip-tabs-panel-${id}`);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('tabindex', i ? -1 : 0);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((p) => {
        p.setAttribute('aria-hidden', true);
        p.setAttribute('hidden', '');
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
        btn.setAttribute('tabindex', -1);
      });
      panel.setAttribute('aria-hidden', false);
      panel.removeAttribute('hidden');
      button.setAttribute('aria-selected', true);
      button.setAttribute('tabindex', 0);
    });
    tablist.append(button);

    if (label) label.remove();
  });

  // keyboard support for the ARIA tabs pattern (Left/Right/Home/End)
  tablist.addEventListener('keydown', (e) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const buttons = [...tablist.querySelectorAll('button')];
    const current = buttons.indexOf(document.activeElement);
    let next = current;
    if (e.key === 'ArrowRight') next = (current + 1) % buttons.length;
    else if (e.key === 'ArrowLeft') next = (current - 1 + buttons.length) % buttons.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = buttons.length - 1;
    buttons[next].click();
    buttons[next].focus();
  });

  block.prepend(tablist);
}
