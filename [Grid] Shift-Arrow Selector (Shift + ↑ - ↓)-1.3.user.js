// ==UserScript==
// @name         [Grid] Shift-Arrow Selector (Shift + ↑ / ↓)
// @namespace    https://tampermonkey.net/
// @version      1.3
// @description  Shift + ↑ / ↓ selects the previous / next grid row (now triggers real row-selection highlight)
// @match        *://*.etstack.io/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  /* — helpers — */
  const currentRow = () =>
    document.querySelector('.ag-row-focus') ||
    document.querySelector('.ag-row-selected');

  /** Fire the usual mousedown → mouseup → click trio on `el`. */
  function clickLikeHuman(el) {
    const ev = t => el.dispatchEvent(new MouseEvent(t, {bubbles:true}));
    ['mousedown','mouseup','click'].forEach(ev);
  }

  /** Select by row-index (returns true if row existed). */
  function selectRow(idx) {
    const row = document.querySelector(
      `.ag-center-cols-container [row-index="${idx}"]`
    );
    if (!row) return false;

    /* first non-checkbox data cell */
    const cell =
      row.querySelector(
        '.ag-cell[role="gridcell"]:not(.ag-selection-checkbox *)'
      ) || row;            // fall back to the row itself

    clickLikeHuman(cell);
    cell.focus({preventScroll:true});
    row.scrollIntoView({block:'nearest'});
    return true;
  }

  /* — hot-key — */
  document.addEventListener(
    'keydown',
    e => {
      if (!e.shiftKey || !['ArrowDown','ArrowUp'].includes(e.key)) return;

      /* let inputs/textareas keep their own ↑/↓ */
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target.isContentEditable
      ) return;

      e.preventDefault();

      const row = currentRow();
      if (!row) return;

      const cur = Number(row.getAttribute('row-index'));
      if (Number.isNaN(cur)) return;

      selectRow(e.key === 'ArrowDown' ? cur + 1 : cur - 1);
    },
    /* capture = before AG-Grid handles the key */
    true
  );
})();
