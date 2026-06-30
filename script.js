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
  var filterGroups = {}; // key -> array of buttons

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

    // Allow deep-linking to a filtered view, e.g. index.html?category=synthesis
    applyQueryParams();

    apply();
  }

  function wireFilterRow(selector, key) {
    var row = document.querySelector(selector);
    if (!row) return;

    var buttons = Array.prototype.slice.call(
      row.querySelectorAll('.filter-btn')
    );
    filterGroups[key] = buttons;

    buttons.forEach(function (btn) {
      // Initialise aria-pressed from the current active state.
      btn.setAttribute(
        'aria-pressed',
        btn.classList.contains('is-active') ? 'true' : 'false'
      );

      btn.addEventListener('click', function () {
        activateButton(key, btn);
        apply();
      });
    });
  }

  // Mark a button active within its group, updating classes + aria-pressed.
  function activateButton(key, btn) {
    state[key] = btn.getAttribute('data-value') || 'all';

    (filterGroups[key] || []).forEach(function (b) {
      var on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  // Read ?category= and ?type= from the URL and pre-select the matching filters.
  function applyQueryParams() {
    var params = new URLSearchParams(window.location.search);

    var cat = params.get('category');
    if (cat) {
      var catBtn = findButton('category', function (value) {
        // Accept either the card value (e.g. "synthesis") or the
        // descriptive button value (e.g. "research-synthesis").
        return value === cat || CATEGORY_MAP[value] === cat;
      });
      if (catBtn) activateButton('category', catBtn);
    }

    var type = params.get('type');
    if (type) {
      var typeBtn = findButton('type', function (value) {
        return value === type;
      });
      if (typeBtn) activateButton('type', typeBtn);
    }
  }

  function findButton(key, predicate) {
    var buttons = filterGroups[key] || [];
    for (var i = 0; i < buttons.length; i++) {
      if (predicate(buttons[i].getAttribute('data-value') || '')) {
        return buttons[i];
      }
    }
    return null;
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
