/* ===========================================================================
   UX Diagram Library — shared lightbox
   ===========================================================================
   Opens when any element with class "example-img" is clicked.
   Supports: close button, source link, caption, prev/next navigation,
   click-outside to close, Escape to close, ArrowLeft/ArrowRight to navigate.

   Detail pages may call initLightbox() after injecting content; it is also
   auto-initialised on DOMContentLoaded.
   =========================================================================== */

(function () {
  'use strict';

  var overlay;
  var imgEl;
  var captionEl;
  var sourceEl;
  var images = [];
  var current = 0;

  // ---- Public API ----------------------------------------------------------
  window.initLightbox = initLightbox;

  document.addEventListener('DOMContentLoaded', initLightbox);

  function initLightbox() {
    buildOverlay();
    refreshTargets();
  }

  // ---- Build the overlay once ----------------------------------------------
  function buildOverlay() {
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('hidden', '');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    var container = document.createElement('div');
    container.className = 'lightbox__container';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox__close';
    closeBtn.type = 'button';
    closeBtn.textContent = '✕ Close';
    closeBtn.addEventListener('click', close);

    sourceEl = document.createElement('a');
    sourceEl.className = 'lightbox__source';
    sourceEl.target = '_blank';
    sourceEl.rel = 'noopener noreferrer';
    sourceEl.textContent = 'View original source ↗';

    var prevBtn = document.createElement('button');
    prevBtn.className = 'lightbox__arrow lightbox__arrow--prev';
    prevBtn.type = 'button';
    prevBtn.setAttribute('aria-label', 'Previous');
    prevBtn.innerHTML = '‹';
    prevBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      navigate(-1);
    });

    var nextBtn = document.createElement('button');
    nextBtn.className = 'lightbox__arrow lightbox__arrow--next';
    nextBtn.type = 'button';
    nextBtn.setAttribute('aria-label', 'Next');
    nextBtn.innerHTML = '›';
    nextBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      navigate(1);
    });

    imgEl = document.createElement('img');
    imgEl.className = 'lightbox__image';
    imgEl.alt = '';

    captionEl = document.createElement('div');
    captionEl.className = 'lightbox__caption';

    container.appendChild(closeBtn);
    container.appendChild(sourceEl);
    container.appendChild(prevBtn);
    container.appendChild(imgEl);
    container.appendChild(nextBtn);
    container.appendChild(captionEl);
    overlay.appendChild(container);

    // Click outside the container closes.
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    // Clicks on the container background (not the image) also close.
    container.addEventListener('click', function (e) {
      if (e.target === container) close();
    });

    document.body.appendChild(overlay);

    document.addEventListener('keydown', onKeydown);
  }

  // ---- (Re)bind click handlers to all .example-img elements ----------------
  function refreshTargets() {
    images = Array.prototype.slice.call(
      document.querySelectorAll('.example-img')
    );

    images.forEach(function (el, i) {
      if (el.__lbBound) return;
      el.__lbBound = true;
      el.addEventListener('click', function () {
        // Recompute index from the live list in case DOM changed.
        images = Array.prototype.slice.call(
          document.querySelectorAll('.example-img')
        );
        open(images.indexOf(el));
      });
    });
  }

  // ---- Open / close / navigate ---------------------------------------------
  function open(index) {
    if (index < 0 || index >= images.length) return;
    current = index;
    render();
    overlay.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  function isOpen() {
    return overlay && !overlay.hasAttribute('hidden');
  }

  function navigate(delta) {
    if (!images.length) return;
    current = (current + delta + images.length) % images.length;
    render();
  }

  function render() {
    var el = images[current];
    if (!el) return;

    var fullSrc = el.getAttribute('data-full') || el.getAttribute('src');
    imgEl.src = fullSrc || '';
    imgEl.alt = el.getAttribute('alt') || '';

    var caption = el.getAttribute('data-caption') || '';
    captionEl.textContent = caption;
    captionEl.style.display = caption ? '' : 'none';

    var source = el.getAttribute('data-source');
    if (source) {
      sourceEl.href = source;
      sourceEl.style.display = '';
    } else {
      sourceEl.removeAttribute('href');
      sourceEl.style.display = 'none';
    }
  }

  // ---- Keyboard ------------------------------------------------------------
  function onKeydown(e) {
    if (!isOpen()) return;

    if (e.key === 'Escape') {
      close();
    } else if (e.key === 'ArrowLeft') {
      navigate(-1);
    } else if (e.key === 'ArrowRight') {
      navigate(1);
    }
  }
})();
