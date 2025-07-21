// ==UserScript==
// @name         [Runs] Highlight + Filer runs that exceed max load
// @namespace    https://etstack.io/
// @version      0.4.1
// @match        *://*.etstack.io/*
// @author       Carter Schuller
// @grant        none
// @updateURL https://raw.githubusercontent.com/CarterJS44/Athena/main/%5BRuns%5D%20Highlight%20%2B%20Filer%20runs%20that%20exceed%20max%20load-0.4.1.user.js
// ==/UserScript==

(() => {
  'use strict';

    const urlChunk = location.hash || location.pathname;
    if (!/\/runsadmin\b/i.test(urlChunk)) {

        return;
    }

  
  const OVER_CLASS  = 'tm-load-over';          // coloured row
  const HIDE_CLASS  = 'tm-load-hide';          // collapsed row
  const STORAGE_KEY = 'tmLoadOverActive';      // localStorage flag
  const BTN_ID      = 'tm-load-btn';
  

  let active = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'true');

  /* one-time CSS */
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
        user-select:none; white-space:nowrap; font-weight:600;
        line-height:1.2rem; font-size:.85rem!important;
        padding:.15rem .5rem!important;
        position:relative; top:-4px; left:-6px;
      }`;
    document.head.appendChild(css);
  }

  /* helpers */
  const num = t => +t.replace(/[^\d.]/g, '') || 0;   // "1,234" → 1234

  
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
          if (r.dataset._origT){
            r.style.transform = r.dataset._origT;
            delete r.dataset._origT;
          }
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

  /* scan a single grid */
  function scanGrid(grid){
    grid.querySelectorAll('.ag-center-cols-container [col-id="load"]')
        .forEach(loadCell=>{
          const row = loadCell.closest('[row-id]');
          const load = num(loadCell.textContent);
          const max  = num(row?.querySelector('[col-id="loadMax"]')?.textContent);

          /* compute overload WITHOUT mixing the “active” flag */
          const over = max > 0 && load > max;          // ← overloaded for real

          /* highlight on every clone (centre + pinned) */
          grid.querySelectorAll(`[row-id="${row.getAttribute('row-id')}"]`)
              .forEach(r=>{
                r.classList.toggle(OVER_CLASS, over);
                /* hide only when filter is ON and row is NOT over */
                r.classList.toggle(HIDE_CLASS, active && !over);
              });
        });

    relayout(grid);            // tidy gaps / restore
  }

  /* schedule one scan per tick */
  const schedule = (()=>{ let pend=false;
    return ()=>{ if(pend) return;
      pend=true; requestAnimationFrame(()=>{ pend=false;
        document.querySelectorAll('.ag-root.ag-layout-normal').forEach(scanGrid);
      });
    };
  })();

  /* inject / update the toggle button */
  function injectButton(){
    if(document.getElementById(BTN_ID)) return;

    /* NEW host: final right-aligned tool-bar */
    const host = document.querySelector('div.text-right.pb-1');
    if(!host){ setTimeout(injectButton, 300); return; }

    const btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.className = 'btn btn-sm';
    const setLbl = ()=> btn.innerHTML =
      `<i class="fa-solid fa-people-line mr-1"></i>
       Over-load&nbsp;filter:&nbsp;<strong>${active?'ON':'OFF'}</strong>`;
    setLbl();

    btn.onclick = ()=>{
      active = !active;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
      btn.className = `btn btn-sm ${active?'btn-primary':'btn-outline-secondary'} ml-2`;
      setLbl();

      /* NEW – when we turn the filter ON, jump to the top */
      if (active){
        document.querySelectorAll('.ag-root.ag-layout-normal')
                .forEach(scrollGridToTop);
      }
      schedule();   // re-evaluate rows
    };

    host.appendChild(btn);
    btn.className = `btn btn-sm ${active?'btn-primary':'btn-outline-secondary'} ml-2`;
  }

  function scrollGridToTop(grid){
    // the main body viewport (there is only one per grid root)
    const vp = grid.querySelector('.ag-body-viewport');
    if (vp) vp.scrollTop = 0;
  }

  /* observers / timers */
  new MutationObserver(()=>{ schedule(); injectButton(); })
     .observe(document.body,{childList:true,subtree:true});

  setInterval(schedule, 5000);

  /* first pass */
  schedule();
  injectButton();

// OPTIONAL – keep scanning while the user scrolls so freshly-mounted
// virtual rows are cleaned up immediately.  Lightweight: one scan per
// animation-frame at most.
document.addEventListener('scroll', schedule, true);
})();
