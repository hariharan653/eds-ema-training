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
  }
}
