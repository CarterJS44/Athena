// ==UserScript==
// @name         [Runs] Highlight + Filter runs that exceed max load
// @namespace    https://etstack.io/
// @version      0.4.2
// @description  Highlights overloaded runs and optionally hides under‑capacity rows in /runsadmin. Button only appears on that page.
// @match        *://*.etstack.io/*
// @author       Carter Schuller
// @grant        none
// @updateURL    https://raw.githubusercontent.com/CarterJS44/Athena/main/%5BRuns%5D%20Highlight%20%2B%20Filer%20runs%20that%20exceed%20max%20load-0.4.1.user.js
// ==/UserScript==

(() => {
  'use strict';

  /*  helpers */
  //fuck ass helper to mantain button on only runs page, probably a better way to do this but it works
  const isRunsAdmin = () => /\/runsadmin\b/i.test(location.hash || location.pathname);

    /** Parse a cell like "1,234"  1234 */
  const num = t => +t.replace(/[^\d.]/g, '') || 0;

  /* bail out on first load if not on runs page yeahhhh */
  if (!isRunsAdmin()) return;

  /*  constants  */
  const OVER_CLASS  = 'tm-load-over';          // coloured row
  const HIDE_CLASS  = 'tm-load-hide';          // collapsed row
  const STORAGE_KEY = 'tmLoadOverActive';      // localStorage flag
  const BTN_ID      = 'tm-load-btn';

  let active = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'true');

  /* one time css injection very nice */
  if (!document.getElementById('tm-over-style')) {
    const css = document.createElement('style');
    css.id = 'tm-over-style';
    css.textContent = `
      .${OVER_CLASS} .ag-cell{
        background:#ffe1e1!important;
        border-left:5px solid #d40000!important;
        color:#000!important;
        font-weight:600;
      }
      .${HIDE_CLASS},
      .ag-pinned-left-cols-container .${HIDE_CLASS},
      .ag-pinned-right-cols-container .${HIDE_CLASS}{
        display:none!important;
      }
      #${BTN_ID}{
        user-select:none;white-space:nowrap;font-weight:600;
        line-height:1.2rem;font-size:.85rem!important;
        padding:.15rem .5rem!important;
        position:relative;top:-4px;left:-6px;
      }`;
    document.head.appendChild(css);
  }

  /* grid relayout helper */
  function relayout(grid){
    const containers = grid.querySelectorAll(
      '.ag-center-cols-container,' +
      '.ag-pinned-left-cols-container,' +
      '.ag-pinned-right-cols-container'
    );

    containers.forEach(cont=>{
      const rows = [...cont.querySelectorAll('[row-id]')];
      if (!rows.length) return;
      const rowH = rows[0].offsetHeight || 25;

      if (!active){
        /* restore original translateY */
        rows.forEach(r=>{
          if (r.dataset._origT){ r.style.transform = r.dataset._origT; delete r.dataset._origT; }
          r.classList.remove(HIDE_CLASS);
        });
        cont.style.height = '';
        return;
      }

      /* visible rows only */
      const vis = rows.filter(r=>!r.classList.contains(HIDE_CLASS));
      vis.forEach((r,i)=>{
        if(!r.dataset._origT) r.dataset._origT = r.style.transform;
        r.style.transform = `translateY(${i*rowH}px)`;
      });
      cont.style.height = (vis.length*rowH)+'px';
    });
  }

  /* scan a single grid  */
  function scanGrid(grid){
    grid.querySelectorAll('.ag-center-cols-container [col-id="load"]')
        .forEach(loadCell=>{
          const row = loadCell.closest('[row-id]');
          const load = num(loadCell.textContent);
          const max  = num(row?.querySelector('[col-id="loadMax"]')?.textContent);

          const over = max > 0 && load > max;   // overloaded for real

          grid.querySelectorAll(`[row-id="${row.getAttribute('row-id')}"]`)
              .forEach(r=>{
                r.classList.toggle(OVER_CLASS, over);
                r.classList.toggle(HIDE_CLASS, active && !over);
              });
        });

    relayout(grid);
  }

  /*  queued scheduler */
  const schedule = (()=>{ let pend=false;
    return ()=>{
      if(pend || !isRunsAdmin()) return;
      pend=true; requestAnimationFrame(()=>{ pend=false;
        document.querySelectorAll('.ag-root.ag-layout-normal').forEach(scanGrid);
      });
    };
  })();

  /*inject or update that fucking toggle button */
  function injectButton(){
    /* remove if we left /runsadmin */
    if(!isRunsAdmin()){
      document.getElementById(BTN_ID)?.remove();
      return;
    }

    /* already present? */
    if(document.getElementById(BTN_ID)) return;

    const host = document.querySelector('div.text-right.pb-1');
    if(!host){ setTimeout(injectButton, 300); return; }

    const btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.className = 'btn btn-sm';
    const updateLabel = () => btn.innerHTML =
      `<i class="fa-solid fa-people-line mr-1"></i>Over-load&nbsp;filter:&nbsp;<strong>${active?'ON':'OFF'}</strong>`;
    updateLabel();

      /* self explanitory */
    btn.onclick = () => {
      active = !active;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
      btn.className = `btn btn-sm ${active?'btn-primary':'btn-outline-secondary'} ml-2`;
      updateLabel();
      if (active){
        document.querySelectorAll('.ag-root.ag-layout-normal').forEach(scrollGridToTop);
      }
      schedule();
    };

    host.appendChild(btn);
    btn.className = `btn btn-sm ${active?'btn-primary':'btn-outline-secondary'} ml-2`;
  }

  /*  helper: scroll grid body to top */
  function scrollGridToTop(grid){
    const vp = grid.querySelector('.ag-body-viewport');
    if (vp) vp.scrollTop = 0;
  }

  /*  observers / timers  */
  new MutationObserver(()=>{ schedule(); injectButton(); })
     .observe(document.body,{childList:true,subtree:true});

  setInterval(schedule, 5000);

  /* re‑evaluate on SPA navigation */
  window.addEventListener('popstate', injectButton);
  window.addEventListener('hashchange', injectButton);

  /* first pass */
  schedule();
  injectButton();

  /* keep scanning while scrolling so freshly‑mounted rows are processed,
  this does not fucking work with the way other rows are hidden but whatever it will probably be usefull later when i want to fix the fuckass shit
  might very minorly inconvince performance but who gives a fuck */
  document.addEventListener('scroll', schedule, true);
})();
