// ==UserScript==
// @name         [Student] Multi-Field Toggle Menu (Persistent)
// @namespace    http://tampermonkey.net/
// @version      2.6.0
// @description  One drop-down to toggle System Fields + User-Defined Fields
// @match        *://*.etstack.io/*
// @author       Carter Schuller
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  /*const */
  const MENU_STORAGE = 'etstack_fieldToggles';
  const UDF_STORAGE  = 'etstack_udfVisible';
  const STORAGE_KEY  = 'etstack_fieldToggles';

  /* field list*/
  const fields = [
    { label: "First Name",            selector: "input[name='student_firstName']" },
    { label: "Last Name",             selector: "input[name='student_lastName']" },
    { label: "Middle Name",           selector: "input[name='student_middleName']" },
    { label: "Nickame",               selector: "input[name='student_nickName']" },
    { label: "Suffix",                selector: "input[name='student_suffix']" },
    { label: "City",                  selector: "input[name='student_sisCity'], input[name='student_city']" },
    { label: "State",                 selector: "input[name='student_sisState'], input[name='student_state']" },
    { label: "Country",               selector: "input[name='student_sisCountry'], input[name='student_country']" },
    { label: "Zip Code",              selector: "input[name='student_sisZipCode'], input[name='student_zipCode']" },
    { label: "Government ID",         selector: "input[name='student_governmentId']" },
    { label: "Date of Birth",         selector: "input[name='startAt']" },
    { label: "Enrollment Date",       selector: "date-picker[name='enrollDate'] input[name='startAt']" },
    { label: "Withdraw Date",         selector: "date-picker[name='withdrawDate'] input[name='startAt']" },
    { label: "Email",                 selector: "input[name='student_email']" },
    { label: "Phone",                 selector: "input[name='student_phone']" },
    { label: "Enrollment Status",     selector: "input[name='student_enrollmentStatus']" },
    { label: "Grade",                 selector: "input[name='student_grade']" },
    { label: "School Name",           selector: "input[name='student_schoolName']" },
    { label: "Ethnicity",             selector: "input[name='student_ethnicity']" },
    { label: "Parent/Guardian Name",  selector: "input[name='student_parentName']" },
    { label: "Gender",                selector: "input[name='student_gender']" },
    { label: "Notes",                 selector: "textarea[name='student_studentNotes']" },
    { label: "Home Stop",             selector: "input#homeStop" },
    { label: "No-Rider",              selector: "input#schoolBusRideAllowed" },
    { label: "Exclusive Stop",        selector: "input#exclusiveStop" },
    { label: "Computed Eligibility",  selector: "input[name='student_eligibility']" },
    { label: "Last Modified",         selector: "input[name='student_timeChanged']" },
    { label: "Last Modified By",      selector: "input[name='student_userChanged']" },
    { label: "Created",               selector: "input[name='student_timeCreated']" },
    { label: "Created By",            selector: "input[name='student_userCreated']" },
    { label: "Address",               selector: "input[name='studentSISAddress']" },
    { label: "District ID",           selector: "input[name='student_districtId']" },
    { label: "Edulog ID",             selector: "input[name='student_id']" },
    { label: "Address Entry",         selector: "input-location-picker[name='student_location'] input[name='addressInput']" },
    { label: "School - Grade - Program", selector: "input[name='student_school']" }
  ];

  /* ───────── storage helpers ───────── */
  const loadMenuState = () => JSON.parse(localStorage.getItem(MENU_STORAGE) || '{}');
  const saveMenuState = s  => localStorage.setItem(MENU_STORAGE, JSON.stringify(s));
  const loadUdfState  = () => JSON.parse(localStorage.getItem(UDF_STORAGE)  || 'true');
  const saveUdfState  = v  => localStorage.setItem(UDF_STORAGE,  JSON.stringify(v));

  /* ───────── DOM helpers (unchanged) ───────── */
  function getVisibleFieldContainers() {
    return fields.map(({ label, selector }) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const container = el.closest('.col-4') || el.closest('div[class*="col-"]');
      return container ? { label, container } : null;
    }).filter(Boolean);
  }

  function applyVisibility(state) {
    getVisibleFieldContainers().forEach(({ label, container }) => {
      const show = state[label] !== false;
      container.style.display = show ? '' : 'none';

      /* grid re-flow */
      const row = container.closest('.row');
      if (row) {
        const visible = [...row.children].filter(c => getComputedStyle(c).display !== 'none');
        const cols = visible.length;
        if (cols) {
          visible.forEach(col => {
            col.className = col.className.replace(/\bcol-\d+\b/g, '');
            col.classList.add(`col-${Math.floor(12 / cols)}`);
          });
        }
      }

      /* special labels for Enrollment / Withdraw */
      if (label === 'Enrollment Date' || label === 'Withdraw Date') {
        const lbl = [...document.querySelectorAll('label.control-label.pt-1')]
          .find(l => l.textContent.trim() === `${label}:`);
        if (lbl) lbl.style.display = show ? '' : 'none';
      }
    });

    fixSisAddress();
  }

  function fixSisAddress() {
    const addrInput = document.querySelector('#studentSISAddress');
    if (!addrInput) return;
    const col = addrInput.closest('div[class*="col-"]');
    if (col && !col.classList.contains('col-12')) {
      col.className = col.className.replace(/\bcol-\d+\b/g, '').trim();
      col.classList.add('col-12');
    }
  }

  /* ───────── helpers for pretty-checkbox row ───────── */
  function buildRow(label, checked, onToggle) {
    const row = document.createElement('div');
    row.className = 'col-10';

    const pretty = row.appendChild(document.createElement('div'));
    pretty.className = 'pretty p-default p-curve p-thick';

    const cb = pretty.appendChild(document.createElement('input'));
    cb.type = 'checkbox';
    cb.checked = checked;

    const state = pretty.appendChild(document.createElement('div'));
    state.className = 'state p-warning';

    const lbl = state.appendChild(document.createElement('label'));
    const span = lbl.appendChild(document.createElement('span'));
    span.className = 'fw-semibold fieldLabel';
    span.textContent = label.toUpperCase();

    cb.addEventListener('change', () => onToggle(cb.checked));
    return row;
  }

  /* ───────── UDF show/hide helper ───────── */
  function setUdfVisibility(show) {
    const hdr  = document.querySelector('.udfsHeader');
    const grid = document.querySelector('.udfsContainer');
    if (hdr)  hdr.style.display  = show ? '' : 'none';
    if (grid) grid.style.display = show ? '' : 'none';
    saveUdfState(show);
  }

  /* ───────── drop-down creation ───────── */
  function createToggleMenu(btn) {
    document.getElementById('fieldToggleMenu')?.remove();

    const menu = Object.assign(document.createElement('div'), { id:'fieldToggleMenu' });
    Object.assign(menu.style,{
      position:'absolute',background:'#fff',border:'1px solid #ccc',padding:'10px',
      borderRadius:'6px',zIndex:9999,minWidth:'220px',maxHeight:'400px',
      overflowY:'auto',boxShadow:'0 2px 10px rgba(0,0,0,.2)'
    });
    const r = btn.getBoundingClientRect();
    menu.style.top  = `${r.bottom + scrollY + 5}px`;
    menu.style.left = `${r.left   + scrollX}px`;

    const vis = loadMenuState();
    const items = getVisibleFieldContainers();

    if (!items.length) {
      menu.appendChild(Object.assign(document.createElement('div'),{
        textContent:'Select a Student First', style:'color:#666;padding:4px'
      }));
    } else {
      /* system-field rows */
      items.forEach(({ label, container }) =>
        menu.appendChild(
          buildRow(label, vis[label] ?? container.style.display !== 'none',
            checked => {
              container.style.display = checked ? '' : 'none';
              const st = loadMenuState(); st[label]=checked; saveMenuState(st);
              applyVisibility(st);
            })
        )
      );
      /* separator */
      menu.appendChild(Object.assign(document.createElement('hr'),{
        style:'margin:8px 0'
      }));
    }

    /* UDF row */
    menu.appendChild(
      buildRow('User-Defined Fields', loadUdfState(),
        checked => setUdfVisibility(checked))
    );

    document.body.appendChild(menu);

    const off = e=>{
      if(!menu.contains(e.target)&&e.target!==btn){
        menu.remove();document.removeEventListener('click',off);
      }
    };
    setTimeout(()=>document.addEventListener('click',off),0);
  }

  /* ───────── launcher button (System Fields) ───────── */
  function insertToggleButton() {
    const udfBtnRef = document.querySelector('button.btnUdfsManager');
    if (!udfBtnRef) return;
    if (document.getElementById('toggleFieldsMenuBtn')) return;

    const sysBtn = udfBtnRef.cloneNode(true);
    sysBtn.id = 'toggleFieldsMenuBtn';
    sysBtn.innerHTML = '<i class="fa-solid fa-eye"></i> System Fields';
    sysBtn.addEventListener('click', e=>{
      e.stopPropagation();
      const open = document.getElementById('fieldToggleMenu');
      open ? open.remove() : createToggleMenu(sysBtn);
    });
    udfBtnRef.before(sysBtn);
  }

  /* ───────── observers & boot ───────── */
  function boot() {
    let tries=0;
    const poll = setInterval(()=>{
      insertToggleButton();
      applyVisibility(loadMenuState());
      setUdfVisibility(loadUdfState());
      if(++tries>10) clearInterval(poll);
    },1000);
    new MutationObserver(()=>{
      insertToggleButton();
      applyVisibility(loadMenuState());
      setUdfVisibility(loadUdfState());
    }).observe(document.body,{childList:true,subtree:true});
  }

  boot();
})();
