/* ===========================================================================
   UX Diagram Library — shared lightbox
   ===========================================================================
   Opens when any element with class "example-img" is clicked.
   Features: close button, "View original source" link (hidden when the clicked
   element has no data-source), caption, prev/next navigation, click-outside to
   close, Escape to close, and ArrowLeft/ArrowRight to navigate.

   Detail pages may call initLightbox() after injecting content; it is also
   auto-initialised on DOMContentLoaded. Visibility is toggled with the
   "active" class on the overlay (see .lightbox-overlay / .active in style.css).
   =========================================================================== */

(function () {
  'use strict';

  var overlay;
  var container;
  var imgEl;
  var captionEl;
  var sourceEl;
  var closeBtn;
  var triggerEl = null; // element that opened the lightbox, for focus return
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
    overlay.className = 'lightbox-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    container = document.createElement('div');
    container.className = 'lightbox-container';

    // Top bar: close (left) + source (right)
    var topBar = document.createElement('div');
    topBar.className = 'lightbox-top-bar';

    closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'lightbox-close';
    closeBtn.textContent = '✕ Close';
    closeBtn.addEventListener('click', close);

    sourceEl = document.createElement('a');
    sourceEl.className = 'lightbox-source';
    sourceEl.target = '_blank';
    sourceEl.rel = 'noopener noreferrer';
    sourceEl.textContent = 'View original source ↗';

    topBar.appendChild(closeBtn);
    topBar.appendChild(sourceEl);

    // Image
    imgEl = document.createElement('img');
    imgEl.className = 'lightbox-img';
    imgEl.alt = '';

    // Navigation arrows
    var arrows = document.createElement('div');
    arrows.className = 'lightbox-arrows';

    var prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'lightbox-arrow lightbox-prev';
    prevBtn.setAttribute('aria-label', 'Previous');
    prevBtn.innerHTML = '‹';
    prevBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      navigate(-1);
    });

    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'lightbox-arrow lightbox-next';
    nextBtn.setAttribute('aria-label', 'Next');
    nextBtn.innerHTML = '›';
    nextBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      navigate(1);
    });

    arrows.appendChild(prevBtn);
    arrows.appendChild(nextBtn);

    // Caption
    captionEl = document.createElement('div');
    captionEl.className = 'lightbox-caption';

    container.appendChild(topBar);
    container.appendChild(imgEl);
    container.appendChild(arrows);
    container.appendChild(captionEl);
    overlay.appendChild(container);

    // Click outside the container closes.
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKeydown);
  }

  // ---- (Re)bind click handlers to all .example-img elements ----------------
  function refreshTargets() {
    images = toArray(document.querySelectorAll('.example-img'));

    images.forEach(function (el) {
      if (el.__lbBound) return;
      el.__lbBound = true;
      // Make the trigger programmatically focusable so we can return focus on close.
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      el.addEventListener('click', function () {
        // Recompute from the live DOM in case content changed.
        images = toArray(document.querySelectorAll('.example-img'));
        open(images.indexOf(el), el);
      });
    });
  }

  // ---- Open / close / navigate ---------------------------------------------
  function open(index, trigger) {
    if (index < 0 || index >= images.length) return;
    current = index;
    triggerEl = trigger || images[index] || null;
    render();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Move focus into the dialog.
    closeBtn.focus();
  }

  function close() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    // Return focus to the element that opened the lightbox.
    if (triggerEl && typeof triggerEl.focus === 'function') {
      triggerEl.focus();
    }
    triggerEl = null;
  }

  function isOpen() {
    return overlay && overlay.classList.contains('active');
  }

  function navigate(delta) {
    if (!images.length) return;
    current = (current + delta + images.length) % images.length;
    render();
  }

  function render() {
    var el = images[current];
    if (!el) return;

    imgEl.src = el.getAttribute('data-full') || el.getAttribute('src') || '';
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

  function toArray(nodeList) {
    return Array.prototype.slice.call(nodeList);
  }
})();
