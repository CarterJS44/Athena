// ==UserScript==
// @name         [Tool] Dropdown Search Filter (Persistent)
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Adds a live-search box to long dropdown menus on etstack.io; skips short or special-case menus.
// @match        *://*.etstack.io/*
// @author       Carter and Joey
// @grant        none
// @updateURL https://raw.githubusercontent.com/CarterJS44/Athena/main/%5BTool%5D%20Dropdown%20Search%20Filter%20(Persistent)-1.7.user.js
// ==/UserScript==

(function () {
  'use strict';

  const MIN_ITEMS = 6;               // only menus with ≥ MIN_ITEMS get search

  /*  heuristics to skip special menus */
  function isExcludedDropdown(dropdown) {
    // 1) config-style dropdowns next to form-control anchors
    const anchorInputs = document.querySelectorAll(
      'input[ngbdropdownanchor].dropdown-toggle'
    );
    for (const anchor of anchorInputs) {
      const aRect = anchor.getBoundingClientRect();
      const dRect = dropdown.getBoundingClientRect();
      const vClose = Math.abs(dRect.top - aRect.bottom) < 50;
      const hClose = Math.abs(dRect.left - aRect.left) < 100;
      if (vClose && hClose &&
          (anchor.classList.contains('form-control') ||
           anchor.classList.contains('custom-input'))) {
        return true;
      }
    }

    // 2) inside searchable-select components
    if (dropdown.closest('.searchable-select-row')) return true;
    if (dropdown.closest('list-search-input') ||
        dropdown.closest('multi-searchable-select')) return true;

    // 3) pagination size picker
    if (dropdown.querySelector('.dropdown-header')?.textContent
        ?.includes('Results per Page')) return true;

    return false;
  }

  /*  main injector */
  function addSearchFilterToDropdown(dropdown) {
    if (dropdown.querySelector('.dropdown-search-input')) return;   // already added
    if (isExcludedDropdown(dropdown)) return;

    const buttons = dropdown.querySelectorAll('button.dropdown-item');
    if (buttons.length < MIN_ITEMS) return;                         // new guard

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Search...';
    input.className = 'dropdown-search-input';
    Object.assign(input.style, {
      width:        '100%',
      padding:      '5px 10px',
      marginBottom: '5px',
      boxSizing:    'border-box',
      border:       '1px solid #ccc',
      borderRadius: '4px'
    });

    dropdown.insertBefore(input, dropdown.firstChild);
    setTimeout(() => input.focus(), 50);

    input.addEventListener('input', () => {
      const filter = input.value.toLowerCase();
      buttons.forEach(btn => {
        const txt = btn.textContent.toLowerCase();
        btn.style.display = txt.includes(filter) ? '' : 'none';
      });
    });
  }

  /*  MutationObserver to catch new menus */
  const observer = new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1 &&
            node.classList.contains('dropdown-menu') &&
            node.classList.contains('show')) {
          addSearchFilterToDropdown(node);
        }
      });
    });
  });

  observer.observe(document.body, { childList:true, subtree:true });
})();
