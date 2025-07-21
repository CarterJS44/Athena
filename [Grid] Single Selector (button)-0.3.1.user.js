// ==UserScript==
// @name         [Grid] Single Selector (button)
// @namespace    https://etstack.io/
// @version      0.4
// @match        *://*.etstack.io/*
// @author       Carter Schuller
// @grant        none
// @updateURL https://raw.githubusercontent.com/CarterJS44/Athena/main/%5BGrid%5D%20Single%20Selector%20(button)-0.3.1.user.js
// ==/UserScript==


//--------------------------------------------------------------  UPDATE TEST ------------------------------------------------------
// why the hell wont this one work even after i commit changes RAHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH

(() => {
  'use strict';

  const BTN_ID     = 'tm-one-select-btn';
  const LS_ACTIVE  = 'tmOneSelectActive';
  const LS_DEBUG   = 'tmOneSelectDebug';

  let active = JSON.parse(localStorage.getItem(LS_ACTIVE) ?? 'false');
  let DEBUG  = JSON.parse(localStorage.getItem(LS_DEBUG)  ?? 'false');
  const log = (...a) => { if (DEBUG) console.log('[one-select]', ...a); };

  /* toggle button */
  if (!document.getElementById('tm-one-select-style')) {
    const s = document.createElement('style'); s.id = 'tm-one-select-style';
    s.textContent = `
      #${BTN_ID}{font-size:.75rem;line-height:1rem;user-select:none}
      #${BTN_ID}.on  {background:#138496!important;color:#fff!important}
      #${BTN_ID}.off {background:#6c757d!important;color:#fff!important}`;
    document.head.appendChild(s);
  }
  const refreshBtn = btn => {
    btn.className  = `btn btn-tiny ${active?'on':'off'} ml-1`;
    btn.textContent = `Single-select ${active?'ON':'OFF'}`;
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
        localStorage.setItem(LS_ACTIVE, JSON.stringify(active));
        refreshBtn(btn);
        log('active ->', active);
      };
      host.insertBefore(btn, host.querySelector('column-picker-v2') || null);
    }
    refreshBtn(btn);
  };
  setInterval(injectBtn, 1000); injectBtn();

  /* clear helper – looks for enabled Remove/Delete/Clear */
  const clickRemoveBtn = (scope=document) => {
    const btn = [...scope.querySelectorAll('button.btn-secondary-action:not([disabled])')]
      .find(b => /\b(remove|delete|clear)\b/i.test(b.textContent) && b.offsetParent);
    if (btn) { log('click toolbar clear:', btn.textContent.trim()); btn.click(); }
  };

  /* console helpers */
  function refreshBtnUI(){ const b=document.getElementById(BTN_ID); if(b) refreshBtn(b); }
  window.tmOneSelect = {
    on(){  active=true;  localStorage.setItem(LS_ACTIVE,'true');  refreshBtnUI(); log('forced ON'); },
    off(){ active=false; localStorage.setItem(LS_ACTIVE,'false'); refreshBtnUI(); log('forced OFF'); },
    debug(v=true){ DEBUG=!!v; localStorage.setItem(LS_DEBUG,JSON.stringify(DEBUG)); log('debug ->',DEBUG); },
    sels(grid=document.querySelector('.ag-root-wrapper')){
      if(!grid) return [];
      const ids=[...grid.querySelectorAll('.ag-center-cols-container .ag-row-selected[row-id]')]
        .map(r=>r.getAttribute('row-id'));
      console.log('selected rows:',ids);
      return ids;
    }
  };

  /* main interception */
  document.addEventListener('pointerdown', e => {
    if (!active) return;

    // only rows inside center cols
    const row = e.target.closest('.ag-center-cols-container [row-id]');
    if (!row) return;

    // find containing grid root
    const gridRoot = row.closest('.ag-root-wrapper');
    if (!gridRoot) return;

    // *** bail out for grids that don't have selection checkbox column ***
    if (!gridRoot.querySelector('[col-id="checkbox"]')) {
      log('skip grid (no checkbox col)');
      return;
    }

    const id = row.getAttribute('row-id') || '';
    if (!/^r\d+$/i.test(id)) return;  // ignore group/agg/etc

    // current selection *within this grid only*
    const selectedIds = [...gridRoot.querySelectorAll('.ag-center-cols-container .ag-row-selected[row-id]')]
      .map(r => r.getAttribute('row-id'))
      .filter(rid => /^r\d+$/i.test(rid));
    const unique = [...new Set(selectedIds)];

    log('click row', id, 'existing', unique);

    if (unique.length === 1 && unique[0] === id) return; // already sole

    if (unique.length) clickRemoveBtn(gridRoot.ownerDocument); // clear, then AG grid handles new select
  }, true); // capture
})();
