// ==UserScript==
// @name         [Tool] Shrink Loading Covers to Top Center (Persistent)
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Move and shrink .loadingCover, .athena-loading-cover, and .loadingResultsCover to the top center of the screen, and properly resize loading gears
// @match        *://*.etstack.io/*
// @author       Joey my beloved
// @grant        GM_addStyle
// @updateURL https://raw.githubusercontent.com/CarterJS44/Athena/main/%5BTool%5D%20Shrink%20Loading%20Covers%20to%20Top%20Center%20(Persistent)-1.3.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Apply consistent styles via CSS for all loading covers
    const style = `
    .loadingCover,
    .athena-loading-cover,
    .loadingResultsCover {
        position: fixed !important;
        top: 10px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        width: 120px !important;
        height: 40px !important;
        background-color: rgba(0, 0, 0, 0.5) !important;
        z-index: 9999 !important;
        display: block !important;
        overflow: hidden !important;
        pointer-events: none !important;
        border-radius: 6px !important;
        padding: 5px !important;
        text-align: center !important;
    }

    .loadingCover img,
    .athena-loading-cover img,
    .loadingResultsCover img {
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
        display: block !important;
        margin: 0 auto !important;
    }`;

    // Inject the style
    if (typeof GM_addStyle !== 'undefined') {
        GM_addStyle(style);
    } else {
        const css = document.createElement('style');
        css.type = 'text/css';
        css.appendChild(document.createTextNode(style));
        document.head.appendChild(css);
    }

    // MutationObserver to catch dynamically inserted loading covers
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1 &&
                    (node.classList.contains('athena-loading-cover') ||
                     node.classList.contains('loadingResultsCover') ||
                     node.classList.contains('loadingCover'))) {
                    node.offsetHeight; // force reflow to apply styles
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
