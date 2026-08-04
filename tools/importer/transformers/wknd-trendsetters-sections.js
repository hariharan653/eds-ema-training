/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: wknd-trendsetters section breaks and section metadata.
 * Runs in afterTransform only. Driven by payload.template.sections from
 * page-templates.json. Section selectors are verified against the template.
 *
 * For each section (processed in reverse so DOM inserts don't shift earlier
 * matches):
 *   - if section.style is set, insert a Section Metadata block after the section
 *   - if the section is not the first, insert an <hr> before the section
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    const sections = payload && payload.template && payload.template.sections;
    if (!sections || sections.length < 2) return;

    const doc = element.ownerDocument;

    // Process in reverse order so inserting nodes does not affect the
    // position of sections we have not yet handled.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const target = element.querySelector(section.selector);
      if (!target) continue;

      // Section Metadata block (only for sections that declare a style).
      if (section.style) {
        const metaBlock = WebImporter.Blocks.createBlock(doc, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        target.after(metaBlock);
      }

      // Section break before every section except the first.
      if (i > 0) {
        const hr = doc.createElement('hr');
        target.before(hr);
      }
    }
  }
}
