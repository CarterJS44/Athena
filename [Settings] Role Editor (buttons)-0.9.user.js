// ==UserScript==
// @name         [Settings] Role Editor (buttons)
// @namespace    https://tampermonkey.net/
// @version      0.9
// @description  “Read Only” & “Check All” buttons with nicer styling
// @match        *://*.etstack.io/*
// @run-at       document-idle
// @author       Carter Schuller
// @grant        GM_addStyle
// ==/UserScript==

//no need to autoupdate slack carter if there is a need/ problems 
(() => {
  'use strict';

  /* prettier CSS insert (dropped in once) */
  const css = `
  .roleBtn {
    font-size: 11px; line-height: 1.2;
    padding: 3px 10px 3px 8px;
    border-radius: 9999px;
    border: 1px solid var(--bs-primary);
    color: var(--bs-primary);
    background:#fff; transition:.15s;
    display:inline-flex; align-items:center; gap:4px;
  }
  .roleBtn:hover   { background: var(--bs-primary); color:#fff; }
  .roleBtn i       { font-size: 12px; }
  `;
  (typeof GM_addStyle==='function') ? GM_addStyle(css)
    : document.head.append(Object.assign(document.createElement('style'),{textContent:css}));

  /*  helper: fire Angular events once*/
  const fire = (el, ev) => el.dispatchEvent(new Event(ev, { bubbles: true }));
  const fire2 = el => { fire(el,'input'); fire(el,'change'); };

  /* read-only preset (unchanged logic) */
  function applyReadOnly(panel){
    // 1) clear everything
    panel.querySelectorAll('input[type="checkbox"]:not(:disabled)')
         .forEach(cb=>{ if(cb.checked){ cb.checked=false; fire2(cb);} });

    // 2) re-check READ + (fetch|save|delete in #subRow_userpreferences)
    panel.querySelectorAll('.pretty').forEach(box=>{
      const txt  = box.querySelector('label')?.textContent.trim().toLowerCase()||'';
      const pref = !!box.closest('#subRow_userpreferences');
      const keep = txt==='read' || (pref && /^(fetch|save|delete)$/.test(txt));
      if(!keep) return;

      const cb=box.querySelector('input[type="checkbox"]');
      if(cb && !cb.disabled && !cb.checked){ cb.checked=true; fire2(cb); }
    });
  }

  /*  all-on / all-off helpers */
  const allOn  = panel =>
    panel.querySelectorAll('input[type="checkbox"]:not(:disabled)')
         .forEach(cb=>{ if(!cb.checked){ cb.checked=true; fire2(cb);} });

  const allOff = panel =>
    panel.querySelectorAll('input[type="checkbox"]:not(:disabled)')
         .forEach(cb=>{ if(cb.checked){ cb.checked=false; fire2(cb);} });

  /* nicer black buttons + injector */
  function insertRoleButtons () {
    /* 1 ▪  locate the right grid-title */
    const gridTitles = [...document.querySelectorAll('.gridTitle')];
    const title = gridTitles.find(t => /role functionalities/i.test(t.textContent));
    if (!title) return;                              // panel not visible yet
    if (title.querySelector('.roBtn')) return;       // already injected

    const panel = document.querySelector('.panelContent.endpointsForm');
    if (!panel) return;

    /* 2 ▪  inject CSS once */
    if (!document.getElementById('roBtnCSS')) {
      const s = document.createElement('style');
      s.id = 'roBtnCSS';
      s.textContent = `
        .roBtn{
          background:#000!important;
          color:#fff!important;
          border:none!important;
          margin-left:8px;
          padding:4px 12px;
          font-size:12px;
          border-radius:20px;
          cursor:pointer;
          display:inline-flex;
          align-items:center;
          gap:6px;
          line-height:1.2;
          transition:filter .15s ease;
        }
        .roBtn:hover{ filter:brightness(1.25); }
        .roBtn i{ font-size:13px; }
      `;
      document.head.appendChild(s);
    }

    /* 3 ▪  mini helper to build a button */
    const makeBtn = (html, handler) => {
      const b = document.createElement('button');
      b.className = 'roBtn';
      b.innerHTML = html;
      b.addEventListener('click', e => { e.stopPropagation(); handler(panel); });
      return b;
    };

    /* 4 ▪  append the three buttons */
    title.append(
      makeBtn('<i class="fa-solid fa-book"></i> Read&nbsp;Only',  applyReadOnly),
      makeBtn('<i class="fa-solid fa-check-double"></i> All&nbsp;On',  allOn),
      makeBtn('<i class="fa-solid fa-circle-xmark"></i> All&nbsp;Off', allOff)
    );
  }

  /* keep trying while the user opens/closes the role panel */
  new MutationObserver(insertRoleButtons)
    .observe(document.body, { childList:true, subtree:true });
  insertRoleButtons();   // first attempt immediately
})();
