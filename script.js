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

  // Search synonyms / alternate names, keyed by diagram slug. These are folded
  // into each card's searchable text so people who don't know our exact wording
  // (e.g. "customer journey", "CJM", "sitemap", "slopegraph") still find pages.
  var ALIASES = {
    'affinity-map': 'kj method thematic clustering grouping',
    'empathy-map': 'empathy mapping',
    'evidence-board': 'research wall insight wall',
    'coded-quote-matrix': 'thematic analysis coding',
    'polarity-map': 'spectrum continuum',
    'persona-card': 'user persona proto persona archetype profile',
    'mental-model-diagram': 'indi young mental models',
    'behavioral-archetype-map': 'archetypes user types segments',
    'cognitive-load-map': 'mental effort friction',
    'stakeholder-map': 'stakeholder mapping power interest grid',
    'user-journey-map': 'customer journey map cjm experience map user flow journey',
    'service-blueprint': 'blueprint frontstage backstage',
    'longitudinal-timeline': 'diary study over time timeline',
    'multi-actor-journey-map': 'two sided parallel journey dual',
    'bar-lollipop-chart': 'bar graph column chart lollipop',
    'radar-spider-chart': 'star chart polar profile',
    'kano-model-plot': 'kano satisfaction features',
    'bubble-dot-matrix': 'bubble chart dot plot',
    'rose-polar-chart': 'nightingale coxcomb polar area wind rose',
    'slope-bump-chart': 'slopegraph slope graph bumps ranking',
    'information-architecture': 'sitemap site map ia content tree navigation hierarchy',
    'swimlane-diagram': 'cross functional flowchart lanes process map',
    'ecosystem-map': 'ecosystem system map network',
    'causal-loop-map': 'systems thinking feedback loop cld',
    'concept-knowledge-map': 'concept map mind map knowledge graph',
    'prioritization-matrix': 'impact effort priority 2x2 eisenhower',
    'hmw-insight-board': 'how might we hmw opportunity questions',
    'problem-tree': 'root cause analysis problem framing',
    'tension-map': 'tradeoff competing forces',
    'design-space-map': 'solution space morphological possibility'
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

    // Precompute each card's searchable text: name + tags + aliases.
    cards.forEach(function (card) {
      var name = (card.querySelector('h2') || {}).textContent || '';
      var tags = card.getAttribute('data-tags') || '';
      var href = card.getAttribute('href') || '';
      var slug = href.replace('diagrams/', '').replace('.html', '');
      var aliases = ALIASES[slug] || '';
      card.__search = (name + ' ' + tags + ' ' + aliases).toLowerCase();
    });

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

    // Search query — every whitespace-separated token must appear somewhere in
    // the card's searchable text (order-independent, tolerant of extra words).
    if (state.query) {
      var tokens = state.query.split(/\s+/);
      for (var i = 0; i < tokens.length; i++) {
        if (tokens[i] && card.__search.indexOf(tokens[i]) === -1) return false;
      }
    }

    return true;
  }

  // How many cards match the search query alone, ignoring category/type filters.
  function searchOnlyCount() {
    if (!state.query) return cards.length;
    var tokens = state.query.split(/\s+/);
    var count = 0;
    cards.forEach(function (card) {
      for (var i = 0; i < tokens.length; i++) {
        if (tokens[i] && card.__search.indexOf(tokens[i]) === -1) return;
      }
      count++;
    });
    return count;
  }

  function resetFilters() {
    ['category', 'type'].forEach(function (key) {
      var allBtn = findButton(key, function (v) {
        return v === 'all';
      });
      if (allBtn) activateButton(key, allBtn);
    });
    apply();
    if (searchInput) searchInput.focus();
  }

  function updateCount(n) {
    if (!countEl) return;

    var filtersActive = state.category !== 'all' || state.type !== 'all';

    // If filters are hiding what the search would otherwise find, say so and
    // offer a one-click way out — instead of a dead-end "0 diagrams".
    if (n === 0 && filtersActive) {
      var alt = searchOnlyCount();
      if (alt > 0) {
        countEl.textContent = '0 with active filters — ';
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'link-btn';
        btn.textContent =
          'clear filters to see ' + alt + ' match' + (alt === 1 ? '' : 'es');
        btn.addEventListener('click', resetFilters);
        countEl.appendChild(btn);
        return;
      }
    }

    countEl.textContent =
      'Showing ' + n + ' diagram' + (n === 1 ? '' : 's');
  }
})();
