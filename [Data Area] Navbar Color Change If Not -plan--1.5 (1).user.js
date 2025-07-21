// ==UserScript==
// @name         [Data Area] Navbar Color Change If Not "plan"
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Recolor navbars unless menu strong text === "plan", with tight observer
// @match        *://*.etstack.io/*
// @author       Carter Schuller
// @grant        none
// ==/UserScript==

//this script does not auto update as i dont see any reason for it too, if you wish it too auto update/changes need to be made slack carter 
(() => {
  'use strict';

  const TARGET_COLOR   = '#a7e0ed';
  const DEFAULT_COLOR  = '';
  const THROTTLE_MS    = 500;

  //util, just updates and shi pretty self explanatory
  function updateNavbars(color) {
    document.querySelectorAll('nav.navbar')
            .forEach(nb => nb.style.backgroundColor = color);
  }

  function checkAndUpdateNavbar() {
    const strong = document.querySelector('data-area-menu-item strong');
    if (!strong) return;                                  // nothing to do yet
    const txt = strong.textContent.trim().toLowerCase();
    updateNavbars(txt !== 'plan' ? TARGET_COLOR : DEFAULT_COLOR);
  }

  // Debounce utility
  function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /smart observer */
  let menuObserver = null, throttleTimer = null;

  function attachObserver() {
    if (menuObserver) { menuObserver.disconnect(); menuObserver = null; }

    const menuItem = document.querySelector('data-area-menu-item');
    if (menuItem) {
      const debouncedCheck = debounce(checkAndUpdateNavbar, 1000); // Only run at most every 1000ms
      menuObserver = new MutationObserver(mutations => {
        for (const m of mutations) {
          if (
            Array.from(m.addedNodes).some(n => n.nodeType === 1 && n.matches && n.matches('strong')) ||
            Array.from(m.removedNodes).some(n => n.nodeType === 1 && n.matches && n.matches('strong'))
          ) {
            debouncedCheck();
            break;
          }
        }
      });
      menuObserver.observe(menuItem, { childList: true, subtree: true });
      checkAndUpdateNavbar();
    } else {
      if (!throttleTimer) {
        throttleTimer = setInterval(() => {
          checkAndUpdateNavbar();
          if (document.querySelector('data-area-menu-item')) {
            clearInterval(throttleTimer);
            throttleTimer = null;
            attachObserver();
          }
        }, THROTTLE_MS);
      }
    }
  }

  /* SPA hooks */
  function wrapHistory(fn) {
    return function () {
      const res = fn.apply(this, arguments);
      setTimeout(attachObserver, 50);    // after navigation completes
      return res;
    };
  }
  history.pushState    = wrapHistory(history.pushState);
  history.replaceState = wrapHistory(history.replaceState);
  window.addEventListener('popstate', () => setTimeout(attachObserver, 50));

  /* init*/
  window.addEventListener('load', attachObserver);
})();
