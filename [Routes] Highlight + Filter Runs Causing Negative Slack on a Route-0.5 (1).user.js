// ==UserScript==
// @name         [Routes] Highlight + Filter Runs Causing Negative Slack on a Route
// @namespace    https://tampermonkey.net/
// @version      0.5
// @description  Colour the pair of runs whose slack is the most‑negative (= biggest overlap).
// @match        *://*.etstack.io/*
// @run-at       document-idle
// @author       Carter Schuller
// @grant        none
// @updateURL https://raw.githubusercontent.com/CarterJS44/Athena/main/%5BRoutes%5D%20Highlight%20%2B%20Filter%20Runs%20Causing%20Negative%20Slack%20on%20a%20Route-0.5%20(1).user.js
// ==/UserScript==

;(function (root) {           // expose helpers on window.minSlack
  'use strict';

  /* editable settings  */
  const SETTINGS = {
    rowSel : '.ag-center-cols-container [row-index]', // **adjust if grid changes**
    fromSel: '[col-id="fromtime"]',
    toSel  : '[col-id="totime"]',
    hiClass: 'min-slack-row',
    scanDebounce: 150,        // ms
    DEBUG: false             //fuckass debug
  };

  /* helper: debug print  */
  function log(...msg) { SETTINGS.DEBUG && console.log('[minSlack]', ...msg); }

  /*  inject highlight CSS (once)*/
  (()=>{
    const s = document.createElement('style');
    s.textContent = `
      .${SETTINGS.hiClass} .ag-cell,
      .${SETTINGS.hiClass} .ag-cell-value{
        background:#ff3b30!important;color:#fff!important;
      }`;
    document.head.appendChild(s);
  })();

  /* core scan routine */
  function scan() {
    /** remove old highlight (rows are recycled by AG‑Grid) */
    document
      .querySelectorAll('.'+SETTINGS.hiClass)
      .forEach(r => r.classList.remove(SETTINGS.hiClass));

    /** build ordered array of visible rows with parsed times */
    const rows = [...document.querySelectorAll(SETTINGS.rowSel)]
      .map(r => ({
        row : r,
        id  : r.getAttribute('row-id'),
        from: parseTime(r.querySelector(SETTINGS.fromSel)?.textContent),
        to  : parseTime(r.querySelector(SETTINGS.toSel  )?.textContent)
      }))
      .filter(r => Number.isFinite(r.from) && Number.isFinite(r.to))
      .sort((a,b)=>a.from-b.from);

    log('Parsed rows:', rows);

    if (rows.length < 2){
      log('Need ≥2 rows with valid times – found', rows.length);
      return;
    }

    /** find the gap that is *negative* yet numerically closest to zero */
    let best = { gap:-Infinity, idx:-1 };         // “largest” negative
    for (let i=1;i<rows.length;i++){
      const gap = rows[i].from - rows[i-1].to;    // ms (neg ⇒ overlap)
      if (gap < 0 && gap > best.gap) best = {gap, idx:i-1};
    }

    if (best.idx === -1){
      log('No negative slack found – nothing to highlight.');
      return;
    }

    /* highlight pair */
    rows[best.idx].row.classList.add(SETTINGS.hiClass);
    rows[best.idx+1].row.classList.add(SETTINGS.hiClass);

    log(`Highlighted rows ${rows[best.idx].id} → ${rows[best.idx+1].id}. Gap = ${(best.gap/1000).toFixed(1)} s`);
  }

  /* ────────── util: “12:03 PM” → ms since midnight ───────── */
  function parseTime(str=''){
    const [t,ampm] = str.trim().split(/\s+/);   // "12:03", "PM"
    if(!t) return NaN;
    const [hh,mm=0,ss=0] = t.split(':').map(Number);
    let h = hh % 12;
    if(/p/i.test(ampm)) h += 12;
    return ((h*60+mm)*60+ss)*1000;
  }

  /* ────────── debounce helper ───────── */
  const debounce = (fn,ms)=>{
    let timer; return ()=>{ clearTimeout(timer); timer=setTimeout(fn,ms); };
  };

  /* ────────── keep in sync with grid churn ───────── */
  const observer = new MutationObserver(debounce(scan, SETTINGS.scanDebounce));
  observer.observe(document.body,{childList:true,subtree:true});

  window.addEventListener('load', scan);

  /*  expose public helpers for console  */
  root.minSlack = {
    /** run a scan immediately */
    scan,
    /** dump gaps for *visible* rows so you can eyeball overlaps */
    dump(){
      const list = [...document.querySelectorAll(SETTINGS.rowSel)]
        .map(r=>{
          const id=r.getAttribute('row-id'),
                f = parseTime(r.querySelector(SETTINGS.fromSel)?.textContent),
                t = parseTime(r.querySelector(SETTINGS.toSel)?.textContent);
          return {id,from:f,to:t};
        })
        .filter(r=>Number.isFinite(r.from)&&Number.isFinite(r.to))
        .sort((a,b)=>a.from-b.from)
        .map((r,i,arr)=>({
           id:r.id,
           gap:i? r.from-arr[i-1].to : null
        }));
      console.table(list);
      return list;
    },
    SETTINGS,
    get DEBUG(){return SETTINGS.DEBUG;},
    set DEBUG(v){SETTINGS.DEBUG=!!v; console.log('[minSlack] DEBUG =', SETTINGS.DEBUG);}
  };
})(window);
