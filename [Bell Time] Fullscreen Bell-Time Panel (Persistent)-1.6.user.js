// ==UserScript==
// @name         [Bell Time] Fullscreen Bell-Time Panel (Persistent)
// @namespace    https://etstack.io/
// @version      1.6
// @description  Keep Bell-Time widget fullscreen on etstack.io – even if the panel has no header.
// @match        *://*.etstack.io/*
// @author       Carter Schuller
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  /* CONFIG */
  const DEBUG   = false;                     // flip to false for silent mode
  const BAD_TAG = '(no header)';            // marker shown in console

  const WIDGET_SELECTOR = '.widget.widget-body.widget-border';

  /* helper: gated console output */
  const log = (...a) => DEBUG && console.log('[BT]', ...a);
  const warn = (...a) => DEBUG && console.warn('[BT]', ...a);

  /* helper: mark once */
  const markBad = (w, why) => {
    if (w.dataset.badMarked) return;
    w.dataset.badMarked = '1';
    warn('⚠️  skipped widget →', why, w);
  };

  /* full-screening logic  */
  function fullscreenWidget(widget){
    /* already done? */
    if (!widget || widget.dataset.fullscreenApplied) return;

    /* ── IDENTIFY A VALID WIDGET ─────────────────────────────
       Accept either…
         1. a normal header, OR
         2. a Bell-Time AG-Grid (identified by the special columns)
    */
    const hasHeader = widget.querySelector('.widget-header,.widgetHeader,.header');
    const looksBell = widget.querySelector(
      '[col-id="fromtime"],[col-id="totime"],[col-id="window"]'
    );

    if (!hasHeader && !looksBell){
      markBad(widget, BAD_TAG);
      return;
    }

    log('fullscreen:', hasHeader?.textContent.trim() || '[Bell-Time]', widget);

    /* style */
    Object.assign(widget.style, {
      position : 'fixed',
      inset    : 0,
      width    : '100vw',
      height   : '100vh',
      zIndex   : 9999,
      margin   : 0,
      padding  : 0,
      background : '#fff'
    });

    /* stretch inner containers */
    ['.moduleContainer','.panelSet'].forEach(sel=>{
      const el = widget.querySelector(sel);
      if (el) Object.assign(el.style, {width:'100%',height:'100%'});
    });

    widget.dataset.fullscreenApplied = 'true';
  }

  /* observers  */
  const observer = new MutationObserver(() => {
    document.querySelectorAll(WIDGET_SELECTOR)
            .forEach(w => w.offsetParent && fullscreenWidget(w));
  });

  observer.observe(document.body,{
    childList:true, subtree:true,
    attributes:true, attributeFilter:['style','class']
  });

  /* initial & periodic */
  const scan = () =>
    document.querySelectorAll(WIDGET_SELECTOR).forEach(fullscreenWidget);

  scan();
  setInterval(scan, 1000);

  log('Bell-Time fullscreen script ready. DEBUG =', DEBUG);
})();
