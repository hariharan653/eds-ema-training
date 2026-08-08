/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: wknd.site (wknd-*) site-wide cleanup.
 * Removes non-authorable global chrome and layout artifacts so only the
 * body content (hero carousel, teasers, image-lists, titles, buttons,
 * separators) remains for block parsing.
 *
 * All selectors verified against migration-work/cleaned.html for
 * https://wknd.site/us/en.html. Header (rc1) and footer (rc14) are the
 * experience-fragment chrome and are handled separately by header/footer
 * orchestration, so they are stripped here.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Content fragments carry a `.cmp-contentfragment__title` heading that
    // duplicates the article/trip title (hidden via CSS on the source, but
    // ingested by the importer). Remove it so each page keeps a single title.
    WebImporter.DOMUtils.remove(element, [
      '.cmp-contentfragment__title',
      '.sharing',                    // "Share this story/adventure" social widget
      '.cmp-sharing',
    ]);

    // "Share this Adventure/Story" widget on article/adventure pages: a title
    // block + a Pinterest share link, not authorable content. Remove the
    // Pinterest link and any sibling title whose text starts with "Share this".
    element.querySelectorAll('a[href*="pinterest.com/pin/create"]').forEach((a) => {
      const wrapper = a.closest('.cmp-sharing, .sharing, div');
      (wrapper || a).remove();
    });
    element.querySelectorAll('.cmp-title').forEach((t) => {
      if (/^\s*share this/i.test(t.textContent || '')) t.remove();
    });

    // Adventures listing: the category filter tabs (All / Climbing / Cycling /
    // ...) each render the SAME trips in their own hidden tabpanel. Keep only
    // the active "All" panel; remove the inactive duplicates and the tab strip
    // so the listing shows one card grid, not six.
    // IMPORTANT: only do this for card-grid tabs (panels containing an
    // .image-list). Adventure DETAIL pages use tabs for Overview/Itinerary/
    // What-to-Bring rich content (no .image-list) — those must be preserved so
    // the wknd-trip-tabs block parser can capture all panels.
    const activeGridPanel = element.querySelector('.cmp-tabs__tabpanel--active .image-list');
    if (activeGridPanel) {
      element.querySelectorAll('.cmp-tabs__tabpanel:not(.cmp-tabs__tabpanel--active)').forEach((p) => {
        if (p.querySelector('.image-list')) p.remove();
      });
      element.querySelectorAll('.cmp-tabs__tablist, [role="tablist"]').forEach((tl) => tl.remove());
    }
  }
  if (hookName === TransformHook.afterTransform) {
    // Non-authorable global chrome (verified in cleaned.html):
    //  - header experience-fragment: sign-in buttons, language navigation,
    //    logo, main navigation, search (<header class="experiencefragment
    //    cmp-experiencefragment--header">, line 5).
    //  - footer experience-fragment: footer logo, footer nav, social buttons,
    //    copyright text (<footer class="experiencefragment
    //    cmp-experiencefragment--footer">, line 471).
    //  - mobile navigation toggle and drawer (#toggleNav, #mobileNav).
    //  - Adobe ID-syncing iframe (id="destination_publishing_iframe_...").
    //  - stray <meta> tags emitted inside cmp-image wrappers, plus <link>
    //    and <noscript> leftovers.
    WebImporter.DOMUtils.remove(element, [
      'header.experiencefragment',   // cmp-experiencefragment--header chrome
      'footer.experiencefragment',   // cmp-experiencefragment--footer chrome
      '#toggleNav',                  // mobile nav toggle button
      '#mobileNav',                  // mobile nav drawer
      'iframe',                      // Adobe ID-syncing iframe
      'meta',                        // stray <meta> inside cmp-image blocks
      'link',
      'noscript',
    ]);

    // Strip the ".html" suffix from internal /us/en links. AEM Edge Delivery
    // serves pages extensionless, so card/teaser links to "…/arctic-surfing.html"
    // 404 on click. Rewrite them to "…/arctic-surfing" (leave external links and
    // anchors untouched).
    element.querySelectorAll('a[href$=".html"]').forEach((a) => {
      const href = a.getAttribute('href');
      if (href && /^\/us\/en\//.test(href)) {
        a.setAttribute('href', href.replace(/\.html$/, ''));
      }
    });

    // Download-PDF links point at a wknd.site AEM DAM path
    // (/content/dam/.../ultimateguidetolaskateparks.pdf.coredownload.pdf) that
    // does not exist on our EDS site, so the download 404s. The PDF has been
    // re-hosted on our Document Authoring site; rewrite the href to the local
    // asset so it downloads. (Guide-la-skateparks is the only page with a PDF.)
    element.querySelectorAll('a[href*=".coredownload."], a[href*="/content/dam/"][href*=".pdf"]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (/ultimateguidetolaskateparks\.pdf/.test(href)) {
        a.setAttribute('href', '/us/en/magazine/assets/ultimateguidetolaskateparks.pdf');
      }
    });
  }
}
