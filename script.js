/* ===========================================================================
   UX Diagram Library — home page search & filter
   ===========================================================================
   A card is shown only when it satisfies ALL three conditions:
     1. search text matches its name and/or data-tags
     2. the active category filter (or "all")
     3. the active type filter (or "all")
   =========================================================================== */

(function () {
  'use strict';

  var state = {
    query: '',
    category: 'all',
    type: 'all'
  };

  // The home page filter buttons use descriptive slugs, while the cards carry
  // shorter data-category values. Map button value -> card data-category.
  var CATEGORY_MAP = {
    'research-synthesis': 'synthesis',
    'user-understanding': 'user',
    'journey-experience': 'journey',
    'quantitative': 'quant',
    'system-structure': 'system',
    'problem-framing': 'framing'
  };

  var searchInput;
  var cards;
  var countEl;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    searchInput = document.querySelector('.search-input');
    countEl = document.querySelector('.result-count');
    cards = Array.prototype.slice.call(
      document.querySelectorAll('.diagram-grid .card')
    );

    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        state.query = e.target.value.trim().toLowerCase();
        apply();
      });
    }

    wireFilterRow('[data-filter="category"]', 'category');
    wireFilterRow('[data-filter="type"]', 'type');

    apply();
  }

  function wireFilterRow(selector, key) {
    var row = document.querySelector(selector);
    if (!row) return;

    var buttons = Array.prototype.slice.call(
      row.querySelectorAll('.filter-btn')
    );

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state[key] = btn.getAttribute('data-value') || 'all';

        buttons.forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });

        apply();
      });
    });
  }

  function apply() {
    var visible = 0;

    cards.forEach(function (card) {
      if (matches(card)) {
        card.style.display = '';
        visible++;
      } else {
        card.style.display = 'none';
      }
    });

    updateCount(visible);
  }

  function matches(card) {
    // Category
    if (state.category !== 'all') {
      var wanted = CATEGORY_MAP[state.category] || state.category;
      if (card.getAttribute('data-category') !== wanted) return false;
    }

    // Type
    if (state.type !== 'all') {
      if (card.getAttribute('data-type') !== state.type) return false;
    }

    // Search query
    if (state.query) {
      var name = (card.querySelector('h2') || {}).textContent || '';
      var tags = card.getAttribute('data-tags') || '';
      var haystack = (name + ' ' + tags).toLowerCase();
      if (haystack.indexOf(state.query) === -1) return false;
    }

    return true;
  }

  function updateCount(n) {
    if (!countEl) return;
    countEl.textContent =
      'Showing ' + n + ' diagram' + (n === 1 ? '' : 's');
  }
})();
