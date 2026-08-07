import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/* WKND language/country selector (matches wknd.site). Static data: 7 countries,
   12 locales. Each locale mirrors the source path; `current` marks en-US. Flag
   is an inline SVG so no extra network requests. */
const LANG_COUNTRIES = [
  {
    name: 'United States',
    flag: '<svg viewBox="0 0 20 14"><rect width="20" height="14" fill="#b22234"/><g fill="#fff"><rect y="1.08" width="20" height="1.08"/><rect y="3.23" width="20" height="1.08"/><rect y="5.38" width="20" height="1.08"/><rect y="7.54" width="20" height="1.08"/><rect y="9.69" width="20" height="1.08"/><rect y="11.85" width="20" height="1.08"/></g><rect width="8" height="7.54" fill="#3c3b6e"/></svg>',
    locales: [
      { label: 'en-US', href: '/us/en', current: true },
      { label: 'es-US', href: '/us/es' },
    ],
  },
  {
    name: 'Canada',
    flag: '<svg viewBox="0 0 20 14"><rect width="20" height="14" fill="#fff"/><rect width="5" height="14" fill="#d52b1e"/><rect x="15" width="5" height="14" fill="#d52b1e"/><path fill="#d52b1e" d="M10 3l.6 1.6 1.7-.4-.9 1.5 1.3 1-1.7.3.1 1.7L10 9.3 8.6 10l.1-1.7-1.7-.3 1.3-1-.9-1.5 1.7.4z"/></svg>',
    locales: [
      { label: 'en-CA', href: '/ca/en' },
      { label: 'fr-CA', href: '/ca/fr' },
    ],
  },
  {
    name: 'Switzerland',
    flag: '<svg viewBox="0 0 20 14"><rect width="20" height="14" fill="#d52b1e"/><rect x="8.5" y="3" width="3" height="8" fill="#fff"/><rect x="6" y="5.5" width="8" height="3" fill="#fff"/></svg>',
    locales: [
      { label: 'de-CH', href: '/ch/de' },
      { label: 'fr-CH', href: '/ch/fr' },
      { label: 'it-CH', href: '/ch/it' },
    ],
  },
  {
    name: 'Germany',
    flag: '<svg viewBox="0 0 20 14"><rect width="20" height="4.67" y="0" fill="#000"/><rect width="20" height="4.67" y="4.67" fill="#d00"/><rect width="20" height="4.67" y="9.33" fill="#ffce00"/></svg>',
    locales: [
      { label: 'de-DE', href: '/de/de' },
    ],
  },
  {
    name: 'France',
    flag: '<svg viewBox="0 0 20 14"><rect width="20" height="14" fill="#fff"/><rect width="6.67" height="14" fill="#002395"/><rect x="13.33" width="6.67" height="14" fill="#ed2939"/></svg>',
    locales: [
      { label: 'fr-FR', href: '/fr/fr' },
    ],
  },
  {
    name: 'Spain',
    flag: '<svg viewBox="0 0 20 14"><rect width="20" height="14" fill="#c60b1e"/><rect y="3.5" width="20" height="7" fill="#ffc400"/></svg>',
    locales: [
      { label: 'es-ES', href: '/es/es' },
    ],
  },
  {
    name: 'Italy',
    flag: '<svg viewBox="0 0 20 14"><rect width="20" height="14" fill="#fff"/><rect width="6.67" height="14" fill="#009246"/><rect x="13.33" width="6.67" height="14" fill="#ce2b37"/></svg>',
    locales: [
      { label: 'it-IT', href: '/it/it' },
    ],
  },
];

/**
 * Builds the WKND language/country selector dropdown and wires its open/close
 * behavior onto the EN-US utility link. No-op if the link isn't present (only
 * the WKND nav has it), so the trendsetters header is unaffected.
 * @param {Element} nav The decorated nav element
 */
function decorateLanguageSelector(nav) {
  const toggle = nav.querySelector('.nav-utility a[href="#language"]');
  if (!toggle) return;

  toggle.classList.add('lang-toggle');
  toggle.setAttribute('aria-haspopup', 'true');
  toggle.setAttribute('aria-expanded', 'false');

  const panel = document.createElement('nav');
  panel.className = 'lang-nav';
  panel.setAttribute('aria-label', 'Language selector');
  const list = document.createElement('ul');
  LANG_COUNTRIES.forEach((country) => {
    const li = document.createElement('li');
    const label = document.createElement('span');
    label.className = 'lang-country';
    label.innerHTML = `<span class="lang-flag">${country.flag}</span>${country.name}`;
    const locales = document.createElement('ul');
    country.locales.forEach((loc) => {
      const locLi = document.createElement('li');
      const a = document.createElement('a');
      a.href = loc.href;
      a.textContent = loc.label;
      if (loc.current) a.setAttribute('aria-current', 'true');
      locLi.append(a);
      locales.append(locLi);
    });
    li.append(label, locales);
    list.append(li);
  });
  panel.append(list);
  toggle.parentElement.append(panel);

  const close = () => {
    toggle.setAttribute('aria-expanded', 'false');
    panel.classList.remove('open');
  };
  const open = () => {
    toggle.setAttribute('aria-expanded', 'true');
    panel.classList.add('open');
  };

  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    if (panel.classList.contains('open')) close();
    else open();
  });

  // close on outside click and on Escape
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && e.target !== toggle && !toggle.contains(e.target)) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') close();
  });
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // brand, nav links, tools (e.g. search), and an optional utility row
  // (e.g. Sign In + language). Pages with only 3 sections keep the classic
  // brand/sections/tools mapping; a 4th section becomes the utility bar.
  const classes = ['brand', 'sections', 'tools', 'utility'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // mark the nav link matching the current page as active (source highlights
  // the current section, e.g. Magazine, in yellow)
  const navPathname = window.location.pathname.replace(/\.html$/, '');
  nav.querySelectorAll('.nav-sections a[href]').forEach((a) => {
    const href = a.getAttribute('href').replace(/\.html$/, '');
    if (href && href !== '/' && navPathname.startsWith(href)) {
      a.setAttribute('aria-current', 'page');
    }
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  // WKND language/country selector dropdown (EN-US utility link)
  decorateLanguageSelector(nav);

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // Sticky-shrink: the source header collapses to a compact bar once the page
  // is scrolled (a 'scrolly' class on the body). Mirror that by toggling a
  // 'scrolled' class on the <header> when the window is scrolled past a small
  // threshold; the CSS shrinks the padded WKND header when this class is set.
  const header = block.closest('header') || block;
  const SCROLL_THRESHOLD = 40;
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > SCROLL_THRESHOLD);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}
