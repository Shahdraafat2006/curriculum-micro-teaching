/* Dr Naglaa Platform — front-end logic (no backend yet; data lives in the browser) */
(() => {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Config: edit the content below. Set a url to make a button active.  */
  /* ------------------------------------------------------------------ */
  const CONFIG = {
    // Cosmetic only: a front-end-only check cannot protect content.
    // Turn on once a real backend exists.
    REQUIRE_LOGIN: false,
    // Google sign-in: paste your OAuth Web Client ID here (Google Cloud Console →
    // APIs & Services → Credentials). Leave empty to hide the Google button.
    GOOGLE_CLIENT_ID: '',
  };

  const L_CUR = [
    { id: 'l1', type: 'pdf', title: 'المحاضرة الأولى', desc: 'مقدمة عن موضوع المحاضرة ومحتواها الدراسي.', label: 'ملف PDF', url: '', sample: true },
    { id: 'l2', type: 'ppt', title: 'المحاضرة الثانية', desc: 'العرض التقديمي الخاص بالمحاضرة الثانية.', label: 'ملف PowerPoint', url: '', sample: true },
    { id: 'l3', type: 'video', title: 'شرح المحاضرة', desc: 'فيديو توضيحي للمحتوى الدراسي.', label: 'فيديو', url: '', sample: true },
  ];
  const TYPE_UI = {
    pdf: { cls: 't-pdf', icon: 'file' },
    ppt: { cls: 't-ppt', icon: 'slides' },
    video: { cls: 't-vid', icon: 'play' },
  };

  const A_CUR = [
    { id: 'a1', title: 'التكليف الأول', desc: 'وصف التكليف ومتطلبات التسليم.', status: 'progress', due: '' },
    { id: 'a2', title: 'التكليف الثاني', desc: 'تفاصيل المهمة والملفات المطلوبة.', status: 'open', due: '' },
  ];

  const Q_CUR = [
    { id: 'q1', title: 'اختبار المحاضرة الأولى', desc: 'اختبار قصير لمراجعة محتوى المحاضرة الأولى.', duration: '', url: '' },
  ];

  const STATUS = {
    progress: { text: 'قيد التنفيذ', cls: 'warn' },
    open: { text: 'متاح', cls: 'ok' },
    done: { text: 'تم التسليم', cls: 'ok' },
  };

  const COVERS = [
    'linear-gradient(135deg,#25134d,#6a2fc8)',
    'linear-gradient(135deg,#6a2fc8,#9d71e8)',
    'linear-gradient(135deg,#3a1d75,#9d71e8)',
    'linear-gradient(135deg,#0b0720,#6a2fc8)',
    'linear-gradient(135deg,#6a2fc8,#d1b8ff)',
  ];
  /* ---- Subjects: each one has its own corner (lectures, assignments, quizzes, projects, ratings) ---- */
  const SUBJECTS = {
    curriculum: { name: 'Curriculum and their organization', level: 'المستوى الأول', desc: 'محاضرات وتكليفات واختبارات ومشاريع وتقييمات مادة المستوى الأول.' },
    micro: { name: 'Micro Teaching', level: 'المستوى الثاني', desc: 'محاضرات وتكليفات واختبارات ومشاريع وتقييمات مادة المستوى الثاني.' },
  };
  // Edit each subject's content here (titles, descriptions, links). Add as many items as you want.
  const CONTENT = {
    curriculum: { lectures: L_CUR, assignments: A_CUR, quizzes: Q_CUR },
    micro: {
      lectures: [
        { id: 'm-l1', type: 'pdf', title: 'Micro Teaching: المحاضرة الأولى', desc: 'مقدمة عن مادة Micro Teaching ومحتواها.', label: 'ملف PDF', url: '', sample: true },
        { id: 'm-l2', type: 'video', title: 'شرح المحاضرة الأولى', desc: 'فيديو توضيحي للمحتوى الدراسي.', label: 'فيديو', url: '', sample: true },
      ],
      assignments: [{ id: 'm-a1', title: 'تكليف Micro Teaching الأول', desc: 'تحضير درس مصغّر وتسجيله.', status: 'open', due: '' }],
      quizzes: [{ id: 'm-q1', title: 'اختبار Micro Teaching الأول', desc: 'اختبار قصير لمراجعة المحاضرة الأولى.', duration: '', url: '' }],
    },
  };

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (n) => `<svg class="icon" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const normDigits = (s) => String(s).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  const initial = (s) => [...String(s || '').trim()][0] || 'ط';

  const area = (name) => { try { return window[name]; } catch { return null; } };
  const LS = area('localStorage');
  const SS = area('sessionStorage');

  // Fallback for browsers that block storage (file://, in-app browsers, private mode):
  // keep data in memory and mirror it into window.name, which survives page-to-page navigation in the same tab.
  const MEM_TAG = 'dn:';
  const mem = (() => {
    try { return window.name.startsWith(MEM_TAG) ? JSON.parse(window.name.slice(MEM_TAG.length)) || {} : {}; } catch { return {}; }
  })();
  const memSave = () => { try { window.name = MEM_TAG + JSON.stringify(mem); } catch { /* ignore */ } };
  const storageWorks = (a) => { try { if (!a) return false; a.setItem('dn_t', '1'); const ok = a.getItem('dn_t') === '1'; a.removeItem('dn_t'); return ok; } catch { return false; } };

  const store = {
    get(a, k, d = null) {
      try { const v = a && a.getItem(k); if (v) return JSON.parse(v); } catch { /* fall through to memory */ }
      return k in mem ? mem[k] : d;
    },
    set(a, k, v) {
      try { if (a) { a.setItem(k, JSON.stringify(v)); if (a.getItem(k) !== null) { delete mem[k]; memSave(); return true; } } } catch { /* use memory */ }
      mem[k] = v; memSave();
      return false;
    },
    del(a, k) {
      try { a && a.removeItem(k); } catch { /* ignore */ }
      if (k in mem) { delete mem[k]; memSave(); }
    },
  };

  const getUser = () => store.get(LS, 'dn_user') || store.get(SS, 'dn_user');
  const setUser = (u, remember) => {
    store.del(LS, 'dn_user'); store.del(SS, 'dn_user');
    store.set(remember ? LS : SS, 'dn_user', u);
  };
  const saveUser = (u) => store.set(store.get(LS, 'dn_user') ? LS : SS, 'dn_user', u);
  const clearUser = () => { store.del(LS, 'dn_user'); store.del(SS, 'dn_user'); };
  const subjectId = () => { const s = store.get(LS, 'dn_subject') || store.get(SS, 'dn_subject'); return SUBJECTS[s] ? s : ''; };
  const setSubject = (id) => store.set(LS, 'dn_subject', id);
  const SUB = subjectId();
  const SUBJ = SUBJECTS[SUB];
  const { lectures: LECTURES, assignments: ASSIGNMENTS, quizzes: QUIZZES } = CONTENT[SUB] || CONTENT.curriculum;
  const accounts = () => store.get(LS, 'dn_accounts', {});
  const photos = () => store.get(LS, 'dn_photos', {});
  const photoOf = (code) => photos()[code] || '';
  const safePhoto = (u) => (/^(data:image\/(jpeg|png|webp);base64,|https:\/\/)/.test(u || '') ? u : '');
  function setPhoto(code, src) {
    const all = photos();
    if (src) all[code] = src; else delete all[code];
    store.set(LS, 'dn_photos', all);
    return !src || photos()[code] === src;
  }
  function setAvatar(el, name, photo) {
    if (!el) return;
    const src = safePhoto(photo);
    el.textContent = '';
    el.classList.remove('has-img');
    if (!src) { el.textContent = initial(name); return; }
    const im = new Image();
    im.alt = ''; im.referrerPolicy = 'no-referrer';
    im.onerror = () => { el.classList.remove('has-img'); el.textContent = initial(name); };
    im.src = src;
    el.appendChild(im);
    el.classList.add('has-img');
  }
  function resizePhoto(file) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onerror = rej;
      fr.onload = () => {
        const im = new Image();
        im.onerror = rej;
        im.onload = () => {
          const S = 256, c = document.createElement('canvas');
          c.width = c.height = S;
          const m = Math.min(im.width, im.height);
          c.getContext('2d').drawImage(im, (im.width - m) / 2, (im.height - m) / 2, m, m, 0, 0, S, S);
          res(c.toDataURL('image/jpeg', 0.85));
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  const projects = () => store.get(LS, 'dn_projects:' + SUB, []);
  const ratings = () => store.get(LS, 'dn_ratings:' + SUB, {});
  const me = () => (getUser() || {}).code || 'guest';

  function toast(msg) {
    let t = $('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      t.setAttribute('role', 'status');
      document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove('show'), 2600);
  }
// Student ID: digits only, 4 to 14 digits. Change the numbers here to match your real ID format.
  const validCode = (c) => /^[0-9]{4,14}$/.test(c);
  const CODE_ERR = 'اكتب رقم الطالب (أرقام فقط).';

  function setError(input, msg) {
    const err = $('#' + input.id + '-err');
    if (err) err.textContent = msg || '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  /* ------------------------------------------------------------------ */
  /* Little illustrations (inline SVG, drawn for this site)              */
  /* ------------------------------------------------------------------ */
  const S = '#4b2a8c';
  const spark = (x, y, s = 1, c = '#fff') => `<path transform="translate(${x} ${y}) scale(${s})" d="M0-12C1-4 4-1 12 0 4 1 1 4 0 12-1 4-4 1-12 0-4-1-1-4 0-12z" fill="${c}" stroke="${S}" stroke-width="1.6" stroke-linejoin="round"/>`;
  const heart = (x, y, s = 1, c = '#cdb0f7') => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 8C-14-2-9-14 0-6 9-14 14-2 0 8z" fill="${c}" stroke="${S}" stroke-width="2" stroke-linejoin="round"/>`;
  const ART = {
    cap: `<svg viewBox="0 0 120 90"><path d="M32 46v20c0 9 56 9 56 0V46L60 60z" fill="#8a6bd0" stroke="${S}" stroke-width="3" stroke-linejoin="round"/><path d="M60 10 112 34 60 58 8 34z" fill="#7b58c0" stroke="${S}" stroke-width="3" stroke-linejoin="round"/><path d="M30 33l30-13 30 13" fill="none" stroke="#dcc9fa" stroke-width="3" stroke-linecap="round"/><path d="M104 38v26" stroke="${S}" stroke-width="3" stroke-linecap="round"/><rect x="100" y="62" width="8" height="13" rx="3" fill="#8a6bd0" stroke="${S}" stroke-width="3"/></svg>`,
    bow: `<svg viewBox="0 0 140 112"><path d="M64 64 46 102l16-6 6 12 8-42z" fill="#d9c4f7" stroke="${S}" stroke-width="3" stroke-linejoin="round"/><path d="M76 64l20 36-14-4-6 12-8-42z" fill="#d9c4f7" stroke="${S}" stroke-width="3" stroke-linejoin="round"/><path d="M70 52C42 18 8 26 12 54c4 26 36 12 58-2z" fill="#e4d3fb" stroke="${S}" stroke-width="3" stroke-linejoin="round"/><path d="M70 52C98 18 132 26 128 54c-4 26-36 12-58-2z" fill="#e4d3fb" stroke="${S}" stroke-width="3" stroke-linejoin="round"/><path d="M28 40c10-4 22 0 30 8M112 40c-10-4-22 0-30 8" fill="none" stroke="#b99bea" stroke-width="3" stroke-linecap="round"/><ellipse cx="70" cy="54" rx="12" ry="14" fill="#b99bea" stroke="${S}" stroke-width="3"/></svg>`,
    cat: `<svg viewBox="0 0 220 172"><rect x="14" y="134" width="192" height="30" rx="9" fill="#7b58c0" stroke="${S}" stroke-width="3"/><rect x="26" y="142" width="170" height="13" rx="5" fill="#f1e8ff"/><rect x="26" y="106" width="168" height="28" rx="9" fill="#9d71e8" stroke="${S}" stroke-width="3"/><rect x="38" y="114" width="146" height="12" rx="5" fill="#f7f1ff"/><path d="M168 98c24 2 32-20 18-30" fill="none" stroke="${S}" stroke-width="15" stroke-linecap="round"/><path d="M168 98c24 2 32-20 18-30" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/><ellipse cx="114" cy="92" rx="62" ry="28" fill="#fff" stroke="${S}" stroke-width="3"/><path d="M48 60 46 32l26 15zM100 60l2-28-26 15z" fill="#fff" stroke="${S}" stroke-width="3" stroke-linejoin="round"/><path d="M51 54l-1-14 13 8zM97 54l1-14-13 8z" fill="#ffc2d9"/><circle cx="74" cy="80" r="34" fill="#fff" stroke="${S}" stroke-width="3"/><path d="M70 50v8M76 49v9M82 50v8" stroke="#d8c8ee" stroke-width="3" stroke-linecap="round"/><path d="M58 82q6 6 12 0M80 82q6 6 12 0" fill="none" stroke="${S}" stroke-width="3" stroke-linecap="round"/><path d="M72 90h6l-3 4z" fill="#ff9fc0" stroke="#ff9fc0" stroke-width="1.5" stroke-linejoin="round"/><path d="M75 94q-3 4-7 2M75 94q3 4 7 2" fill="none" stroke="${S}" stroke-width="2" stroke-linecap="round"/><ellipse cx="56" cy="92" rx="6" ry="4" fill="#ffb6cf" opacity=".85"/><ellipse cx="94" cy="92" rx="6" ry="4" fill="#ffb6cf" opacity=".85"/><ellipse cx="56" cy="112" rx="15" ry="9" fill="#fff" stroke="${S}" stroke-width="3"/>${heart(196, 36, 1.2)}${spark(24, 78, 0.8, '#fff')}</svg>`,
    hero: `<svg viewBox="0 0 430 250"><path d="M8 228c100-16 270-16 414 0" fill="none" stroke="#cdb8f2" stroke-width="5" stroke-linecap="round"/><rect x="18" y="198" width="124" height="26" rx="7" fill="#8a6bd0" stroke="${S}" stroke-width="3.5"/><rect x="30" y="204" width="104" height="9" rx="4" fill="#efe6ff"/><rect x="32" y="172" width="104" height="26" rx="7" fill="#f7f1ff" stroke="${S}" stroke-width="3.5"/><path d="M44 185h50" stroke="#cdb8f2" stroke-width="4" stroke-linecap="round"/><path d="M122 48 306 72 290 196 130 176z" fill="#8a6bd0" stroke="${S}" stroke-width="4" stroke-linejoin="round"/><path d="M130 176 290 196l52 18-186 0z" fill="#6e4bb5" stroke="${S}" stroke-width="4" stroke-linejoin="round"/><g transform="translate(212 128) rotate(4)"><path d="M-22-14-24-34l18 9zM22-14l2-20-18 9z" fill="#f1e8ff" stroke="${S}" stroke-width="3" stroke-linejoin="round"/><ellipse rx="26" ry="21" fill="#f1e8ff" stroke="${S}" stroke-width="3"/><circle cx="-9" cy="-2" r="2.6" fill="${S}"/><circle cx="9" cy="-2" r="2.6" fill="${S}"/><path d="M-3 6q3 3 6 0" fill="none" stroke="${S}" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="-16" cy="5" rx="4.5" ry="3" fill="#ffb6cf"/><ellipse cx="16" cy="5" rx="4.5" ry="3" fill="#ffb6cf"/></g><path d="M334 92h62l-10 108h-42z" fill="#f3eaff" stroke="${S}" stroke-width="3.5" stroke-linejoin="round"/><path d="M338 130h54l-4 70h-46z" fill="#e0c9fa"/><rect x="328" y="82" width="74" height="14" rx="7" fill="#f7f1ff" stroke="${S}" stroke-width="3.5"/><path d="M382 82l22-48" stroke="#b99bea" stroke-width="8" stroke-linecap="round"/><g transform="translate(364 156) scale(.55)"><path d="M0 0-30-26c-10 6-8 30 4 30zM0 0 30-26c10 6 8 30-4 30z" fill="#e4d3fb" stroke="${S}" stroke-width="5" stroke-linejoin="round"/><circle r="9" fill="#b99bea" stroke="${S}" stroke-width="5"/></g>${heart(160, 30, 1.6)}${spark(64, 70, 1.5)}${spark(330, 40, 1.2)}${spark(414, 150, 1.1)}${spark(112, 140, .9, '#e4d3fb')}${spark(250, 24, .8, '#e4d3fb')}</svg>`,
    deco: `<svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice">${spark(90, 90, 1.6)}${heart(180, 560, 1.8)}${spark(900, 120, 1.4, '#e4d3fb')}${heart(930, 470, 1.5, '#e4d3fb')}${spark(500, 650, 1.2)}${spark(60, 380, 1)}${heart(820, 640, 1.2)}${spark(700, 40, 1.1, '#e4d3fb')}</svg>`,
  };
  function initArt() {
    document.querySelectorAll('[data-art]').forEach((el) => { if (ART[el.dataset.art]) el.innerHTML = ART[el.dataset.art]; });
  }


  /* ------------------------------------------------------------------ */
  /* Search box (top bar)                                                */
  /* ------------------------------------------------------------------ */
  function initSearch() {
    const box = $('#searchBox');
    if (!box) return;
    const input = $('input', box), out = $('.search-results', box);
    const items = () => [
      ...LECTURES.map((x) => ({ t: x.title, s: 'محاضرة', h: 'lectures.html', i: 'book' })),
      ...ASSIGNMENTS.map((x) => ({ t: x.title, s: 'تكليف', h: 'assignments.html', i: 'check' })),
      ...QUIZZES.map((x) => ({ t: x.title, s: 'اختبار', h: 'quizzes.html', i: 'clipboard' })),
      ...projects().map((x) => ({ t: x.title, s: 'مشروع', h: 'projects.html', i: 'folder' })),
      { t: 'الأعلى تقييمًا', s: 'صفحة', h: 'ratings.html', i: 'star' },
      { t: 'الملف الشخصي', s: 'صفحة', h: 'profile.html', i: 'user' },
    ];
    const draw = () => {
      const q = input.value.trim().toLowerCase();
      if (!q) { out.hidden = true; return; }
      const m = items().filter((x) => x.t.toLowerCase().includes(q) || x.s.includes(q)).slice(0, 6);
      out.innerHTML = m.length
        ? m.map((x) => `<li><a href="${x.h}">${icon(x.i)}<span>${esc(x.t)}</span><small>${x.s}</small></a></li>`).join('')
        : '<li class="none">لا توجد نتائج مطابقة</li>';
      out.hidden = false;
    };
    input.addEventListener('input', draw);
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { out.hidden = true; input.blur(); } });
    document.addEventListener('click', (e) => { if (!box.contains(e.target)) out.hidden = true; });
  }

  /* ------------------------------------------------------------------ */
  /* Project files (kept on this device in IndexedDB)                    */
  /* ------------------------------------------------------------------ */
  const FILE_MAX = 25 * 1024 * 1024;
  const FILE_COUNT = 5;
  const FILE_EXT = ['pdf', 'ppt', 'pptx', 'pps', 'ppsx', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'zip', 'rar', '7z', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'mp3'];
  const VIEWABLE = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'txt', 'mp4', 'mp3'];
  const MIME = { pdf: 'application/pdf', ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', zip: 'application/zip', txt: 'text/plain' };
  const extOf = (n) => (String(n).split('.').pop() || '').toLowerCase();
  const fmtSize = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
  const fileTile = (ext) => (/^pdf$/.test(ext) ? 't-pdf' : /^pp/.test(ext) ? 't-ppt' : /^(doc|docx|txt)$/.test(ext) ? 't-quiz' : /^(xls|xlsx|csv)$/.test(ext) ? 't-vid' : '');
  let idbP = null;
  const idb = () => idbP || (idbP = new Promise((res, rej) => {
    try {
      const r = indexedDB.open('dn_files', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('f');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    } catch (e) { rej(e); }
  }));
  const idbDo = (mode, fn) => idb().then((db) => new Promise((res, rej) => {
    const tx = db.transaction('f', mode); const rq = fn(tx.objectStore('f'));
    tx.oncomplete = () => res(rq && rq.result);
    tx.onerror = tx.onabort = () => rej(tx.error);
  }));
  const fileSave = (k, blob) => idbDo('readwrite', (st) => st.put(blob, k));
  const fileGet = (k) => idbDo('readonly', (st) => st.get(k));
  const fileDel = (k) => idbDo('readwrite', (st) => st.delete(k)).catch(() => {});

  /* ------------------------------------------------------------------ */
  /* Shell: sidebar, theme, user chip, logout                            */
  /* ------------------------------------------------------------------ */
  function paintUser(name, code) {
    const set = (id, v) => { const el = $('#' + id); if (el) el.textContent = v; };
    set('sbName', name || 'طالب');
    set('sbCode', code || 'زائر');
    const ph = code ? photoOf(code) : '';
    setAvatar($('#sbAvatar'), name, ph);
    setAvatar($('#topAvatar'), name, ph);
  }

  function initShell() {
    const sb = $('#sidebar'), ov = $('#overlay'), mb = $('#menuBtn');
    if (sb && mb) {
      const mq = window.matchMedia('(max-width: 900px)');
      const sync = () => { sb.inert = mq.matches && !sb.classList.contains('open'); };
      const setMenu = (open) => {
        sb.classList.toggle('open', open);
        ov.classList.toggle('show', open);
        mb.setAttribute('aria-expanded', String(open));
        sync();
        if (open) $('a', sb)?.focus(); else if (mq.matches) mb.focus();
      };
      mb.addEventListener('click', () => setMenu(!sb.classList.contains('open')));
      ov.addEventListener('click', () => setMenu(false));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sb.classList.contains('open')) setMenu(false); });
      mq.addEventListener('change', () => { setMenu(false); sync(); });
      sync();
    }

    const u = getUser();
    paintUser(u && u.name, u && u.code);
if (SUBJ && sb) $('.brand', sb)?.insertAdjacentHTML('afterend', `<a class="subj-chip" href="subjects.html" title="تغيير المادة"><span><small>${esc(SUBJ.level)}</small><b dir="ltr">${esc(SUBJ.name)}</b></span><em>تغيير</em></a>`);
    if (SUBJ) $('.page-head')?.insertAdjacentHTML('afterbegin', `<a class="subj-tag" href="subjects.html" dir="ltr">${esc(SUBJ.name)}</a>`);
    $('#themeBtn')?.addEventListener('click', () => {
      const root = document.documentElement;
      const dark = root.dataset.theme === 'dark' || (!root.dataset.theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      const next = dark ? 'light' : 'dark';
      root.dataset.theme = next;
      try { LS && LS.setItem('dn_theme', next); } catch { /* ignore */ }
    });

    $('#logoutBtn')?.addEventListener('click', () => { clearUser(); location.href = 'index.html'; });
  }

  /* ------------------------------------------------------------------ */
  /* Login                                                               */
  /* ------------------------------------------------------------------ */
  function parseJwt(t) {
    const b = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(b).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  }

  function initGoogle() {
    const id = CONFIG.GOOGLE_CLIENT_ID;
    const box = $('#gBtn');
    if (!id || !box) return;
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => {
      if (!window.google || !google.accounts) return;
      google.accounts.id.initialize({
        client_id: id,
        callback: (res) => {
          try {
            const p = parseJwt(res.credential);
            const email = String(p.email || '').toLowerCase();
            if (p.aud !== id || !email || p.email_verified === false || p.exp * 1000 < Date.now()) throw new Error('bad token');
            const acc = accounts();
            const name = acc[email] || p.name || email.split('@')[0];
            acc[email] = name; store.set(LS, 'dn_accounts', acc);
            if (!photoOf(email) && safePhoto(p.picture)) setPhoto(email, p.picture);
            setUser({ code: email, name }, $('#remember') ? $('#remember').checked : true);
            location.href = 'subjects.html';
          } catch { toast('تعذّر تسجيل الدخول بحساب Google، حاول مرة أخرى.'); }
        },
      });
      google.accounts.id.renderButton(box, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', locale: 'ar', width: Math.min(box.clientWidth || 360, 400) });
      $('#orLine')?.classList.remove('hidden');
    };
    document.head.appendChild(s);
  }

  function initLogin() {
    const form = $('#loginForm'), code = $('#code');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const c = normDigits(code.value).trim().toLowerCase();
      if (!validCode(c)) { setError(code, CODE_ERR); code.focus(); return; }
      setError(code, '');
      setUser({ code: c, name: accounts()[c] || 'studentf' }, $('#remember').checked);
      location.href = 'subjects.html';
    });
    code.addEventListener('input', () => setError(code, ''));

    initGoogle();

    const dlg = $('#signupDialog'), sForm = $('#signupForm');
    const sName = $('#s-name'), sCode = $('#s-code');
    const modal = typeof dlg.showModal === 'function';
    if (!modal) dlg.classList.add('dlg-fallback');
    const openDlg = () => { if (modal) dlg.showModal(); else dlg.setAttribute('open', ''); };
    const closeDlg = () => { if (modal) dlg.close(); else dlg.removeAttribute('open'); };
    $('#openSignup').addEventListener('click', (e) => { e.preventDefault(); sForm.reset(); setError(sName, ''); setError(sCode, ''); openDlg(); sName.focus(); });
    $('#closeSignup').addEventListener('click', closeDlg);
    sName.addEventListener('input', () => setError(sName, ''));
    sCode.addEventListener('input', () => setError(sCode, ''));
    sForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const n = sName.value.trim(), c = normDigits(sCode.value).trim().toLowerCase();
      let bad = false;
      if (n.length < 2) { setError(sName, 'اكتب اسمك (حرفان على الأقل).'); bad = true; } else setError(sName, '');
      if (!validCode(c)) { setError(sCode, CODE_ERR); bad = true; } else setError(sCode, '');
      if (bad) { (sName.getAttribute('aria-invalid') === 'true' ? sName : sCode).focus(); return; }
      const acc = accounts(); acc[c] = n; store.set(LS, 'dn_accounts', acc);
      setUser({ code: c, name: n }, true);
      location.href = 'subjects.html';
    });
  }

  /* ------------------------------------------------------------------ */
  /* Pages                                                               */
  /* ------------------------------------------------------------------ */
  const emptyState = (ic, title, text, action = '') =>
    `<div class="empty"><div class="ico">${icon(ic)}</div><h3>${esc(title)}</h3><p>${esc(text)}</p>${action}</div>`;

  const ratedCount = () => Object.values(ratings()).reduce((n, o) => n + Object.keys(o).length, 0);
  function renderSubjects() {
    const u = getUser();
    const first = u && u.name ? u.name.split(/\s+/)[0] : '';
    $('#subjHi').textContent = first ? `أهلًا يا ${first}، اختر مادتك` : 'اختر مادتك';
    const grid = $('#subjGrid');
    grid.innerHTML = Object.entries(SUBJECTS).map(([id, s]) =>
      `<button type="button" class="subj-card${id === SUB ? ' current' : ''}" data-subject="${id}"><span class="lvl">${esc(s.level)}</span><b dir="ltr">${esc(s.name)}</b><small>${esc(s.desc)}</small><span class="go">ادخل الركن ${icon('arrow')}</span></button>`).join('');
    grid.addEventListener('click', (e) => {
      const b = e.target.closest('[data-subject]');
      if (b) { setSubject(b.dataset.subject); location.href = 'home.html'; }
    });
    const out = $('#subjOut');
    out.textContent = u ? 'تسجيل الخروج' : 'تسجيل الدخول';
    out.addEventListener('click', () => { if (u) clearUser(); location.href = 'index.html'; });
  }

  function renderHome() {
    const u = getUser();
    const first = u && u.name ? u.name.split(/\s+/)[0] : '';
    $('#heroHi').innerHTML = `${esc(first ? `مرحبًا بعودتك يا ${first}` : 'مرحبًا بك')} <span class="wave" aria-hidden="true">👋</span>`;

    const stats = [
      { n: LECTURES.length, l: 'المحاضرات', i: 'book', c: 't-pdf', h: 'lectures.html' },
      { n: ASSIGNMENTS.length, l: 'التكليفات', i: 'check', c: 't-ppt', h: 'assignments.html' },
      { n: projects().length, l: 'المشاريع', i: 'folder', c: 't-vid', h: 'projects.html' },
      { n: ratedCount(), l: 'التقييمات', i: 'star', c: 't-quiz', h: 'ratings.html' },
    ];
    $('#stats').innerHTML = stats.map((s) =>
      `<a class="card stat" href="${s.h}"><span class="tile ${s.c}">${icon(s.i)}</span><div><div class="num">${s.n}</div><div class="lbl">${s.l}</div></div></a>`).join('');

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.stat .num').forEach((el) => {
        const to = Number(el.textContent);
        if (!to) return;
        el.textContent = '0';
        let t0 = null;
        const step = (t) => { t0 = t0 ?? t; const k = Math.min(1, (t - t0) / 700); el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
        setTimeout(() => { el.textContent = String(to); }, 1100);
      });
    }

    const done = ASSIGNMENTS.filter((a) => a.status === 'done').length;
    const pct = ASSIGNMENTS.length ? Math.round((done / ASSIGNMENTS.length) * 100) : 0;
    const C = 2 * Math.PI * 52;
    $('#ring').innerHTML = `<svg viewBox="0 0 140 140" role="img" aria-label="${pct}% من التكليفات مُسلَّمة"><circle cx="70" cy="70" r="52" fill="none" stroke="var(--line)" stroke-width="15"/><circle class="arc" cx="70" cy="70" r="52" fill="none" stroke="var(--accent)" stroke-width="15" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - pct / 100)).toFixed(1)}" transform="rotate(-90 70 70)"/><text x="70" y="79" text-anchor="middle" class="ring-num">${pct}%</text></svg>`;
    $('#ringMsg').textContent = pct > 0 ? 'كمّل، إنت بتعمل كويس!' : 'ابدأ بأول خطوة، وإنت قدّها!';

    $('#upcoming').innerHTML = ASSIGNMENTS.length
      ? ASSIGNMENTS.map((a) => {
        const s = STATUS[a.status] || STATUS.open;
        return `<li><span class="tile t-ppt">${icon('check')}</span>
          <div class="grow"><b>${esc(a.title)}</b><small>موعد التسليم: ${esc(a.due || 'يُحدَّد لاحقًا')}</small></div>
          <span class="badge ${s.cls}">${s.text}</span></li>`;
      }).join('')
      : '<li><p>لا توجد تكليفات حاليًا.</p></li>';
  }

  function lectureCard(l) {
    const ui = TYPE_UI[l.type] || TYPE_UI.pdf;
    const action = l.url
      ? `<a class="btn sm" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${l.type === 'video' ? 'مشاهدة الفيديو' : 'عرض المحاضرة'}</a>`
      : '<button class="btn sm" type="button" disabled>قريبًا</button>';
    return `<article class="card">
      <div class="item-top"><span class="tile ${ui.cls}">${icon(ui.icon)}</span><div><h3>${esc(l.title)}</h3><p>${esc(l.desc)}</p></div></div>
      <div class="card-foot"><span><span class="badge">${esc(l.label)}</span> ${l.sample ? '<span class="badge warn">مثال تجريبي</span>' : ''}</span>${action}</div>
    </article>`;
  }

  function renderLectures() {
    const view = $('#view');
    const FILTERS = [['all', 'الكل'], ['pdf', 'PDF'], ['ppt', 'PowerPoint'], ['video', 'فيديو']];
    let current = 'all';
    const draw = () => {
      const list = LECTURES.filter((l) => current === 'all' || l.type === current);
      $('#filters').innerHTML = FILTERS.map(([k, t]) =>
        `<button type="button" class="chip" data-f="${k}" aria-pressed="${k === current}">${t}</button>`).join('');
      view.innerHTML = list.length
        ? `<div class="grid cols-2">${list.map(lectureCard).join('')}</div>`
        : emptyState('book', 'لا توجد محاضرات من هذا النوع', 'جرّب نوعًا آخر من القائمة بالأعلى.');
    };
    $('#filters').addEventListener('click', (e) => {
      const b = e.target.closest('[data-f]');
      if (b) { current = b.dataset.f; draw(); $(`[data-f="${current}"]`)?.focus(); }
    });
    draw();
  }

  function renderAssignments() {
    $('#view').innerHTML = ASSIGNMENTS.length
      ? `<div class="grid cols-2">${ASSIGNMENTS.map((a) => {
        const s = STATUS[a.status] || STATUS.open;
        return `<article class="card">
          <div class="item-top"><span class="tile t-ppt">${icon('check')}</span>
            <div><h3>${esc(a.title)}</h3><p>${esc(a.desc)}</p></div></div>
          <p class="due">${icon('calendar')}<span>موعد التسليم: <b>${esc(a.due || 'يُحدَّد لاحقًا')}</b></span></p>
          <div class="card-foot"><span class="badge ${s.cls}">${s.text}</span><button class="btn sm" type="button" disabled>${icon('upload')}رفع الحل · قريبًا</button></div>
        </article>`;
      }).join('')}</div>`
      : emptyState('check', 'لا توجد تكليفات حاليًا', 'ستظهر هنا التكليفات التي تضيفها الدكتورة.');
  }

  function renderQuizzes() {
    $('#view').innerHTML = QUIZZES.length
      ? `<div class="grid cols-2">${QUIZZES.map((q) => `<article class="card">
          <div class="item-top"><span class="tile t-quiz">${icon('clipboard')}</span><div><h3>${esc(q.title)}</h3><p>${esc(q.desc)}</p></div></div>
          <div class="card-foot"><span class="badge info">${icon('clock')}المدة: ${esc(q.duration || 'تُحدَّد لاحقًا')}</span>
          ${q.url ? `<a class="btn sm" href="${esc(q.url)}">ابدأ الاختبار</a>` : '<button class="btn sm" type="button" disabled>ابدأ الاختبار · قريبًا</button>'}</div>
        </article>`).join('')}</div>`
      : emptyState('clipboard', 'لا توجد اختبارات حاليًا', 'ستظهر هنا الاختبارات عند إضافتها.');
  }
  
  projects: renderProjects, quizzes: renderQuizzes, ratings: renderRatings, profile: renderProfile, subjects: renderSubjects,

  /* ----- projects & ratings ----- */
  const avgOf = (id) => {
    const vals = Object.values(ratings()[id] || {});
    return { n: vals.length, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
  };
  const coverOf = (id) => COVERS[[...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % COVERS.length];
  const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString('ar-EG-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' }); } catch { return ''; } };
  const safeUrl = (u) => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch { return ''; } };
  const ratingText = ({ n, avg }) => (n ? `<span class="avg">${avg.toFixed(1)}</span> من 5 · ${n} تقييم` : 'لا توجد تقييمات بعد');

  function stars(id) {
    const mine = (ratings()[id] || {})[me()] || 0;
    let h = '';
    for (let n = 5; n >= 1; n--) {
      h += `<input type="radio" name="rate-${id}" id="r-${id}-${n}" value="${n}" ${mine === n ? 'checked' : ''}><label for="r-${id}-${n}" title="${n} من 5"><span class="sr-only">${n} من 5</span><span aria-hidden="true">★</span></label>`;
    }
    return `<fieldset class="rate"><legend class="sr-only">قيّم هذا المشروع</legend><div class="stars">${h}</div></fieldset>`;
  }

  function projectCard(p) {
    const link = safeUrl(p.link);
    const owner = p.owner === me();
    return `<article class="card project" data-id="${esc(p.id)}">
      <div class="cover" style="--g:${coverOf(p.id)}" aria-hidden="true">${esc(initial(p.title))}</div>
      <div class="body">
        <h3>${esc(p.title)}</h3>${p.desc ? `<p>${esc(p.desc)}</p>` : ''}
        <p class="meta">بواسطة ${esc(p.author || 'طالب')} · ${esc(fmtDate(p.date))}</p>
        ${(p.files || []).length ? `<div class="files">${p.files.map((f) => `<div class="file-row"><span class="tile ${fileTile(f.ext)}">${esc((f.ext || 'file').slice(0, 4).toUpperCase())}</span><div class="grow"><b dir="auto">${esc(f.name)}</b><small>${fmtSize(f.size || 0)}</small></div><button type="button" class="btn sm ghost" data-file="${esc(f.k)}" data-ext="${esc(f.ext)}" data-name="${esc(f.name)}">${VIEWABLE.includes(f.ext) ? 'فتح' : 'تنزيل'}</button></div>`).join('')}</div>` : ''}
        ${link ? `<p class="link-line"><a href="${esc(link)}" target="_blank" rel="noopener noreferrer">فتح رابط المشروع</a></p>` : ''}
        <div class="card-foot">${stars(p.id)}<span class="rating-line" data-avg>${ratingText(avgOf(p.id))}</span></div>
        ${owner ? '<div class="card-foot"><button type="button" class="btn ghost sm" data-del>حذف مشروعي</button></div>' : ''}
      </div>
    </article>`;
  }

  function renderProjects() {
    const view = $('#view'), dlg = $('#projectDialog'), form = $('#projectForm');
    const pTitle = $('#p-title'), pLink = $('#p-link');
    let pending = [];
    const fInput = $('#p-files'), fList = $('#fileList'), drop = $('#dropZone'), fErr = $('#p-files-err');
    const drawPending = () => {
      fList.innerHTML = pending.map((f, i) => `<li><span class="tile ${fileTile(extOf(f.name))}">${esc(extOf(f.name).slice(0, 4).toUpperCase())}</span><span class="grow" dir="auto">${esc(f.name)} <small>${fmtSize(f.size)}</small></span><button type="button" class="icon-btn" data-rm="${i}" aria-label="إزالة الملف">×</button></li>`).join('');
    };
    const addFiles = (files) => {
      const bad = [];
      for (const f of files) {
        if (pending.length >= FILE_COUNT) { bad.push(`الحد الأقصى ${FILE_COUNT} ملفات`); break; }
        if (!FILE_EXT.includes(extOf(f.name))) { bad.push(`${f.name}: نوع الملف غير مدعوم`); continue; }
        if (f.size > FILE_MAX) { bad.push(`${f.name}: أكبر من 25 ميجا`); continue; }
        if (!f.size) { bad.push(`${f.name}: الملف فارغ`); continue; }
        pending.push(f);
      }
      fErr.textContent = bad.join(' · ');
      drawPending();
    };
    fInput.addEventListener('change', () => { addFiles([...fInput.files]); fInput.value = ''; });
    fList.addEventListener('click', (e) => { const b = e.target.closest('[data-rm]'); if (b) { pending.splice(Number(b.dataset.rm), 1); drawPending(); } });
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', (e) => addFiles([...(e.dataTransfer?.files || [])]));
    const open = () => { form.reset(); pending = []; fErr.textContent = ''; drawPending(); setError(pTitle, ''); setError(pLink, ''); dlg.showModal(); pTitle.focus(); };

    const draw = () => {
      const list = projects().slice().reverse();
      view.innerHTML = list.length
        ? `<div class="grid cols-2">${list.map(projectCard).join('')}</div>`
        : emptyState('folder', 'لا توجد مشاريع منشورة حتى الآن', 'كن أول من يشارك مشروعه مع زملائه.', `<button class="btn" type="button" data-add>${icon('plus')}إضافة مشروع</button>`);
    };

    $('#addProject').addEventListener('click', open);
    $('#closeProject').addEventListener('click', () => dlg.close());
    view.addEventListener('click', async (e) => {
      if (e.target.closest('[data-add]')) return open();
      const fb = e.target.closest('[data-file]');
      if (fb) {
        let blob = null;
        try { blob = await fileGet(fb.dataset.file); } catch { /* ignore */ }
        if (!blob) { toast('الملف غير موجود على هذا الجهاز.'); return; }
        const url = URL.createObjectURL(blob);
        if (VIEWABLE.includes(fb.dataset.ext)) window.open(url, '_blank', 'noopener');
        else { const a = document.createElement('a'); a.href = url; a.download = fb.dataset.name; document.body.appendChild(a); a.click(); a.remove(); }
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        return;
      }
      const del = e.target.closest('[data-del]');
      if (del) {
        if (!del.dataset.armed) {
          del.dataset.armed = '1';
          del.textContent = 'اضغط مرة أخرى للتأكيد';
          clearTimeout(del._t);
          del._t = setTimeout(() => { delete del.dataset.armed; del.textContent = 'حذف مشروعي'; }, 3500);
          return;
        }
        const id = del.closest('[data-id]').dataset.id;
        (projects().find((p) => p.id === id)?.files || []).forEach((f) => fileDel(f.k));
        store.set(LS, 'dn_projects', projects().filter((p) => p.id !== id));
        const r = ratings(); delete r[id]; store.set(LS, 'dn_ratings', r);
        draw(); toast('تم حذف المشروع');
      }
    });
    view.addEventListener('change', (e) => {
      if (!e.target.matches('.stars input')) return;
      const card = e.target.closest('[data-id]'), id = card.dataset.id;
      const r = ratings(); (r[id] = r[id] || {})[me()] = Number(e.target.value);
      store.set(LS, 'dn_ratings', r);
      $('[data-avg]', card).innerHTML = ratingText(avgOf(id));
      toast('تم حفظ تقييمك');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = pTitle.value.trim(), desc = $('#p-desc').value.trim(), link = pLink.value.trim();
      let bad = false;
      if (title.length < 3) { setError(pTitle, 'اكتب عنوان المشروع (3 أحرف على الأقل).'); bad = true; } else setError(pTitle, '');
      if (link && !safeUrl(link)) { setError(pLink, 'اكتب رابطًا صحيحًا يبدأ بـ https://'); bad = true; } else setError(pLink, '');
      if (bad) { (pTitle.getAttribute('aria-invalid') === 'true' ? pTitle : pLink).focus(); return; }
      const u = getUser() || {};
      const id = Date.now().toString(36);
      const saved = [];
      const submit = $('button[type="submit"]', form);
      submit.disabled = true;
      try {
        for (let i = 0; i < pending.length; i++) {
          const f = pending[i], ext = extOf(f.name), k = `${id}-${i}`;
          await fileSave(k, new Blob([f], { type: f.type || MIME[ext] || 'application/octet-stream' }));
          saved.push({ k, name: f.name, size: f.size, ext });
        }
      } catch {
        saved.forEach((f) => fileDel(f.k));
        submit.disabled = false;
        fErr.textContent = 'تعذّر حفظ الملفات على هذا الجهاز (المساحة ممتلئة أو التخزين غير متاح).';
        return;
      }
      const list = projects();
      list.push({ id, title, desc, link: link ? safeUrl(link) : '', files: saved, owner: me(), author: u.name || 'طالب', date: new Date().toISOString() });
      store.set(LS, 'dn_projects', list);
      submit.disabled = false;
      dlg.close(); draw(); toast('تم نشر مشروعك');
    });
    draw();
  }

  function renderRatings() {
    const rated = projects().map((p) => ({ p, ...avgOf(p.id) })).filter((x) => x.n > 0)
      .sort((a, b) => b.avg - a.avg || b.n - a.n);
    $('#view').innerHTML = rated.length
      ? `<ol class="rank-list">${rated.map((x, i) => `<li class="card rank-item">
          <div class="rank-no" aria-label="المركز ${i + 1}">${i + 1}</div>
          <div class="rank-body"><h3>${esc(x.p.title)}</h3><p class="meta">بواسطة ${esc(x.p.author || 'طالب')}</p>
            <div class="bar" aria-hidden="true"><i style="width:${Math.round((x.avg / 5) * 100)}%"></i></div></div>
          <div class="rank-score">${x.avg.toFixed(1)} ★<small>${x.n} تقييم</small></div></li>`).join('')}</ol>`
      : emptyState('star', 'لوحة التقييمات في انتظار المشاركات', 'ستظهر هنا أفضل المشاريع بعد تقييمها.', '<a class="btn" href="projects.html">استعرض المشاريع</a>');
  }

  function renderProfile() {
    const u = getUser();
    if (!u) {
      $('#view').innerHTML = emptyState('user', 'لم تسجّل الدخول بعد', 'سجّل الدخول لعرض بيانات حسابك وتعديلها.', '<a class="btn" href="index.html">تسجيل الدخول</a>');
      return;
    }
    const name = u.name || '';
    const mineProjects = projects().filter((p) => p.owner === u.code).length;
    const mineRatings = Object.values(ratings()).filter((o) => o[u.code]).length;
    $('#view').innerHTML = `<div class="profile-wrap"><section class="card profile-card">
      <div class="profile-banner" aria-hidden="true"></div>
      <div class="profile-body">
        <div class="avatar-edit">
          <div class="avatar xl" id="pAvatar" aria-hidden="true"></div>
          <button class="cam" type="button" id="photoBtn" aria-label="تغيير الصورة الشخصية">${icon('camera')}</button>
          <input type="file" id="photoInput" accept="image/png,image/jpeg,image/webp" hidden>
        </div>
        <h2 id="pName">${esc(name || 'اسم الطالب')}</h2>
        <p class="role">طالب في المنصة التعليمية ✨</p>
        <button class="link-btn" type="button" id="photoDel" hidden>إزالة الصورة</button>
        <div class="mini-stats">
          <div class="wide"><b class="sm" dir="ltr">${esc(u.code)}</b><span>البريد الإلكتروني</span></div>
          <div><b>${mineProjects}</b><span>مشاريعي</span></div>
          <div><b>${mineRatings}</b><span>تقييماتي</span></div>
        </div>
        <form id="profileForm" novalidate>
          <div class="field"><label for="n">الاسم</label>
            <input id="n" name="n" value="${esc(name)}" autocomplete="name" aria-describedby="n-err" maxlength="60">
            <div class="error" id="n-err" aria-live="polite"></div></div>
          <button class="btn" type="submit">حفظ التعديلات</button>
        </form>
      </div></section></div>`;
    const input = $('#n'), pAv = $('#pAvatar'), del = $('#photoDel');
    const draw = () => { const ph = photoOf(u.code); setAvatar(pAv, input.value.trim() || name, ph); del.hidden = !ph; };
    draw();
    $('#photoBtn').addEventListener('click', () => $('#photoInput').click());
    $('#photoInput').addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!f) return;
      if (!/^image\/(png|jpeg|webp)$/.test(f.type)) { toast('اختر صورة بصيغة JPG أو PNG.'); return; }
      try {
        const data = await resizePhoto(f);
        if (!setPhoto(u.code, data)) { toast('تعذّر حفظ الصورة، جرّب صورة أصغر.'); return; }
        draw(); paintUser(u.name, u.code); toast('اتحدّثت صورتك 💜');
      } catch { toast('تعذّر قراءة الصورة، جرّب صورة تانية.'); }
    });
    del.addEventListener('click', () => { setPhoto(u.code, ''); draw(); paintUser(u.name, u.code); toast('تمت إزالة الصورة'); });
    $('#profileForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = input.value.trim();
      if (v.length < 2) { setError(input, 'اكتب اسمك (حرفان على الأقل).'); input.focus(); return; }
      setError(input, '');
      u.name = v;
      saveUser({ ...u, name: v });
      const acc = accounts(); acc[u.code] = v; store.set(LS, 'dn_accounts', acc);
      $('#pName').textContent = v;
      draw(); paintUser(v, u.code);
      toast('تم حفظ بياناتك');
    });
  }

  /* ------------------------------------------------------------------ */
  const PAGES = {
    login: initLogin, home: renderHome, lectures: renderLectures, assignments: renderAssignments,
    projects: renderProjects, quizzes: renderQuizzes, ratings: renderRatings, profile: renderProfile,
  };

  document.addEventListener('DOMContentLoaded', () => {
    const page = ($('[data-page]') || {}).dataset?.page;
    if (CONFIG.REQUIRE_LOGIN && page !== 'login' && !getUser()) { location.replace('index.html'); return; }
    initArt();
    if (page !== 'login' && !storageWorks(LS)) toast('المتصفح بيمنع حفظ البيانات. افتح الموقع من رابط عادي (مش من واتساب أو ملف) عشان بياناتك تتحفظ.');
    if (page !== 'login') { initShell(); initSearch(); }
    PAGES[page]?.();
  });
})();