// ==UserScript==
// @name         [Grid] Clear Hot‑Key (Alt + C)
// @namespace    https://tampermonkey.net/
// @version      1.1
// @description  Alt + C → click the visible “Clear” button
// @match        *://*.etstack.io/*
// @run-at       document-idle /* wait until the SPA has mounted */
// @grant        none
// @author       Carter Schuller
// @updateURL   https://raw.githubusercontent.com/CarterJS44/Athena/main/%5BGrid%5D%20Clear%20Hot%E2%80%91Key%20(Alt%20%2B%20C)-1.1.user.js
// ==/UserScript==

(() => {
  'use strict';

  /* CONFIG*/
  function isAltC(ev) {
    /* `code` is layout‑independent (always “KeyC”) and ignores CapsLock/Shift */
    return ev.code === 'KeyC' &&
           ev.altKey &&            //  Alt   is down
           !ev.ctrlKey &&          //  Ctrl  is NOT
           !ev.shiftKey &&         //  Shift is NOT
           !ev.metaKey;            //  Cmd   is NOT
  }

  /*  helper – “real” click */
  const clickOpts = { bubbles: true, cancelable: true, view: window };
  function realClick(el) {
    ['mousedown', 'mouseup', 'click'].forEach(t =>
      el.dispatchEvent(new MouseEvent(t, clickOpts)));
  }

  /* locate a visible Clear button */
  function findClearBtn() {
    /* 1) <button> that owns the × icon (fa‑times) */
    const icon = document.querySelector('button i.fa-times');
    if (icon?.offsetParent) return icon.closest('button');

    /* 2) any button whose label contains “Clear” and is visible */
    return [...document.querySelectorAll('button')].find(b =>
      /clear/i.test(b.textContent) && b.offsetParent !== null);
  }

  /* hot‑key listener  */
  window.addEventListener('keydown', ev => {
    if (!isAltC(ev)) return;

    /* don’t trigger while the user is typing in an input / textarea */
    const el = ev.target;
    if (el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el.isContentEditable) return;

    const btn = findClearBtn();
    if (btn) {
      ev.preventDefault();            // stop the page catching Alt + C first
      ev.stopPropagation();
      realClick(btn);
      console.log('✔  Alt + C → “Clear” clicked');
    } else {
      console.warn('⚠️  No visible “Clear” button found');
    }
  }, true);                           // capture phase → first in the queue

  console.log('[Alt + C “Clear”] userscript loaded');
})();
