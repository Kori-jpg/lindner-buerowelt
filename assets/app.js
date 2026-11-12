/* LindnerNet – Intranet der Lindner Bürowelt am Main KG (Modellunternehmen für den Unterricht).
   Keine Konten, kein Tracking: Lernstand bleibt im Browser. Inhalte werden erst mit dem Klassencode entschlüsselt. */
(function () {
  'use strict';

  var BUNDLES = ['lf7', 'lf8'];
  var app = document.getElementById('app');
  var side = document.getElementById('side');
  var topbar = document.getElementById('topbar');
  var tabs = document.getElementById('tabs');
  var foot = document.getElementById('foot');
  var bundle = null, SH = null;

  /* ---------- Hilfen ---------- */
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* privat/gesperrt */ } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* egal */ } }
  };

  function h(tag, attrs) {
    var el = document.createElement(tag), i, k;
    if (attrs) for (k in attrs) {
      if (attrs[k] == null || attrs[k] === false) continue;
      if (k === 'class') el.className = attrs[k];
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), attrs[k]);
      else if (k === 'html') el.appendChild(rich(attrs[k]));
      else el.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    }
    for (i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  /* **fett** sicher in Knoten umwandeln (kein innerHTML) */
  function rich(text) {
    var f = document.createDocumentFragment();
    String(text).split(/(\*\*[^*]+\*\*)/g).forEach(function (part) {
      if (/^\*\*[^*]+\*\*$/.test(part)) f.appendChild(h('strong', null, part.slice(2, -2)));
      else if (part) f.appendChild(document.createTextNode(part));
    });
    return f;
  }
  function paras(body) {
    return (Array.isArray(body) ? body : [body]).map(function (p) {
      if (Array.isArray(p)) return h('ul', { class: 'clean' }, p.map(function (li) { return h('li', { html: li }); }));
      return h('p', { html: p });
    });
  }
  function initials(name) { return name.split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function ul(items) { return h('ul', { class: 'clean' }, items.map(function (x) { return h('li', null, x); })); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i'); }

  /* ---------- Icons (eigene Strichzeichnungen, als SVG-Knoten) ---------- */
  var ICONS = {
    home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    news: 'M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5M8 16h3',
    briefcase: 'M3 8h18v12H3zM9 8V5h6v3M3 13h18',
    book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM19 19v2H6',
    users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.2a6.5 6.5 0 0 1 3.5 5.8',
    cap: 'M2 9l10-5 10 5-10 5zM6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v6',
    mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
    calendar: 'M4 5h16v16H4zM4 10h16M8 3v4M16 3v4',
    building: 'M5 21V4h10v17M15 9h4v12M3 21h18M8 8h1M11 8h1M8 12h1M11 12h1M8 16h1M11 16h1',
    search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
    phone: 'M5 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 12l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 5a2 2 0 0 1 2-2z',
    userplus: 'M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20a7 7 0 0 1 14 0M19 7v6M16 10h6',
    idcard: 'M3 5h18v14H3zM8 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5.5 16a3 3 0 0 1 5 0M14 10h4M14 14h4',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
    euro: 'M17 6.5a6.5 6.5 0 1 0 0 11M4 10.5h9M4 13.5h9',
    file: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6',
    scale: 'M12 4v16M7 20h10M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z',
    trending: 'M3 17l6-6 4 4 8-8M15 7h6v6',
    box: 'M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8',
    chat: 'M4 5h16v11H9l-5 4zM8 9h8M8 12h5',
    alert: 'M12 3l10 18H2zM12 10v5M12 18v.01',
    compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z',
    star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
    chart: 'M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6',
    lock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3',
    logout: 'M10 4H5v16h5M14 8l4 4-4 4M9 12h9',
    shield: 'M12 3l8 3v6c0 4.5-3.2 8-8 9-4.800-1-8-4.500-8-9V6z',
    check: 'M5 12.5l4.500 4.500L19 7.500',
    chevron: 'M9 6l6 6-6 6',
    cards: 'M4 7h12v13H4zM8 4h12v13'
  };
  ICONS.handshake = ICONS.briefcase;
  function icon(name, cls) {
    var NS = 'http://www.w3.org/2000/svg', s = document.createElementNS(NS, 'svg'), p = document.createElementNS(NS, 'path');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ic' + (cls ? ' ' + cls : '')); s.setAttribute('aria-hidden', 'true');
    p.setAttribute('d', ICONS[name] || ICONS.file); s.appendChild(p); return s;
  }

  /* ---------- Entschlüsselung ---------- */
  function b64(s) { var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
  function normCode(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function decrypt(enc, code) {
    var te = new TextEncoder();
    return crypto.subtle.importKey('raw', te.encode(normCode(code)), 'PBKDF2', false, ['deriveKey']).then(function (base) {
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(enc.salt), iterations: enc.iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    }).then(function (key) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(enc.iv) }, key, b64(enc.ct));
    }).then(function (buf) { return JSON.parse(new TextDecoder().decode(buf)); });
  }
  function unlock(code) {
    var i = 0;
    function next() {
      if (i >= BUNDLES.length) return Promise.resolve(null);
      var id = BUNDLES[i++];
      return fetch('content/' + id + '.enc.json', { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error('fetch'); return r.json(); })
        .then(function (enc) { return decrypt(enc, code); })
        .then(function (data) { return data; }, function () { return next(); });
    }
    return next();
  }
  function setBundle(data) { bundle = data; SH = data ? data.shared : null; }

  /* ---------- Lernstand (nur lokal) ---------- */
  function pkey() { return 'lb_p_' + bundle.id; }
  function prog() { return LS.get(pkey(), { done: {}, notes: {} }); }
  function setDone(modId, idx, pts, max) { var p = prog(); var k = modId + ':' + idx; var old = p.done[k]; if (!old || pts >= old.pts) p.done[k] = { pts: pts, max: max }; LS.set(pkey(), p); }
  function isDone(modId, idx) { return !!prog().done[modId + ':' + idx]; }
  function modProgress(m) { var p = prog(), n = 0; m.steps.forEach(function (s, i) { if (p.done[m.id + ':' + i]) n++; }); return n / m.steps.length; }
  function totalPoints() { var p = prog(), t = 0, k; for (k in p.done) t += p.done[k].pts || 0; return t; }
  function locked(m) { return m.ab && Date.now() < Date.parse(m.ab); }
  function mod(id) { return bundle.modules.filter(function (x) { return x.id === id; })[0]; }
  function openTasks() { return bundle.modules.filter(function (m) { return !locked(m) && modProgress(m) < 1; }); }
  function seenNews() { return LS.get('ln_news_' + bundle.id, {}); }
  function markNews(id) { var s = seenNews(); if (!s[id]) { s[id] = 1; LS.set('ln_news_' + bundle.id, s); } }

  /* ---------- Datum ---------- */
  var WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  function dparts(iso) { var d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso); return d; }
  function fmtDate(iso) { return dparts(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  function fmtShort(iso) { var d = dparts(iso); return WT[d.getDay()] + ' ' + ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.'; }
  function todayIso() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function termine() { return SH.termine.concat(bundle.termine || []).sort(function (a, b) { return (a.d + a.z).localeCompare(b.d + b.z); }); }

  /* ---------- Personen ---------- */
  function person(nr) { return SH.personen.filter(function (p) { return p.nr === nr; })[0]; }
  function pname(p) { return p.vor + ' ' + p.nach; }
  function abt(id) { return SH.abteilungen.filter(function (a) { return a.id === id; })[0]; }
  var STATUS = { da: 'im Haus', mobil: 'mobiles Arbeiten', aussen: 'Außentermin', weg: 'abwesend' };
  function avatar(p, cls) { return h('span', { class: 'av a-' + p.abt + (cls ? ' ' + cls : ''), 'aria-hidden': 'true' }, p.vor[0] + p.nach[0]); }
  function personRow(p, extra) {
    return h('a', { class: 'prow', href: '#/person/' + p.nr }, avatar(p),
      h('span', { class: 'prow-t' }, h('b', null, pname(p)), h('span', null, extra || p.fn)),
      h('span', { class: 'st st-' + p.st }, STATUS[p.st]));
  }

  /* ---------- Rahmen: Seitenleiste, Kopfzeile, Handy-Leiste ---------- */
  var NAV = [
    { r: '', n: 'Start', k: 'Start', i: 'home' },
    { r: 'aktuelles', n: 'Aktuelles', k: 'Aktuelles', i: 'news' },
    { r: 'arbeitsplatz', n: 'Mein Arbeitsplatz', k: 'Arbeit', i: 'briefcase' },
    { r: 'wissen', n: 'Wissen & Vorlagen', k: 'Wissen', i: 'book' },
    { r: 'kollegen', n: 'Kolleginnen & Kollegen', k: 'Team', i: 'users' },
    { r: 'akademie', n: 'Akademie', k: 'Akademie', i: 'cap' }
  ];
  var SECTION = { news: 'aktuelles', postfach: 'arbeitsplatz', app: 'arbeitsplatz', m: 'arbeitsplatz', wiki: 'wissen', person: 'kollegen', unternehmen: 'kollegen' };
  function navLinks(sec, short) {
    var open = openTasks().length;
    return NAV.map(function (it) {
      var on = it.r === sec;
      return h('a', { href: '#/' + it.r, class: on ? 'on' : null, 'aria-current': on ? 'page' : null },
        h('span', { class: 'ni' }, icon(it.i), it.r === 'arbeitsplatz' && open ? h('span', { class: 'badge', 'aria-label': open + ' offene Aufträge' }, String(open)) : null),
        h('span', { class: 'nl' }, short ? it.k : it.n));
    });
  }
  function searchForm(q) {
    var inp = h('input', { type: 'search', placeholder: 'Suchen …', 'aria-label': 'LindnerNet durchsuchen', value: q || '' });
    return h('form', { class: 'sform', role: 'search', onsubmit: function (e) { e.preventDefault(); var v = inp.value.trim(); if (v) location.hash = '#/suche/' + encodeURIComponent(v); } }, icon('search'), inp);
  }
  function renderChrome(route) {
    var first = route.split('/')[0], sec = SECTION[first] || first, q = first === 'suche' ? decodeURIComponent(route.slice(6)) : '';
    side.textContent = ''; topbar.textContent = ''; tabs.textContent = ''; foot.textContent = '';
    document.body.className = bundle ? '' : 'anon';
    if (!bundle) {
      add(foot, [h('p', null, 'LindnerNet ist ein Lernangebot zum Unterricht. Die Lindner Bürowelt am Main KG ist ein Modellunternehmen: Alle Namen, Personen und Daten sind frei erfunden.'),
        h('p', null, 'Diese Seite braucht keinen Namen und kein Konto und speichert keine persönlichen Daten.')]);
      return;
    }
    add(side, [
      h('a', { class: 'side-logo', href: '#/', 'aria-label': 'LindnerNet Startseite' }, h('img', { src: 'assets/logo_kurz_weiss.png', alt: '' }), h('span', null, 'LindnerNet')),
      h('nav', { class: 'side-nav', 'aria-label': 'Hauptnavigation' }, navLinks(sec, false)),
      h('div', { class: 'side-foot' }, h('a', { href: '#/datenschutz' }, icon('shield'), 'Datenschutz & Nutzung'))
    ]);
    add(topbar, [
      h('a', { class: 'top-logo', href: '#/', 'aria-label': 'LindnerNet Startseite' }, h('img', { src: 'assets/logo_kurz_weiss.png', alt: '' })),
      searchForm(q),
      h('a', { class: 'me', href: '#/ich', 'aria-label': 'Mein Profil: ' + bundle.user.stelle }, h('span', { class: 'me-t' }, h('b', null, bundle.user.stelle), h('span', null, abt(bundle.user.abt).name)), h('span', { class: 'av a-' + bundle.user.abt }, bundle.user.kurz))
    ]);
    add(tabs, navLinks(sec, true));
    add(foot, [h('p', null, 'LindnerNet · Modellunternehmen für den Unterricht. Alle Namen, Personen und Daten sind frei erfunden.'),
      h('p', null, h('a', { href: '#/datenschutz' }, 'Datenschutz & Nutzung'), ' · ', h('a', { href: '#/unternehmen' }, 'Über Lindner'))]);
  }

  function go() {
    var route = location.hash.replace(/^#\/?/, ''), parts = route.split('/');
    if (!bundle) { renderChrome(''); app.textContent = ''; viewLogin(); window.scrollTo(0, 0); return; }
    renderChrome(route);
    app.textContent = '';
    switch (parts[0]) {
      case 'aktuelles': viewAktuelles(); break;
      case 'news': viewNews(parts[1]); break;
      case 'arbeitsplatz': viewArbeitsplatz(); break;
      case 'postfach': viewPostfach(); break;
      case 'app': viewApp(parts[1]); break;
      case 'm': viewModule(parts[1], parseInt(parts[2] || '0', 10)); break;
      case 'wissen': if (parts[1] === 'karten') viewKarten(); else viewWissen(); break;
      case 'glossar': viewWissen(); break;
      case 'wiki': viewWiki(parts[1], parseInt(parts[2] || '0', 10)); break;
      case 'kollegen': viewKollegen(parts[1]); break;
      case 'person': viewPerson(parseInt(parts[1], 10)); break;
      case 'unternehmen': case 'lindner': viewUnternehmen(); break;
      case 'akademie': viewAkademie(); break;
      case 'suche': viewSuche(decodeURIComponent(route.slice(6))); break;
      case 'datenschutz': viewDatenschutz(); break;
      case 'ich': viewIch(); break;
      default: viewStart();
    }
    window.scrollTo(0, 0);
  }
  function crumb(items) {
    var el = h('p', { class: 'crumb' });
    items.forEach(function (it, i) { if (i) add(el, ' › '); add(el, it[1] ? h('a', { href: it[1] }, it[0]) : h('span', null, it[0])); });
    return el;
  }
  function head(title, sub) { return h('div', { class: 'phead' }, h('h1', null, title), sub ? h('p', { class: 'muted' }, sub) : null); }

  /* ---------- Anmeldung ---------- */
  function viewLogin() {
    var input = h('input', { type: 'text', name: 'code', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'Zugangscode', 'aria-label': 'Zugangscode', required: true });
    var msg = h('div', { role: 'status', 'aria-live': 'polite' });
    var btn = h('button', { class: 'btn', type: 'submit' }, 'Anmelden');
    var form = h('form', { class: 'code-form', onsubmit: function (e) {
      e.preventDefault();
      if (!window.crypto || !crypto.subtle) { msg.textContent = ''; add(msg, h('p', { class: 'msg bad' }, 'Dieser Browser kann LindnerNet nicht öffnen. Bitte nutze einen aktuellen Browser und die Adresse mit https.')); return; }
      btn.disabled = true; btn.textContent = 'Prüfe …'; msg.textContent = '';
      unlock(input.value).then(function (data) {
        btn.disabled = false; btn.textContent = 'Anmelden';
        if (!data) { add(msg, h('p', { class: 'msg bad' }, 'Dieser Code passt nicht. Bitte prüfe die Schreibweise oder frage deine Lehrkraft.')); return; }
        setBundle(data); LS.set('lb_code', normCode(input.value)); location.hash = '#/'; go();
      });
    } }, input, btn);
    add(app, h('div', { class: 'login' },
      h('img', { class: 'login-logo', src: 'assets/logo_weiss.png', alt: 'Lindner Bürowelt am Main KG' }),
      h('div', { class: 'login-card' },
        h('div', { class: 'kicker' }, 'Intranet'), h('h1', null, 'LindnerNet'),
        h('p', { class: 'muted' }, 'Melde dich mit dem Zugangscode deiner Klasse an. Du brauchst keinen Namen und kein Konto.'),
        form, msg,
        h('p', { class: 'small muted', style: 'margin:14px 0 0' }, 'Den Code bekommst du von deiner Lehrkraft.'))));
  }

  /* ---------- Bausteine ---------- */
  function appDef(id) { return bundle.apps.filter(function (a) { return a.id === id; })[0]; }
  function appActive(a) { return !a.ab; }
  var SHARED_APPS = [
    { href: '#/aktuelles', name: 'News', icon: 'news', farbe: 'rot' },
    { href: '#/aktuelles', name: 'Kalender', icon: 'calendar', farbe: 'tuerkis', anchor: 'kalender' },
    { href: '#/kollegen', name: 'Personen', icon: 'users', farbe: 'lila' },
    { href: '#/unternehmen', name: 'Unternehmen', icon: 'building', farbe: 'navy' },
    { href: '#/wissen', name: 'Wiki', icon: 'book', farbe: 'gruen' },
    { href: '#/akademie', name: 'Akademie', icon: 'cap', farbe: 'orange' }
  ];
  function tile(href, name, ic, farbe, opt) {
    opt = opt || {};
    return h('a', { class: 'tile' + (opt.ab ? ' off' : ''), href: href },
      h('span', { class: 'tile-i c-' + farbe }, icon(ic), opt.badge ? h('span', { class: 'badge' }, String(opt.badge)) : null),
      h('span', { class: 'tile-n' }, name),
      opt.ab ? h('span', { class: 'tile-ab' }, 'ab ' + opt.ab) : null);
  }
  function roleTiles() {
    var open = openTasks().length;
    return bundle.apps.map(function (a) {
      var n = 0;
      if (a.id === 'postfach') n = open;
      else (a.mods || []).forEach(function (id) { var m = mod(id); if (m && !locked(m) && modProgress(m) < 1) n++; });
      return tile(a.id === 'postfach' ? '#/postfach' : '#/app/' + a.id, a.name, a.icon, a.farbe, { ab: a.ab, badge: n });
    });
  }
  function sharedTiles() { return SHARED_APPS.map(function (a) { return tile(a.href, a.name, a.icon, a.farbe); }); }
  function taskRow(m) {
    var meta = (bundle.post || {})[m.id] || {}, von = meta.von ? person(meta.von) : null;
    if (locked(m)) {
      return h('div', { class: 'trow locked' }, h('span', { class: 'av a-none', 'aria-hidden': 'true' }, icon('lock')),
        h('span', { class: 'trow-t' }, h('b', null, 'Neuer Auftrag angekündigt'), h('span', null, 'Erscheint am ' + fmtDate(m.ab) + ' im Postfach.')));
    }
    var pr = modProgress(m), state = pr >= 1 ? ['erledigt', 'g'] : pr > 0 ? ['in Arbeit', 'o'] : ['neu', 'n'];
    return h('a', { class: 'trow' + (pr === 0 ? ' unread' : ''), href: '#/m/' + m.id },
      von ? avatar(von) : h('span', { class: 'av a-none', 'aria-hidden': 'true' }, icon('mail')),
      h('span', { class: 'trow-t' },
        h('span', { class: 'trow-from' }, von ? pname(von) : 'Lindner Bürowelt', meta.d ? h('time', null, fmtShort(meta.d)) : null),
        h('b', null, meta.betreff || m.title), h('span', null, m.intro),
        h('span', { class: 'bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(pr * 100)), 'aria-label': 'Fortschritt' }, h('i', { style: 'width:' + Math.round(pr * 100) + '%' }))),
      h('span', { class: 'pill ' + state[1] }, state[0]));
  }
  function newsCard(n, big) {
    var von = person(n.von), neu = !seenNews()[n.id];
    return h('a', { class: 'ncard' + (big ? ' big' : ''), href: '#/news/' + n.id },
      h('span', { class: 'ncard-m' }, h('span', { class: 'kat' }, n.kat), h('time', null, fmtDate(n.d)), neu ? h('span', { class: 'pill n' }, 'neu') : null),
      h('b', null, n.titel), h('span', { class: 'ncard-t' }, n.teaser),
      h('span', { class: 'ncard-a' }, avatar(von, 'sm'), pname(von)));
  }
  function eventList(max) {
    var t = todayIso(), list = termine().filter(function (e) { return e.d >= t; });
    if (max) list = list.slice(0, max);
    if (!list.length) return h('p', { class: 'muted' }, 'Keine anstehenden Termine.');
    return h('ul', { class: 'events' }, list.map(function (e) {
      var d = dparts(e.d);
      return h('li', null, h('span', { class: 'ev-d' }, h('b', null, ('0' + d.getDate()).slice(-2)), d.toLocaleDateString('de-DE', { month: 'short' }).replace('.', '')),
        h('span', { class: 'ev-t' }, h('b', null, e.t), h('span', null, [WT[d.getDay()], e.z ? e.z + ' Uhr' : null, e.o || null].filter(Boolean).join(' · '))));
    }));
  }
  function section(title, more, body) {
    return h('section', { class: 'sec' }, h('div', { class: 'sec-h' }, h('h2', null, title), more ? h('a', { href: more[1] }, more[0], icon('chevron')) : null), body);
  }

  /* ---------- Start ---------- */
  function viewStart() {
    var hr = new Date().getHours(), gruss = hr < 11 ? 'Guten Morgen!' : hr < 17 ? 'Guten Tag!' : 'Guten Abend!';
    var open = openTasks(), chef = person(bundle.user.chef), gfp = person(SH.gf.von);
    var heute = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    add(app, h('section', { class: 'greet' },
      h('div', null, h('p', { class: 'greet-d' }, heute), h('h1', null, gruss),
        h('p', null, open.length ? (open.length === 1 ? 'Du hast 1 offenen Auftrag.' : 'Du hast ' + open.length + ' offene Aufträge.') : 'Alle Aufträge sind erledigt. Stark!', ' ', bundle.user.hinweis)),
      open.length ? h('div', { class: 'greet-tasks' }, open.slice(0, 2).map(function (m) {
        var meta = (bundle.post || {})[m.id] || {};
        return h('a', { href: '#/m/' + m.id }, icon('mail'), h('span', null, h('b', null, meta.betreff || m.title), h('span', null, 'von ' + (meta.von ? pname(person(meta.von)) : pname(chef)))), icon('chevron'));
      })) : null));

    if (!LS.get('ln_tour', 0)) {
      var tour = h('section', { class: 'tour' }, h('h2', null, 'Neu im LindnerNet? So findest du dich zurecht'),
        h('ol', null,
          h('li', null, h('b', null, 'Mein Arbeitsplatz: '), 'Hier liegen deine Aufträge. Eine rote Zahl zeigt, was noch offen ist.'),
          h('li', null, h('b', null, 'Wissen & Vorlagen: '), 'Nachschlagen wie im echten Betrieb: Leitfäden, Fachbegriffe, Lernkarten.'),
          h('li', null, h('b', null, 'Akademie: '), 'Üben für Schulaufgabe und Abschlussprüfung. Dein Lernstand bleibt nur auf diesem Gerät.')),
        h('button', { class: 'btn sec', type: 'button', onclick: function () { LS.set('ln_tour', 1); tour.remove(); } }, 'Verstanden'));
      add(app, tour);
    }

    add(app, h('section', { class: 'gf' },
      h('img', { src: SH.gf.bild, alt: SH.gf.bildtext }),
      h('div', { class: 'gf-b' }, h('div', { class: 'kicker' }, 'Aus der Geschäftsführung'), h('h2', null, SH.gf.titel), h('p', null, SH.gf.text),
        h('a', { class: 'gf-a', href: '#/person/' + gfp.nr }, avatar(gfp, 'sm'), h('span', null, h('b', null, pname(gfp)), ' · ' + gfp.fn)))));

    add(app, section('Aktuelles', ['Alle News', '#/aktuelles'], h('div', { class: 'ngrid' }, SH.news.slice(0, 3).map(function (n) { return newsCard(n); }))));
    add(app, section('Meine Apps', ['Mein Arbeitsplatz', '#/arbeitsplatz'], h('div', { class: 'tiles' }, roleTiles())));
    add(app, section('Lindner allgemein', null, h('div', { class: 'tiles' }, sharedTiles())));

    add(app, h('div', { class: 'cols' },
      section('Nächste Termine', ['Kalender', '#/aktuelles'], h('div', { class: 'card' }, eventList(4))),
      section('Neu bei Lindner & Jubiläen', null, h('div', { class: 'card' },
        h('ul', { class: 'social' }, SH.neu.map(function (x) { var p = person(x.nr); return h('li', null, h('a', { href: '#/person/' + p.nr }, avatar(p, 'sm'), h('span', null, h('b', null, pname(p)), h('span', null, 'Willkommen · ' + x.t)))); }),
          SH.jubilaeen.map(function (x) { var p = person(x.nr); return h('li', null, h('a', { href: '#/person/' + p.nr }, avatar(p, 'sm'), h('span', null, h('b', null, pname(p)), h('span', null, 'Jubiläum · ' + x.t)))); })),
        h('p', { class: 'small muted', style: 'margin:10px 0 0' }, 'Veröffentlicht mit Einwilligung der genannten Personen.')))));
  }

  /* ---------- Aktuelles ---------- */
  function viewAktuelles() {
    add(app, head('Aktuelles', 'Neuigkeiten und Termine aus dem Haus'));
    add(app, h('div', { class: 'ngrid two' }, SH.news.map(function (n, i) { return newsCard(n, i === 0); })));
    add(app, section('Kalender', null, h('div', { class: 'card', id: 'kalender' }, eventList(0))));
  }
  function viewNews(id) {
    var n = SH.news.filter(function (x) { return x.id === id; })[0];
    if (!n) { location.hash = '#/aktuelles'; return; }
    markNews(id);
    var von = person(n.von);
    add(app, [crumb([['Aktuelles', '#/aktuelles'], [n.kat]]),
      h('article', { class: 'card article' }, h('div', { class: 'ncard-m' }, h('span', { class: 'kat' }, n.kat), h('time', null, fmtDate(n.d))), h('h1', null, n.titel),
        h('p', { class: 'lead' }, n.teaser), paras(n.text),
        h('a', { class: 'gf-a', href: '#/person/' + von.nr }, avatar(von, 'sm'), h('span', null, h('b', null, pname(von)), ' · ' + von.fn))),
      h('a', { class: 'btn sec', href: '#/aktuelles' }, '← Alle News')]);
  }

  /* ---------- Mein Arbeitsplatz ---------- */
  function viewArbeitsplatz() {
    add(app, head('Mein Arbeitsplatz', bundle.user.stelle + ' · ' + abt(bundle.user.abt).name));
    add(app, section('Postfach', ['Alle Aufträge', '#/postfach'], h('div', { class: 'card list' }, bundle.modules.slice().reverse().map(taskRow))));
    add(app, section('Meine Apps', null, h('div', { class: 'tiles' }, roleTiles())));
    add(app, h('p', { class: 'small muted' }, 'Graue Apps werden im Lauf des Schuljahres freigeschaltet. Die Kalenderwoche (KW) steht darunter.'));
  }
  function viewPostfach() {
    var a = appDef('postfach');
    add(app, [crumb([['Mein Arbeitsplatz', '#/arbeitsplatz'], [a.name]]), head(a.name, a.info),
      h('div', { class: 'card list' }, bundle.modules.slice().reverse().map(taskRow))]);
  }
  function wikiFor(modIds) {
    return (bundle.wiki || []).filter(function (w) { var m = mod(w.m); return m && !locked(m) && (!modIds || modIds.indexOf(w.m) >= 0); });
  }
  function wikiRow(w) {
    var s = mod(w.m).steps[w.s];
    return h('a', { class: 'lrow', href: '#/wiki/' + w.m + '/' + w.s }, h('span', { class: 'lrow-i' }, icon('file')), h('span', { class: 'lrow-t' }, h('b', null, s.title), h('span', null, 'Leitfaden · ' + mod(w.m).title)), icon('chevron'));
  }
  function viewApp(id) {
    var a = appDef(id);
    if (!a) { location.hash = '#/arbeitsplatz'; return; }
    if (a.id === 'postfach') { location.hash = '#/postfach'; return; }
    add(app, [crumb([['Mein Arbeitsplatz', '#/arbeitsplatz'], [a.name]]),
      h('div', { class: 'apphead' }, h('span', { class: 'tile-i c-' + a.farbe }, icon(a.icon)), h('div', null, h('h1', null, a.name), h('p', { class: 'muted' }, a.info)))]);
    if (!appActive(a)) {
      add(app, h('div', { class: 'card empty' }, icon('lock'), h('h2', null, 'Wird ab ' + a.ab + ' freigeschaltet'),
        h('p', { class: 'muted' }, 'Diese App brauchst du erst später im Schuljahr. Deine aktuellen Aufträge findest du im Postfach.'), h('a', { class: 'btn', href: '#/postfach' }, 'Zum Postfach')));
      return;
    }
    var mods = (a.mods || []).map(mod).filter(Boolean);
    add(app, section('Aufträge', null, h('div', { class: 'card list' }, mods.map(taskRow))));
    var w = wikiFor(a.mods || []);
    if (w.length) add(app, section('Nachschlagen', ['Wissen & Vorlagen', '#/wissen'], h('div', { class: 'card list' }, w.map(wikiRow))));
  }

  /* ---------- Auftrag (Modul) ---------- */
  function viewModule(id, idx) {
    var m = mod(id);
    if (!m || locked(m)) { location.hash = '#/postfach'; return; }
    if (isNaN(idx) || idx < 0 || idx >= m.steps.length) idx = 0;
    var s = m.steps[idx];
    add(app, crumb([['Mein Arbeitsplatz', '#/arbeitsplatz'], ['Postfach', '#/postfach'], [m.title]]));
    add(app, h('div', { class: 'stepper', 'aria-hidden': 'true' }, m.steps.map(function (_, i) { return h('i', { class: i === idx ? 'cur' : (isDone(m.id, i) ? 'done' : null) }); })));
    var box = h('section', { class: 'card' }, h('div', { class: 'kicker' }, 'Schritt ' + (idx + 1) + ' von ' + m.steps.length + (s.k ? ' · ' + s.k : '')), s.title ? h('h2', null, s.title) : null, s.lead ? h('p', { html: s.lead }) : null);
    add(app, box);
    var done = function (pts, max) { setDone(m.id, idx, pts || 0, max || 0); };
    (RENDER[s.t] || RENDER.info)(s, box, done, m.id + ':' + idx);
    if (!INTERACTIVE[s.t]) done(0, 0);
    add(app, h('div', { class: 'stepnav' },
      idx > 0 ? h('a', { class: 'btn sec', href: '#/m/' + m.id + '/' + (idx - 1) }, '← Zurück') : h('span'),
      idx < m.steps.length - 1 ? h('a', { class: 'btn', href: '#/m/' + m.id + '/' + (idx + 1) }, 'Weiter →') : h('a', { class: 'btn', href: '#/postfach' }, 'Fertig ✓')));
  }

  var INTERACTIVE = { quiz: 1, sort: 1, calc: 1, reflect: 1 };
  var RENDER = {
    mail: function (s, box) {
      if (s.review) add(box, h('div', { class: 'review' }, h('div', { class: 'small muted' }, s.review.head), h('div', null, h('strong', null, s.review.name), ' ', h('span', { class: 'stars', 'aria-label': s.review.stars + ' von 5 Sternen' }, '★★★★★'.slice(0, s.review.stars), h('span', null, '★★★★★'.slice(s.review.stars))), ' ', h('span', { class: 'small muted' }, s.review.when)), h('p', { style: 'margin:.4em 0 0' }, s.review.text)));
      add(box, h('div', { class: 'mail' },
        h('div', { class: 'mail-h' }, h('div', { class: 'ava', 'aria-hidden': 'true' }, initials(s.from)), h('div', null, h('b', null, s.from), s.role ? ' · ' + s.role : null, h('div', { class: 'meta' }, 'An: ' + s.to + ' · ' + s.date))),
        h('div', { class: 'mail-s' }, s.subject), h('div', { class: 'mail-b' }, paras(s.body)),
        h('div', { class: 'mail-f' }, 'Gesendet über das Postfach der Lindner Bürowelt am Main KG · interne Nachricht')));
      (s.att || []).forEach(function (a) { add(box, attachment(a)); });
    },
    chat: function (s, box) {
      add(box, h('div', { class: 'callbar' }, h('span', { 'aria-hidden': 'true' }, s.icon || '📞'), s.bar));
      add(box, h('div', { class: 'chat' }, s.lines.map(function (l) { return h('div', { class: 'bub' + (l.r ? ' r' : '') }, h('small', null, l.w), l.x); })));
      if (s.task) add(box, h('p', { class: 'why', html: s.task }));
    },
    info: function (s, box) {
      (s.items || []).forEach(function (it) {
        add(box, h('div', { class: 'info' }, h('h3', null, it.h), it.sub ? h('div', { class: 'sub' }, it.sub) : null, it.p ? paras(it.p) : null, it.ex ? h('div', { class: 'ex' }, it.ex) : null));
      });
      if (s.scheme) add(box, scheme(s.scheme));
      if (s.merk) add(box, h('div', { class: 'merk', html: s.merk }));
      (s.att || []).forEach(function (a) { add(box, attachment(a)); });
    },
    quiz: function (s, box, done) {
      var answered = 0, right = 0, res = h('div', { role: 'status', 'aria-live': 'polite' });
      s.qs.forEach(function (q, qi) {
        var why = h('div'), btns = q.a.map(function (txt, ai) {
          return h('button', { class: 'opt', type: 'button', onclick: function () {
            btns.forEach(function (b, bi) { b.disabled = true; if (bi === q.c) b.classList.add('ok'); });
            if (ai === q.c) right++; else btns[ai].classList.add('bad');
            add(why, h('div', { class: 'why' }, h('strong', null, ai === q.c ? 'Richtig. ' : 'Nicht ganz. '), q.why ? rich(q.why) : null));
            if (++answered === s.qs.length) { done(right, s.qs.length); add(res, result(right, s.qs.length, function () { go(); })); }
          } }, txt);
        });
        add(box, h('div', { class: 'q' }, h('p', null, (qi + 1) + '. ', rich(q.q)), q.ctx ? h('div', { class: 'ex', style: 'margin-bottom:8px' }, q.ctx) : null, h('div', { class: 'opts' }, btns), why));
      });
      add(box, res);
    },
    sort: function (s, box, done) {
      var items = shuffle(s.items), i = 0, right = 0;
      var area = h('div', { 'aria-live': 'polite' });
      add(box, area);
      function show() {
        area.textContent = '';
        if (i >= items.length) { done(right, items.length); add(area, result(right, items.length, function () { go(); })); return; }
        var it = items[i], fb = h('div');
        var btns = s.buckets.map(function (b, bi) {
          return h('button', { class: 'opt', type: 'button', onclick: function () {
            btns.forEach(function (x, xi) { x.disabled = true; if (xi === it.b) x.classList.add('ok'); });
            var ok = bi === it.b; if (ok) right++; else btns[bi].classList.add('bad');
            add(fb, h('div', { class: 'fb ' + (ok ? 'ok' : 'bad') }, ok ? 'Richtig!' : 'Richtig wäre: ' + s.buckets[it.b], it.why ? ' ' + it.why : ''));
            add(fb, h('button', { class: 'btn', type: 'button', onclick: function () { i++; show(); } }, i === items.length - 1 ? 'Auswertung' : 'Nächste Karte →'));
          } }, b);
        });
        add(area, [h('p', { class: 'small muted' }, 'Karte ' + (i + 1) + ' von ' + items.length), h('div', { class: 'sortcard' }, it.x), h('div', { class: 'buckets' }, btns), fb]);
      }
      show();
    },
    calc: function (s, box, done) {
      var ci = 0, area = h('div'); add(box, area);
      function show() {
        area.textContent = '';
        var c = s.cases[ci];
        var sol = { brutto: c.brutto, ist: c.ist, diff: c.brutto - c.ist, ab: c.ab, zu: c.zu, netto: c.brutto - c.ist + c.ab - c.zu };
        var fields = [['brutto', 'Bruttopersonalbedarf (Stellenplan)'], ['ist', '− Ist-Personalbestand'], ['diff', '= Unterdeckung (+) / Überdeckung (−)'], ['ab', '+ Abgänge'], ['zu', '− Zugänge'], ['netto', '= Nettopersonalbedarf']];
        var inputs = {}, fb = h('div', { role: 'status', 'aria-live': 'polite' });
        add(area, [
          s.cases.length > 1 ? h('p', null, h('span', { class: 'pill' }, 'Fall ' + (ci + 1) + ' von ' + s.cases.length), c.tag ? h('span', { class: 'pill o' }, c.tag) : null) : null,
          h('div', { class: 'note' }, h('strong', null, c.title), h('ul', { class: 'clean' }, c.lines.map(function (l) { return h('li', null, l); }))),
          h('form', { class: 'calc', onsubmit: function (e) {
            e.preventDefault(); var ok = 0; fb.textContent = '';
            fields.forEach(function (f) { var good = String(inputs[f[0]].value).trim() !== '' && Number(inputs[f[0]].value) === sol[f[0]]; inputs[f[0]].className = good ? 'ok' : 'bad'; if (good) ok++; });
            done(ok === fields.length ? 3 : 0, 3);
            if (ok === fields.length) add(fb, h('div', { class: 'fb ok' }, 'Alles richtig!'));
            else add(fb, [h('div', { class: 'fb bad' }, ok + ' von ' + fields.length + ' Feldern stimmen. Prüfe die rot markierten Felder.' + (c.hint ? ' Tipp: ' + c.hint : '')),
              h('button', { class: 'btn ghost', type: 'button', onclick: function () { fields.forEach(function (f) { inputs[f[0]].value = sol[f[0]]; inputs[f[0]].className = 'ok'; }); } }, 'Lösung anzeigen')]);
          } }, fields.map(function (f) { inputs[f[0]] = h('input', { type: 'number', inputmode: 'numeric', 'aria-label': f[1] }); return h('label', null, h('span', null, f[1]), inputs[f[0]]); }),
            h('div', { class: 'row', style: 'margin-top:14px' }, h('button', { class: 'btn', type: 'submit' }, 'Prüfen'),
              s.cases.length > 1 ? h('button', { class: 'btn sec', type: 'button', onclick: function () { ci = (ci + 1) % s.cases.length; show(); } }, 'Nächster Fall') : null)),
          fb]);
      }
      show();
    },
    reflect: function (s, box, done, key) {
      var p = prog(), ta = h('textarea', { 'aria-label': s.title || 'Deine Antwort', placeholder: s.ph || '' }), saved = h('span', { class: 'small muted', role: 'status' });
      ta.value = p.notes[key] || '';
      ta.addEventListener('input', function () { var q = prog(); q.notes[key] = ta.value; LS.set(pkey(), q); saved.textContent = ' Gespeichert auf diesem Gerät.'; if (ta.value.trim().length > 15) done(1, 1); });
      if (s.chips) add(box, h('div', { style: 'margin-bottom:10px' }, s.chips.map(function (c) { return h('span', { class: 'pill' }, c); })));
      add(box, [ta, h('p', { class: 'small muted', style: 'margin-top:8px' }, 'Deine Antwort wird nicht gesendet. Sie bleibt nur in diesem Browser, damit du sie im Unterricht vorlesen kannst.', saved)]);
    }
  };

  function attachment(a) {
    return h('details', { class: 'att' }, h('summary', null, '📎 ', a.name),
      h('div', { class: 'att-b' }, a.pre ? h('pre', { class: 'doc' }, a.pre) : null, a.quote ? h('p', null, h('em', null, a.quote)) : null, a.body ? paras(a.body) : null));
  }
  function scheme(rows) {
    return h('table', { class: 'scheme' }, h('tbody', null, rows.map(function (r) { return h('tr', { class: r[2] ? 'sum' : null }, h('td', null, r[0]), h('td', null, r[1])); })));
  }
  function result(right, total, again) {
    var pct = right / total, text = pct === 1 ? 'Stark, alles richtig!' : pct >= 0.7 ? 'Gut gemacht!' : 'Schau dir die Erklärungen noch einmal an.';
    return h('div', { class: 'score' }, h('b', null, right + ' / ' + total), h('p', null, text), h('button', { class: 'btn sec', type: 'button', onclick: again }, 'Noch einmal'));
  }


  /* ---------- Wissen & Vorlagen ---------- */
  function viewWiki(mid, idx) {
    var m = mod(mid), s = m && !locked(m) ? m.steps[idx] : null;
    if (!s) { location.hash = '#/wissen'; return; }
    var box = h('article', { class: 'card' }, h('div', { class: 'kicker' }, 'Leitfaden'), h('h1', null, s.title), s.lead ? h('p', { html: s.lead }) : null);
    add(app, [crumb([['Wissen & Vorlagen', '#/wissen'], [s.title]]), box]);
    RENDER.info(s, box);
    add(app, h('div', { class: 'row' }, h('a', { class: 'btn sec', href: '#/wissen' }, '← Wissen & Vorlagen'), h('a', { class: 'btn ghost', href: '#/m/' + mid + '/' + idx }, 'Im Auftrag „' + m.title + '“ öffnen')));
  }
  function viewWissen() {
    var terms = bundle.glossary.slice().sort(function (a, b) { return a.b.localeCompare(b.b, 'de'); });
    var list = h('dl', { class: 'gl' });
    function draw(filter) {
      list.textContent = '';
      var f = norm(filter), hits = terms.filter(function (t) { return !f || norm(t.b + ' ' + t.d).indexOf(f) >= 0; });
      hits.forEach(function (t) { add(list, h('div', null, h('dt', null, t.b), h('dd', null, t.d))); });
      if (!hits.length) add(list, h('p', { class: 'muted' }, 'Kein Begriff gefunden.'));
    }
    var s = h('input', { class: 'search', type: 'search', placeholder: 'Begriff suchen …', 'aria-label': 'Begriff suchen', oninput: function () { draw(s.value); } });
    var w = wikiFor(null);
    add(app, head('Wissen & Vorlagen', 'Nachschlagen wie im Betrieb: Leitfäden, Regeln und Fachbegriffe'));
    add(app, section('Leitfäden', null, h('div', { class: 'card list' }, w.length ? w.map(wikiRow) : h('p', { class: 'muted' }, 'Leitfäden erscheinen hier mit deinen Aufträgen.'),
      h('a', { class: 'lrow', href: '#/unternehmen' }, h('span', { class: 'lrow-i' }, icon('building')), h('span', { class: 'lrow-t' }, h('b', null, 'So arbeiten wir bei Lindner'), h('span', null, 'Arbeitszeit, Urlaub, Betriebsrat, Unternehmensdaten')), icon('chevron')))));
    add(app, section('Wiki: Fachbegriffe', ['Als Lernkarten üben', '#/wissen/karten'], [s, list]));
    draw('');
  }
  function viewKarten() {
    var deck = shuffle(bundle.glossary), i = 0, back = false;
    var card = h('button', { class: 'flash', type: 'button', 'aria-live': 'polite', onclick: function () { back = !back; paint(); } });
    var count = h('p', { class: 'small muted', style: 'text-align:center' });
    function paint() { card.className = 'flash' + (back ? ' back' : ''); card.textContent = back ? deck[i].d : deck[i].b; count.textContent = 'Karte ' + (i + 1) + ' von ' + deck.length + ' · Tippe zum Umdrehen'; }
    paint();
    add(app, [crumb([['Wissen & Vorlagen', '#/wissen'], ['Lernkarten']]), head('Lernkarten', 'Fachbegriffe aus ' + bundle.short), card, count, h('div', { class: 'stepnav' },
      h('button', { class: 'btn sec', type: 'button', onclick: function () { i = (i - 1 + deck.length) % deck.length; back = false; paint(); } }, '← Zurück'),
      h('button', { class: 'btn', type: 'button', onclick: function () { i = (i + 1) % deck.length; back = false; paint(); } }, 'Nächste →'))]);
  }

  /* ---------- Kolleginnen & Kollegen ---------- */
  function viewKollegen(sub) {
    var cur = sub && abt(sub) ? sub : '', q = '';
    var list = h('div', { class: 'card list' }), chips = h('div', { class: 'chips' });
    var inp = h('input', { class: 'search', type: 'search', placeholder: 'Name oder Aufgabe suchen …', 'aria-label': 'Personen suchen', oninput: function () { q = inp.value; draw(); } });
    function draw() {
      list.textContent = ''; chips.textContent = '';
      add(chips, [['', 'Alle']].concat(SH.abteilungen.map(function (a) { return [a.id, a.name]; })).map(function (c) {
        return h('button', { type: 'button', class: 'chip' + (c[0] === cur ? ' on' : ''), 'aria-pressed': c[0] === cur ? 'true' : 'false', onclick: function () { cur = c[0]; draw(); } }, c[1]);
      }));
      var f = norm(q), hits = SH.personen.filter(function (p) { return (!cur || p.abt === cur) && (!f || norm(pname(p) + ' ' + p.fn + ' ' + abt(p.abt).name).indexOf(f) >= 0); });
      add(list, hits.length ? hits.map(function (p) { return personRow(p); }) : h('p', { class: 'muted' }, 'Niemand gefunden.'));
    }
    add(app, [head('Kolleginnen & Kollegen', SH.personen.length + ' Beschäftigte in ' + (SH.abteilungen.length - 2) + ' Abteilungen'),
      h('div', { class: 'orgchart' }, SH.abteilungen.map(function (a) {
        var l = person(a.leitung), n = SH.personen.filter(function (p) { return p.abt === a.id; }).length;
        return h('button', { type: 'button', class: 'orgbox a-' + a.id, onclick: function () { cur = a.id; draw(); list.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, h('b', null, a.name), h('span', null, (a.id === 'az' ? 'Ausbilder: ' : a.id === 'gf' ? '' : 'Leitung: ') + pname(l)), h('span', { class: 'small' }, n + (n === 1 ? ' Person' : ' Personen')));
      })),
      inp, chips, list,
      h('p', { class: 'small muted' }, icon('shield'), ' Der Status zeigt nur, ob jemand erreichbar ist. Den Grund einer Abwesenheit sieht hier niemand: Das sind persönliche Daten, die nur die Personalabteilung kennen darf.'),
      h('a', { class: 'btn sec', href: '#/unternehmen' }, 'Über das Unternehmen')]);
    draw();
  }
  function viewPerson(nr) {
    var p = person(nr);
    if (!p) { location.hash = '#/kollegen'; return; }
    var a = abt(p.abt), chef = person(a.leitung);
    add(app, [crumb([['Kolleginnen & Kollegen', '#/kollegen'], [a.name, '#/kollegen/' + a.id], [pname(p)]]),
      h('div', { class: 'card profile' }, avatar(p, 'xl'),
        h('div', null, h('h1', null, pname(p)), h('p', { class: 'muted' }, p.fn), h('span', { class: 'st st-' + p.st }, STATUS[p.st])),
        h('dl', { class: 'facts' },
          h('div', null, h('dt', null, 'Abteilung'), h('dd', null, a.name)),
          h('div', null, h('dt', null, 'Durchwahl'), h('dd', null, '06021 4477-' + String(p.nr).slice(1))),
          h('div', null, h('dt', null, 'Bei Lindner seit'), h('dd', null, String(p.seit))),
          chef.nr !== p.nr ? h('div', null, h('dt', null, p.abt === 'az' ? 'Ausbilder' : 'Vorgesetzt'), h('dd', null, h('a', { href: '#/person/' + chef.nr }, pname(chef)))) : null)),
      h('p', { class: 'small muted' }, icon('shield'), ' Im Verzeichnis stehen nur dienstliche Angaben. Geburtsdatum, Entgelt oder Fehlzeiten gehören in die Personalakte und sind nur für die Personalabteilung sichtbar.')]);
    var team = SH.personen.filter(function (x) { return x.abt === p.abt && x.nr !== p.nr; });
    if (team.length) add(app, section('Im selben Team', null, h('div', { class: 'card list' }, team.map(function (x) { return personRow(x); }))));
  }
  function viewUnternehmen() {
    var F = SH.firma;
    add(app, [crumb([['Kolleginnen & Kollegen', '#/kollegen'], ['Unternehmen']]),
      h('div', { class: 'card' },
        h('img', { src: 'assets/logo_farbig.png', alt: F.name, style: 'max-width:320px;width:100%;display:block;margin:0 auto 10px' }),
        h('div', { class: 'stats' }, F.facts.map(function (f) { return h('div', { class: 'stat' }, h('b', null, f[0]), h('span', null, f[1])); })),
        h('p', { class: 'muted small', style: 'text-align:center;margin:0' }, 'Leitbild: „' + F.claim + '“')),
      h('div', { class: 'grid' },
        h('div', { class: 'card' }, h('h2', null, 'Steckbrief'), ul(F.steckbrief)),
        h('div', { class: 'card' }, h('h2', null, 'Unser Sortiment'), ul(F.sortiment)),
        h('div', { class: 'card' }, h('h2', null, 'Unsere Kunden'), ul(F.kunden)),
        h('div', { class: 'card' }, h('h2', null, 'Wichtige Geschäftspartner'), ul(F.partner))),
      h('div', { class: 'card' }, h('h2', null, 'So arbeiten wir bei Lindner'), ul(F.regeln)),
      h('a', { class: 'btn sec', href: '#/kollegen' }, 'Zum Personenverzeichnis')]);
  }

  /* ---------- Akademie ---------- */
  function viewAkademie() {
    var p = prog(), rows = [];
    bundle.modules.forEach(function (m) {
      if (locked(m)) return;
      m.steps.forEach(function (s, i) {
        if (s.t !== 'quiz' && s.t !== 'sort' && s.t !== 'calc') return;
        var d = p.done[m.id + ':' + i];
        rows.push(h('a', { class: 'lrow', href: '#/m/' + m.id + '/' + i }, h('span', { class: 'lrow-i' }, icon(s.t === 'calc' ? 'chart' : s.t === 'sort' ? 'cards' : 'check')),
          h('span', { class: 'lrow-t' }, h('b', null, s.title), h('span', null, (s.t === 'quiz' ? 'Quiz' : s.t === 'sort' ? 'Kartenspiel' : 'Rechnen') + ' · ' + m.title)),
          d ? h('span', { class: 'pill ' + (d.max && d.pts >= d.max ? 'g' : 'o') }, d.max ? d.pts + ' / ' + d.max : 'geübt') : h('span', { class: 'pill n' }, 'offen')));
      });
    });
    add(app, [head('Akademie', 'Üben für Schulaufgabe und Abschlussprüfung'),
      h('div', { class: 'stats' },
        h('div', { class: 'stat' }, h('b', null, String(totalPoints())), h('span', null, 'Punkte auf diesem Gerät')),
        h('div', { class: 'stat' }, h('b', null, bundle.modules.filter(function (m) { return !locked(m) && modProgress(m) >= 1; }).length + ' / ' + bundle.modules.filter(function (m) { return !locked(m); }).length), h('span', null, 'Aufträge erledigt')),
        h('div', { class: 'stat' }, h('b', null, String(bundle.glossary.length)), h('span', null, 'Fachbegriffe im Wiki'))),
      section('Unser Weg durch ' + bundle.short, null, h('div', { class: 'card' }, h('p', { class: 'muted small' }, bundle.title),
        h('ol', { class: 'road' }, bundle.road.map(function (r) { return h('li', { class: r.s || null }, (r.s === 'done' ? '✓ ' : '') + r.t); })))),
      section('Prüfungstraining', null, h('div', { class: 'card list' }, rows.length ? rows : h('p', { class: 'muted' }, 'Übungen erscheinen hier mit deinen Aufträgen.'),
        h('a', { class: 'lrow', href: '#/wissen/karten' }, h('span', { class: 'lrow-i' }, icon('cards')), h('span', { class: 'lrow-t' }, h('b', null, 'Lernkarten'), h('span', null, 'Fachbegriffe wiederholen')), icon('chevron')))),
      h('p', { class: 'small muted' }, 'Dein Lernstand wird nicht übertragen. Er liegt nur im Browser dieses Geräts.')]);
  }

  /* ---------- Suche ---------- */
  function viewSuche(q) {
    var f = norm(q), any = false;
    function has() { return norm(Array.prototype.join.call(arguments, ' ')).indexOf(f) >= 0; }
    function group(title, rows) { if (!rows.length) return; any = true; add(app, section(title, null, h('div', { class: 'card list' }, rows))); }
    function row(href, ic, a, b) { return h('a', { class: 'lrow', href: href }, h('span', { class: 'lrow-i' }, icon(ic)), h('span', { class: 'lrow-t' }, h('b', null, a), h('span', null, b)), icon('chevron')); }
    add(app, head('Suche', 'Ergebnisse für „' + q + '“'));
    if (f.length < 2) { add(app, h('p', { class: 'muted' }, 'Bitte gib mindestens zwei Zeichen ein.')); return; }
    group('Personen', SH.personen.filter(function (p) { return has(pname(p), p.fn, abt(p.abt).name); }).map(function (p) { return personRow(p); }));
    group('Aufträge', bundle.modules.filter(function (m) { return !locked(m) && has(m.title, m.intro, ((bundle.post || {})[m.id] || {}).betreff); }).map(taskRow));
    group('Apps', bundle.apps.filter(function (a) { return has(a.name, a.info); }).map(function (a) { return row(a.id === 'postfach' ? '#/postfach' : '#/app/' + a.id, a.icon, a.name, a.ab ? 'ab ' + a.ab : a.info); }));
    group('Leitfäden', wikiFor(null).filter(function (w) { return has(mod(w.m).steps[w.s].title); }).map(wikiRow));
    group('News', SH.news.filter(function (n) { return has(n.titel, n.teaser, n.text.join(' ')); }).map(function (n) { return row('#/news/' + n.id, 'news', n.titel, n.kat + ' · ' + fmtDate(n.d)); }));
    group('Termine', termine().filter(function (e) { return has(e.t, e.o); }).map(function (e) { return row('#/aktuelles', 'calendar', e.t, fmtShort(e.d) + (e.z ? ' · ' + e.z + ' Uhr' : '')); }));
    var gl = bundle.glossary.filter(function (t) { return has(t.b, t.d); });
    if (gl.length) { any = true; add(app, section('Wiki: Fachbegriffe', null, h('dl', { class: 'gl' }, gl.map(function (t) { return h('div', null, h('dt', null, t.b), h('dd', null, t.d)); })))); }
    if (!any) add(app, h('div', { class: 'card empty' }, icon('search'), h('h2', null, 'Nichts gefunden'), h('p', { class: 'muted' }, 'Versuche es mit einem anderen Wort, zum Beispiel einem Namen oder einem Fachbegriff.')));
  }

  /* ---------- Profil und Datenschutz ---------- */
  function logout() { LS.del('lb_code'); setBundle(null); location.hash = '#/'; go(); }
  function viewIch() {
    var chef = person(bundle.user.chef);
    add(app, [head('Mein Profil'),
      h('div', { class: 'card profile' }, h('span', { class: 'av xl a-' + bundle.user.abt }, bundle.user.kurz),
        h('div', null, h('h1', null, bundle.user.stelle), h('p', { class: 'muted' }, bundle.user.hinweis)),
        h('dl', { class: 'facts' },
          h('div', null, h('dt', null, 'Abteilung'), h('dd', null, abt(bundle.user.abt).name)),
          h('div', null, h('dt', null, 'Vorgesetzt'), h('dd', null, h('a', { href: '#/person/' + chef.nr }, pname(chef)))),
          h('div', null, h('dt', null, 'Zugang'), h('dd', null, bundle.short + ' · ohne Namen, ohne Konto')))),
      h('div', { class: 'card' }, h('h2', null, 'Dieses Gerät'),
        h('p', { class: 'muted' }, 'Dein Lernstand und deine Notizen liegen nur im Browser dieses Geräts. Niemand sonst kann sie sehen, auch deine Lehrkraft nicht.'),
        h('div', { class: 'row' },
          h('button', { class: 'btn sec', type: 'button', onclick: logout }, 'Abmelden'),
          h('button', { class: 'btn ghost', type: 'button', onclick: function () { if (confirm('Lernstand und Notizen auf diesem Gerät wirklich löschen?')) { LS.del(pkey()); LS.del('ln_news_' + bundle.id); LS.del('ln_tour'); go(); } } }, 'Lernstand löschen')))]);
  }
  function viewDatenschutz() {
    add(app, [head('Datenschutz & Nutzung', 'Kurz und ehrlich: Was LindnerNet speichert und was nicht'),
      h('div', { class: 'card' }, h('h2', null, 'Was LindnerNet ist'),
        h('p', null, 'LindnerNet ist ein Lernangebot zum Unterricht. Die Lindner Bürowelt am Main KG gibt es nicht wirklich. Alle Personen, Namen, Nachrichten und Zahlen sind frei erfunden.')),
      h('div', { class: 'card' }, h('h2', null, 'Was nicht gespeichert wird'),
        ul(['Kein Name, keine E-Mail-Adresse, kein Konto.', 'Keine Auswertung, wer was wann anklickt. Es gibt kein Tracking und keine Werbung.', 'Deine Antworten und Notizen werden nicht gesendet. Auch deine Lehrkraft sieht sie nicht.'])),
      h('div', { class: 'card' }, h('h2', null, 'Was auf deinem Gerät liegt'),
        ul(['Der Zugangscode deiner Klasse, damit du dich nicht jedes Mal neu anmelden musst.', 'Dein Lernstand, deine Punkte und deine Notizen.', 'Mit „Abmelden“ und „Lernstand löschen“ unter „Mein Profil“ entfernst du alles wieder.']),
        h('a', { class: 'btn sec', href: '#/ich' }, 'Mein Profil öffnen')),
      h('div', { class: 'card' }, h('h2', null, 'Technik'),
        h('p', null, 'Die Seite liegt bei GitHub Pages. Wie bei jeder Website verarbeitet der Anbieter beim Abruf technische Daten wie die IP-Adresse. Die Inhalte sind verschlüsselt und werden erst mit dem Zugangscode auf deinem Gerät lesbar.')),
      h('div', { class: 'card' }, h('h2', null, 'Wie im echten Betrieb'),
        h('p', null, 'Auch im LindnerNet gilt: Jede Rolle sieht nur, was sie für ihre Arbeit braucht. Im Personenverzeichnis stehen deshalb nur dienstliche Angaben, und bei Abwesenheiten steht kein Grund.'))]);
  }

  /* ---------- Los ---------- */
  window.addEventListener('hashchange', go);
  var saved = LS.get('lb_code', null);
  if (saved && window.crypto && crypto.subtle) {
    unlock(saved).then(function (data) { if (data) setBundle(data); else LS.del('lb_code'); go(); }, function () { go(); });
  } else go();
})();
