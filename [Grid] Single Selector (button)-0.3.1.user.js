// ==UserScript==
// @name         [Grid] Single Selector (button)
// @namespace    https://etstack.io/
// @version      0.3.1
// @match        *://*.etstack.io/*
// @author       Carter Schuller
// @grant        none
// @updateURL https://raw.githubusercontent.com/CarterJS44/Athena/main/%5BGrid%5D%20Single%20Selector%20(button)-0.3.1.user.js
// ==/UserScript==

//--------------------------------------------------------------  UPDATE TEST ------------------------------------------------------
(() => {
  'use strict';

  /*  user pref  */
  const BTN_ID = 'tm-one-select-btn';
  let active = JSON.parse(localStorage.getItem('tmOneSelectActive') ?? 'false');

  /*  quick style & toggle button (unchanged) */
  if (!document.getElementById('tm-one-select-style')) {
    const s = document.createElement('style'); s.id = 'tm-one-select-style';
    s.textContent = `
      #${BTN_ID}{font-size:.75rem;line-height:1rem;user-select:none}
      #${BTN_ID}.on  {background:#138496!important;color:#fff!important}
      #${BTN_ID}.off {background:#6c757d!important;color:#fff!important}`;
    document.head.appendChild(s);
  }
  const refreshBtn = btn => {
    btn.className = `btn btn-tiny ${active?'on':'off'} ml-1`;
    btn.textContent = `Single‑select ${active?'ON':'OFF'}`;
  };
  const injectBtn = () => {
    const host = document.querySelector('.text-right.pb-1');
    if (!host) return;
    let btn = document.getElementById(BTN_ID);
    if (!btn) {
      btn = document.createElement('button');
      btn.id = BTN_ID;
      btn.onclick = () => {
        active = !active;
        localStorage.setItem('tmOneSelectActive', JSON.stringify(active));
        refreshBtn(btn);
      };
      host.insertBefore(btn, host.querySelector('column-picker-v2') || null);
    }
    refreshBtn(btn);
  };
  setInterval(injectBtn, 1000); injectBtn();

  /* helper: visible “Remove” button */
  const clickRemoveBtn = () => {
    const btn = [...document.querySelectorAll('button.btn-secondary-action:not([disabled])')]
      .find(b => /(^|\s)remove(\s|$)/i.test(b.textContent) && b.offsetParent);
    if (btn) btn.click();
  };

  /* pointer interceptor – fires before AG‑Grid */
  document.addEventListener('pointerdown', e => {
    if (!active) return;

    // only rows inside the *centre* container
    const row = e.target.closest('.ag-center-cols-container [row-id]');
    if (!row) return;

    const id = row.getAttribute('row-id') || '';
    if (!/^r\d+$/.test(id)) return;          // ← skip group / special rows

    // how many *unique* student IDs are currently selected?
    const selectedIds = [...document.querySelectorAll('.ag-center-cols-container .ag-row-selected')]
                          .map(r => r.getAttribute('row-id'))
                          .filter(rid => /^r\d+$/.test(rid));       // keep only real rows
    const unique = [...new Set(selectedIds)];

    // if already the sole selection – do nothing
    if (unique.length === 1 && unique[0] === id) return;

    // otherwise clear current selection first
    if (unique.length) clickRemoveBtn();     // AG‑Grid will now accept the click
  }, true); // capture
})();
