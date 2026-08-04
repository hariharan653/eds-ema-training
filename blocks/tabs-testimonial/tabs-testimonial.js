// eslint-disable-next-line import/no-unresolved
import { toClassName } from '../../scripts/aem.js';

/**
 * Groups the flat <p> children of a cell into a leading media element
 * (the first paragraph, which holds the image) and a body wrapper that
 * contains the remaining text paragraphs (name, role, quote).
 * @param {Element} cell the content cell to restructure
 * @param {string} mediaClass class name for the media paragraph
 * @param {string} bodyClass class name for the text wrapper
 */
function groupCell(cell, mediaClass, bodyClass) {
  if (!cell) return;
  const paragraphs = [...cell.children];
  const media = paragraphs.shift();
  if (media) media.classList.add(mediaClass);

  const body = document.createElement('div');
  body.className = bodyClass;
  paragraphs.forEach((p) => body.append(p));
  cell.append(body);
}

export default async function decorate(block) {
  // build tablist
  const tablist = document.createElement('div');
  tablist.className = 'tabs-testimonial-list';
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Testimonials');

  // decorate tabs and tabpanels
  const tabs = [...block.children].map((child) => child.firstElementChild);
  tabs.forEach((tab, i) => {
    const id = toClassName(tab.textContent);

    // decorate tabpanel
    const tabpanel = block.children[i];
    tabpanel.className = 'tabs-testimonial-panel';
    tabpanel.id = `tabpanel-${id}`;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    // group the surviving content cell into media + body (image | name/role/quote)
    groupCell(tabpanel.lastElementChild, 'tabs-testimonial-media', 'tabs-testimonial-body');

    // build tab button
    const button = document.createElement('button');
    button.className = 'tabs-testimonial-tab';
    button.id = `tab-${id}`;

    button.innerHTML = tab.innerHTML;
    // group the avatar chip into avatar + text (name/role)
    groupCell(button, 'tabs-testimonial-avatar', 'tabs-testimonial-tab-text');

    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', !i);
    // roving tabindex: only the selected tab is in the tab order
    button.setAttribute('tabindex', i ? -1 : 0);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
        btn.setAttribute('tabindex', -1);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
      button.setAttribute('tabindex', 0);
    });
    tablist.append(button);
    tab.remove();
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

  block.append(tablist);
}
