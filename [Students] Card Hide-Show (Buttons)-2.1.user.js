// ==UserScript==
// @name         [Students] Card Hide/Show (Buttons)
// @namespace    https://tampermonkey.net
// @version      2.1
// @description  Eye buttons on five cards + hot-key to restore all hidden cards
// @match        *://*.etstack.io/*
// @run-at       document-idle
// @author       Carter Schuller
// @grant        none
// @updateURL https://raw.githubusercontent.com/CarterJS44/Athena/main/%5BStudents%5D%20Card%20Hide-Show%20(Buttons)-2.1.user.js
// ==/UserScript==

(() => {
  'use strict';

  /* 1. Card titles we target */
  const CARD_TITLES = [
    'transportation requests',
    'contacts',
    'transportation needs',
    'additional needs',
    'documents'
  ];

  /* 2. Once-only styles for the icon button */
  if (!document.getElementById('tpToggleCss')) {
    const s = Object.assign(document.createElement('style'), {
      id: 'tpToggleCss',
      textContent: `
        .tpToggleBtn { all:unset; cursor:pointer; font-size:10px; color:#666; }
        .tpToggleBtn:hover { color:#000; }
      `
    });
    document.head.appendChild(s);
  }

  /* 3. Collapse / expand helpers */
  function collapse(area, btn) {
    if (area.dataset.tpHidden) return;
    area.dataset.tpHidden = '1';
    area.style.display = 'none';
    btn.firstElementChild.className = 'fa-solid fa-eye';
  }

  function expand(area, btn) {
    if (!area.dataset.tpHidden) return;
    delete area.dataset.tpHidden;
    area.style.display = '';
    btn.firstElementChild.className = 'fa-solid fa-eye-slash';
  }

  /* 4. Add button to a header row if missing */
  function addButton(titleRow, area) {
    if (titleRow.querySelector('.tpToggleBtn')) return;

    const btn = document.createElement('button');
    btn.className = 'tpToggleBtn';
    btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    btn.style.marginLeft = '6px';

    btn.addEventListener('click', () =>
      area.dataset.tpHidden ? expand(area, btn)
                            : collapse(area, btn)
    );
    titleRow.appendChild(btn);
  }

  /* 5. Scan DOM for every target card */
  function scan() {
    document.querySelectorAll('div.gridTitle').forEach(row => {
      const txt = row.textContent.trim().toLowerCase();
      if (!CARD_TITLES.some(t => txt.startsWith(t))) return;

      const area = row.closest('as-split-area') ||
                   row.closest('.panel') ||
                   row.closest('.row');
      if (!area) return;

      addButton(row, area);
    });
  }

  /* 6. Hot-key: Ctrl + Shift + U → expand ALL hidden cards */
  window.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'u') {
      document.querySelectorAll('.tpToggleBtn i.fa-eye').forEach(icon =>
        icon.parentElement.click()
      );
    }
  });

  /* 7. Initial scan + observe for SPA re-renders */
  scan();
  new MutationObserver(scan)
    .observe(document.body, { childList:true, subtree:true });
})();
