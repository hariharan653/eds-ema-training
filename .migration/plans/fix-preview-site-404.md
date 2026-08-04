I'll inspect the source page to build an accurate migration plan.# Migrate Page: about-us (wknd-trendsetters.site)

## Objective
Migrate `https://wknd-trendsetters.site/about-us` into the `eds-ema-training` AEM Edge Delivery project, decompose it into sections/blocks, generate the import content, verify it in local preview, and publish it to the content source.

## Source Page Structure (from initial fetch)
Top-to-bottom sections identified on the source page:

1. **Header / Navigation** — "Fashion Blog" logo, menu (Trends w/ dropdown, About, Blog, Support w/ dropdown), Subscribe button. *(Site-level — nav already exists in this project; will verify/skip unless it needs updating.)*
2. **Hero** — tagline "Fresh looks, bold stories, real life", intro text, 3-image carousel, CTA buttons ("See case", "All stories").
3. **Featured Content** — breadcrumb, title + author byline (Taylor Brooks, June 12 2024), "Style in every snapshot" 8-image grid gallery.
4. **Testimonials** — 4 personas with quote + avatar (Alex Rivera, Taylor Kim, Jordan Ellis, Morgan Blake).
5. **Latest Articles** — grid of 4 blog cards (image, category, date, title).
6. **FAQ** — "Got questions? We've got answers" + 4 Q&A pairs.
7. **Call-to-Action** — large image, promo text, "See more" button.
8. **Footer** — logo, social links, footer link columns. *(Site-level — footer already exists; will verify/skip.)*

## Target Project Context (confirmed earlier this session)
- Repo: `github.com/hariharan653/eds-ema-training` (Document Authoring project).
- Content source: `https://content.da.live/hariharan653/eds-ema-training/` (fstab.yaml now in place).
- DA credentials opt-in is enabled (verified working this session).
- Target path for this page: `/about-us`.

## Approach
Use the project's structured migration workflow (site/page analysis → block mapping → import infrastructure → content generation → preview → publish) rather than hand-writing HTML. Content files must be generated via the bundled import script, never authored directly.

## Checklist

### Phase 1 — Scrape & Analyze
- [ ] Scrape the source page (download HTML, images, metadata; produce cleaned HTML + analysis JSON).
- [ ] Identify section boundaries and content sequences (default content vs. blocks).
- [ ] Survey the project's available block palette (block inventory / block library) to map each section to an existing block or a new variant.

### Phase 2 — Block Mapping & Decisions
- [ ] Map each section to a block: hero (carousel), gallery/columns for the 8-image grid, cards for testimonials & latest articles, an accordion/FAQ block, and a CTA block.
- [ ] Confirm with the user any block-choice decisions where multiple valid options exist (e.g. carousel vs. static hero, accordion vs. plain FAQ).
- [ ] Record block variant mappings in `page-templates.json`; reuse existing variants where ≥80% similar, create new ones only where needed.

### Phase 3 — Import Infrastructure
- [ ] Generate/confirm block parsers for each mapped variant.
- [ ] Generate page transformers (cleanup, sections, image handling).
- [ ] Assemble the import script for the `/about-us` page.

### Phase 4 — Generate Content
- [ ] Run the bundled import script to produce the `/about-us` content file(s) under the project content directory.
- [ ] Confirm images were captured/optimized and referenced correctly.

### Phase 5 — Preview & Verify
- [ ] Start/confirm the local dev server and open `/about-us` in preview.
- [ ] Inspect DOM/structure via snapshot; compare section-by-section against the original.
- [ ] Visually critique and fix any block styling gaps against the source page (iterate until it matches).

### Phase 6 — Publish
- [ ] Upload the `/about-us` content to Document Authoring (`admin.da.live` source API).
- [ ] Trigger **preview** for `/about-us` via `admin.hlx.page`.
- [ ] Confirm `https://main--eds-ema-training--hariharan653.aem.page/about-us` returns 200 and renders.
- [ ] Publish to **live** (only if the user asks) and verify the `.aem.live` URL.

## Open Questions (to resolve before/at Phase 2)
- Scope: migrate **only the page body** (hero → CTA) and reuse the existing project nav/footer, or also rebuild the header/footer to match wknd-trendsetters? 
- Should the hero's 3-image element be a **carousel** block or a simpler static hero?
- Publish target: **preview only**, or **preview + live**?

---
*Execution requires Execute mode. Once approved, I'll begin at Phase 1 (scrape & analyze) and pause at Phase 2 to confirm the block-choice and scope questions above.*
