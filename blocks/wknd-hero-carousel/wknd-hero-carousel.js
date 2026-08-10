/**
 * Defer a non-first slide's images: move src/srcset to data-* so the browser
 * doesn't fetch them at load (they're above-the-fold in the scroller, so
 * loading=lazy alone won't stop the fetch). restoreDeferredSlide() puts them
 * back when the slide is shown or after the page has loaded.
 */
function deferSlideImages(slide) {
  slide.querySelectorAll('picture source, picture img').forEach((el) => {
    if (el.getAttribute('srcset')) {
      el.dataset.srcset = el.getAttribute('srcset');
      el.removeAttribute('srcset');
    }
    if (el.tagName === 'IMG' && el.getAttribute('src')) {
      el.dataset.src = el.getAttribute('src');
      // 1x1 transparent placeholder keeps layout stable (no CLS)
      el.setAttribute('src', 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==');
    }
  });
}

/** Restore a deferred slide's real image sources (idempotent). */
function restoreDeferredSlide(slide) {
  if (!slide || slide.dataset.restored) return;
  slide.querySelectorAll('picture source, picture img').forEach((el) => {
    if (el.dataset.srcset) {
      el.setAttribute('srcset', el.dataset.srcset);
      delete el.dataset.srcset;
    }
    if (el.dataset.src) {
      el.setAttribute('src', el.dataset.src);
      delete el.dataset.src;
    }
  });
  slide.dataset.restored = 'true';
}

function updateActiveSlide(slide) {
  const block = slide.closest('.wknd-hero-carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.wknd-hero-carousel-slide');

  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
    aSlide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  const indicators = block.querySelectorAll('.wknd-hero-carousel-slide-indicator');
  indicators.forEach((indicator, idx) => {
    if (idx !== slideIndex) {
      indicator.querySelector('button').removeAttribute('disabled');
    } else {
      indicator.querySelector('button').setAttribute('disabled', 'true');
    }
  });
}

export function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.wknd-hero-carousel-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];

  // ensure the target slide's deferred images are loaded before we scroll to it
  restoreDeferredSlide(activeSlide);

  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.wknd-hero-carousel-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.wknd-hero-carousel-slide-indicators');
  if (!slideIndicators) return;

  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const slideIndicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
    });
  });

  block.querySelector('.slide-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
  });

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.wknd-hero-carousel-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `wknd-hero-carousel-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('wknd-hero-carousel-slide');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(`wknd-hero-carousel-slide-${colIdx === 0 ? 'image' : 'content'}`);
    slide.append(column);
  });

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `wknd-hero-carousel-${carouselId}`);
  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  const container = document.createElement('div');
  container.classList.add('wknd-hero-carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('wknd-hero-carousel-slides');
  block.prepend(slidesWrapper);

  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', 'Carousel Slide Controls');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('wknd-hero-carousel-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);
    block.append(slideIndicatorsNav);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('wknd-hero-carousel-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class= "slide-prev" aria-label="Previous Slide"></button>
      <button type="button" class="slide-next" aria-label="Next Slide"></button>
    `;

    // append to the block (not the slides container) so the arrows can sit in
    // the indicator-dots row below the image, matching the source — the source
    // places prev/next in the white strip beneath the hero, not over it.
    block.append(slideNavButtons);
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    slidesWrapper.append(slide);

    // LCP optimization: the first slide's image is the LCP candidate — load it
    // eagerly at high priority. The other slides sit in an above-the-fold
    // horizontal scroller, so `loading=lazy` does NOT stop the browser fetching
    // them at load — they'd compete with the LCP image on slow connections
    // (~130 KiB on this hero). Instead DEFER them: strip src/srcset into data-*
    // and restore after window load or when the slide is shown (see
    // restoreDeferredSlide + the load handler in decorate).
    const slideImg = slide.querySelector('img');
    if (slideImg) {
      if (idx === 0) {
        slideImg.setAttribute('loading', 'eager');
        slideImg.setAttribute('fetchpriority', 'high');
      } else {
        slideImg.setAttribute('loading', 'lazy');
        slideImg.setAttribute('fetchpriority', 'low');
        // eslint-disable-next-line no-use-before-define
        deferSlideImages(slide);
      }
    }

    // SEO / heading hierarchy: promote the first slide's heading to the page's
    // single <h1>. The source uses <h2> for every carousel title, which leaves
    // the page with no <h1>; the first slide is the page's primary heading.
    if (idx === 0) {
      const heading = slide.querySelector('h2, h3, h4, h5, h6');
      if (heading) {
        const h1 = document.createElement('h1');
        h1.id = heading.id;
        h1.className = heading.className;
        h1.innerHTML = heading.innerHTML;
        heading.replaceWith(h1);
      }
    }

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('wknd-hero-carousel-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="Show Slide ${idx + 1} of ${rows.length}"></button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  if (!isSingleSlide) {
    bindEvents(block);

    // After the page has loaded (LCP done), restore the deferred slide images
    // so the carousel is fully ready without ever competing with the LCP image.
    const restoreAll = () => block.querySelectorAll('.wknd-hero-carousel-slide')
      .forEach((slide) => restoreDeferredSlide(slide));
    if (document.readyState === 'complete') {
      restoreAll();
    } else {
      window.addEventListener('load', restoreAll, { once: true });
    }
  }
}
