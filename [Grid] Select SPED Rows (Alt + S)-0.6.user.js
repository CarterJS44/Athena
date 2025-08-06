// ==UserScript==
// @name         [Grid] Select SPED Rows (Alt + S)
// @namespace    https://etstack.io/
// @version      0.6
// @description  Selects all rows with "SPED" in the program column and clicks their checkboxes. Works with Alt+S and retries on virtualized rows.
// @author       Carter Schuller
// @license      MIT
// @match        *://*.etstack.io/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/yourusername/repo/main/[Grid]%20Select%20SPED%20Rows%20(Alt%20%2B%20S)-0.6.user.js
// ==/UserScript==

(() => {
  'use strict';

  const HOTKEY = 'KeyS';
  const DEBUG = false;

  const log = (...args) => DEBUG && console.log('[SPED Selector]', ...args);
  const warn = (...args) => DEBUG && console.warn('[SPED Selector]', ...args);

  function realClick(el) {
    ['mousedown', 'mouseup', 'click'].forEach(ev =>
      el.dispatchEvent(new MouseEvent(ev, { bubbles: true }))
    );
  }

  function findCheckbox(rowIndex) {
    const rows = document.querySelectorAll(`[row-index="${rowIndex}"]`);
    for (const row of rows) {
      const cb = row.querySelector('.athena-checkbox');
      if (cb && cb.offsetParent !== null) return cb;
    }
    return null;
  }

  function scrollToRow(rowIndex) {
    const row = document.querySelector(`.ag-center-cols-container [row-index="${rowIndex}"]`);
    if (row) row.scrollIntoView({ block: 'center' });
  }

  async function retryMissingRowsSequentially(missing) {
    for (const rowIndex of missing) {
      log(`🔁 Scrolling to row-index=${rowIndex}...`);
      scrollToRow(rowIndex);

      await new Promise(res => setTimeout(res, 150)); // allow rendering time

      const checkbox = findCheckbox(rowIndex);
      if (checkbox) {
        realClick(checkbox);
        log(`✔ (After Scroll) Clicked checkbox for row-index=${rowIndex}`);
      } else {
        warn(`❌ (After Scroll) Still missing checkbox for row-index=${rowIndex}`);
      }
    }
  }

  function selectSpedRows() {
    const cells = document.querySelectorAll('[col-id="program"]');
    const missing = [];
    let count = 0;

    cells.forEach(cell => {
      const text = cell.textContent.trim();
      if (text !== 'SPED') return;

      const row = cell.closest('[row-index]');
      const rowIndex = row?.getAttribute('row-index');
      if (!rowIndex) {
        warn('No [row-index] for SPED cell', cell);
        return;
      }

      const checkbox = findCheckbox(rowIndex);
      if (checkbox) {
        realClick(checkbox);
        log(`✔ Clicked checkbox for row-index=${rowIndex}`);
        count++;
      } else {
        warn(`⚠️ No checkbox found for row-index=${rowIndex}`);
        missing.push(rowIndex);
      }
    });

    log(`✅ Selected ${count} checkboxes. ${missing.length} missing.`);

    if (missing.length > 0) {
      retryMissingRowsSequentially(missing);
    }
  }

  window.addEventListener('keydown', e => {
    if (
      e.code === HOTKEY &&
      e.altKey &&
      !e.ctrlKey && !e.shiftKey && !e.metaKey &&
      !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target.isContentEditable)
    ) {
      e.preventDefault();
      e.stopPropagation();
      log('🎯 Alt+S triggered');
      selectSpedRows();
    }
  }, true);
})();
