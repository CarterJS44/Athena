// ==UserScript==
// @name         [Planning] Highlight Changed Runs Opt Assign
// @namespace    https://etstack.io/
// @version      0.6
// @match        *://*.etstack.io/*
// @author       Carter Schuller
// @grant        none
// @updateURL https://raw.githubusercontent.com/CarterJS44/Athena/main/%5BPlanning%5D%20Highlight%20Changed%20Runs%20Opt%20Assign-0.6%20(1).user.js
// ==/UserScript==

(() => {
  'use strict';

  /*idx nums*/
  const BEFORE_IDX = 14;        // “before” grid index
  const AFTER_IDX  = 15;        // “after”  grid index
 

  /* 1 styling  */
  const DIFF_CLASS = 'tm-row-diff';
  if (!document.getElementById('tm-diff-style')) {
    const css = `
      .${DIFF_CLASS} .ag-cell{
        background:#dbeeff !important;     /* soft blue */
        border-left:4px solid #006ec7 !important;
        font-weight:600;
        color:#003959 !important;
      }`;
    Object.assign(document.head.appendChild(document.createElement('style')), {
      id: 'tm-diff-style',
      textContent: css.trim()
    });
  }

  /* 2 helpers  */
  const tidy = s => (s ?? '').replace(/\s+/g, ' ').trim();

  function mapRows(grid) {
    return new Map(
      [...grid.querySelectorAll('.ag-center-cols-container [row-id]')]
        .map(row => [
          row.getAttribute('row-id'),
          { txt: tidy(row.textContent), row }
        ])
    );
  }

  /* 3 core diff */
  let beforeGrid, afterGrid;         // cached once we find them

  function highlightDiffs() {
    if (!beforeGrid || !afterGrid) return;

    const mapB = mapRows(beforeGrid);
    const mapA = mapRows(afterGrid);

    let changed = 0;
    mapA.forEach((a, key) => {
      const b = mapB.get(key);
      const diff = !b || a.txt !== b.txt;
      a.row.classList.toggle(DIFF_CLASS, diff);
      if (b) b.row.classList.toggle(DIFF_CLASS, diff);
      if (diff) changed++;
    });
    console.debug('[diff-runs] highlighted', changed, 'row(s)');
  }

  /* 4 cheap scheduler  */
  // single queued run no matter how many DOM mutations arrive
  const schedule = (() => {
    let pending = false;
    return () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        highlightDiffs();
      });
    };
  })();

  /* 5  bootstrap  */
  function locateGrids() {
    const grids = document.querySelectorAll('.ag-root.ag-layout-normal');
    beforeGrid = grids[BEFORE_IDX] || null;
    afterGrid  = grids[AFTER_IDX]  || null;
    if (beforeGrid && afterGrid) {
      schedule();                     // initial diff once found
    }
  }
  locateGrids();

  /* watch for grid creation / re-creation */
  new MutationObserver(() => {
    locateGrids();       // (cheap, only a few Node look-ups)
    schedule();
  }).observe(document.body, { childList: true, subtree: true });

  /* cheap periodic fallback – once every 5 s */
  setInterval(schedule, 5_000);
})();
