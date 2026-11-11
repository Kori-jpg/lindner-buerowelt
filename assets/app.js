/* Lindner Bürowelt – Lernportal. Keine Konten, kein Tracking: Lernstand bleibt im Browser. */
(function () {
  'use strict';

  var BUNDLES = ['lf7', 'lf8'];
  var app = document.getElementById('app');
  var nav = document.getElementById('nav');
  var bundle = null;

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

  /* ---------- Lernstand (nur lokal) ---------- */
  function pkey() { return 'lb_p_' + bundle.id; }
  function prog() { return LS.get(pkey(), { done: {}, notes: {} }); }
  function setDone(modId, idx, pts, max) { var p = prog(); var k = modId + ':' + idx; var old = p.done[k]; if (!old || pts >= old.pts) p.done[k] = { pts: pts, max: max }; LS.set(pkey(), p); }
  function isDone(modId, idx) { return !!prog().done[modId + ':' + idx]; }
  function modProgress(m) { var p = prog(), n = 0; m.steps.forEach(function (s, i) { if (p.done[m.id + ':' + i]) n++; }); return n / m.steps.length; }
  function totalPoints() { var p = prog(), t = 0, k; for (k in p.done) t += p.done[k].pts || 0; return t; }
  function locked(m) { return m.ab && Date.now() < Date.parse(m.ab); }
  function fmtDate(iso) { var d = new Date(iso); return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }

  /* ---------- Navigation ---------- */
  function renderNav(route) {
    nav.textContent = '';
    var items = bundle
      ? [['#/', 'Start'], ['#/glossar', 'Glossar'], ['#/lindner', 'Lindner']]
      : [['#/', 'Start'], ['#/lindner', 'Lindner']];
    items.forEach(function (it) {
      var on = it[0] === '#/' ? (route === '' || route.indexOf('m/') === 0) : route === it[0].slice(2);
      add(nav, h('a', { href: it[0], class: on ? 'on' : null, 'aria-current': on ? 'page' : null }, it[1]));
    });
  }
  function go() {
    var route = location.hash.replace(/^#\/?/, '');
    renderNav(route);
    app.textContent = '';
    var parts = route.split('/');
    if (route === 'lindner') viewLindner();
    else if (!bundle) viewLogin();
    else if (parts[0] === 'm' && parts[1]) viewModule(parts[1], parseInt(parts[2] || '0', 10));
    else if (route === 'glossar') viewGlossar();
    else viewHome();
    window.scrollTo(0, 0);
  }

  /* ---------- Öffentliche Seiten ---------- */
  var LINDNER = {
    facts: [['1987', 'gegründet in Aschaffenburg'], ['48', 'Mitarbeitende'], ['4', 'Auszubildende'], ['9,6 Mio. €', 'Jahresumsatz 2025']],
    steckbrief: ['Rechtsform: Kommanditgesellschaft (KG)', 'Geschäftsführerin: Sabine Lindner (Komplementärin)', 'Kommanditist: Herbert Lindner, Firmengründer', 'Sitz: Am Mainufer 12, 63739 Aschaffenburg', 'Showroom: 1.200 m² Ausstellungsfläche', 'Leitbild: „Ihr Büro. Unsere Welt.“'],
    sortiment: ['Hochwertige Büromöbel: Schreibtische, Konferenz- und Empfangsbereiche', 'Ergonomische Bürostühle und höhenverstellbare Tische', 'Büro- und Präsentationstechnik', 'Premium-Schreibwaren und Bürobedarf', 'Service: Büroplanung, Lieferung, Montage, Leasing und Wartung'],
    kunden: ['Premium-Segment: Qualität und Design vor Preis', 'Kanzleien, Arztpraxen, Banken und Agenturen', 'Mittelständische Unternehmen im Rhein-Main-Gebiet', 'Anspruchsvolle Privatkunden mit Homeoffice'],
    org: [['Geschäftsführung', 'Sabine Lindner', 'Assistenz: Petra Vogel'], ['Vertrieb & Beratung', 'Leitung: Markus Weber', '14 Mitarbeitende · Beratung, Angebote, Showroom'], ['Einkauf & Logistik', 'Leitung: Jana Hoffmann', '10 Mitarbeitende · Lieferanten, Lager, Auslieferung'], ['Kundenservice', 'Leitung: Aylin Demir', '8 Mitarbeitende · Telefonzentrale, Reklamationen'], ['Verwaltung & Personal', 'Leitung: Thomas Brandt', '10 Mitarbeitende · Buchhaltung, Personal, Ausbildung'], ['Auszubildende', 'Ausbilder: Thomas Brandt', 'Lena Schneider, Can Yılmaz (2. AJ) · Mia Wagner, Jonas Krüger (1. AJ)']],
    partner: ['Ufficio Moderno S.r.l., Mailand – Lieferant Designmöbel', 'ErgoSit GmbH, Würzburg – Lieferant Bürostühle', 'Kanzlei Hartmann & Partner, Frankfurt – Großkunde', 'Nordic Office AB, Stockholm – Neukunde']
  };
  function ul(items) { return h('ul', { class: 'clean' }, items.map(function (x) { return h('li', null, x); })); }

  function viewLindner() {
    add(app, [
      h('div', { class: 'card' },
        h('img', { src: 'assets/logo_farbig.png', alt: 'Lindner Bürowelt am Main KG', style: 'max-width:340px;width:100%;display:block;margin:0 auto 10px' }),
        h('div', { class: 'stats' }, LINDNER.facts.map(function (f) { return h('div', { class: 'stat' }, h('b', null, f[0]), h('span', null, f[1])); })),
        h('p', { class: 'muted small' }, 'Hohe Erwartungen an Beratung, Service und Kommunikation!')),
      h('div', { class: 'grid' },
        h('div', { class: 'card' }, h('h2', null, 'Steckbrief'), ul(LINDNER.steckbrief)),
        h('div', { class: 'card' }, h('h2', null, 'Unser Sortiment'), ul(LINDNER.sortiment)),
        h('div', { class: 'card' }, h('h2', null, 'Unsere Kunden'), ul(LINDNER.kunden)),
        h('div', { class: 'card' }, h('h2', null, 'Wichtige Geschäftspartner'), ul(LINDNER.partner))),
      h('div', { class: 'card' }, h('h2', null, 'Organisation und Ansprechpartner'),
        h('div', { class: 'org' }, LINDNER.org.map(function (o) { return h('div', null, h('b', null, o[0]), o[1], h('div', { class: 'small muted' }, o[2])); }))),
      h('p', { class: 'muted small' }, 'Alle Namen, Personen und Daten sind frei erfunden.')
    ]);
  }

  function viewLogin(msgText) {
    var input = h('input', { type: 'text', name: 'code', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'Klassencode', 'aria-label': 'Klassencode', required: true });
    var msg = h('div', { role: 'status', 'aria-live': 'polite' });
    var btn = h('button', { class: 'btn', type: 'submit' }, 'Einloggen');
    if (msgText) add(msg, h('p', { class: 'msg bad' }, msgText));
    var form = h('form', { class: 'code-form', onsubmit: function (e) {
      e.preventDefault();
      if (!window.crypto || !crypto.subtle) { msg.textContent = ''; add(msg, h('p', { class: 'msg bad' }, 'Dieser Browser kann die Inhalte nicht entschlüsseln. Bitte öffne die Seite über https in einem aktuellen Browser.')); return; }
      btn.disabled = true; btn.textContent = 'Prüfe …'; msg.textContent = '';
      unlock(input.value).then(function (data) {
        btn.disabled = false; btn.textContent = 'Einloggen';
        if (!data) { add(msg, h('p', { class: 'msg bad' }, 'Dieser Code passt nicht. Bitte prüfe die Schreibweise oder frage deine Lehrkraft.')); return; }
        bundle = data; LS.set('lb_code', normCode(input.value)); location.hash = '#/'; go();
      });
    } }, input, btn);
    add(app, [
      h('div', { class: 'hero' }, h('span', { class: 'tag' }, 'Lernportal'), h('h1', null, 'Willkommen bei der Lindner Bürowelt am Main KG'),
        h('p', null, 'Hier arbeitest du an echten Fällen aus unserem Haus: Mails, Anrufe und Aufträge, dazu Übungen für die Prüfung.')),
      h('div', { class: 'card' }, h('h2', null, 'Mit Klassencode anmelden'),
        h('p', { class: 'muted' }, 'Den Code bekommst du von deiner Lehrkraft. Du brauchst keinen Namen und kein Konto.'), form, msg),
      h('div', { class: 'card' }, h('h2', null, 'Wer ist Lindner?'),
        h('p', null, 'Die Lindner Bürowelt am Main KG ist unser Modellunternehmen: ein Fachhändler für Büromöbel und Büroausstattung in Aschaffenburg.'),
        h('a', { class: 'btn sec', href: '#/lindner' }, 'Unternehmen kennenlernen'))
    ]);
  }

  /* ---------- Start (angemeldet) ---------- */
  function viewHome() {
    var p = totalPoints();
    add(app, h('div', { class: 'hero' }, h('span', { class: 'tag' }, bundle.short), h('h1', null, bundle.title), h('p', null, bundle.role)));
    add(app, h('div', { class: 'card' }, h('h2', null, 'Unser Weg durch ' + bundle.short),
      h('ol', { class: 'road' }, bundle.road.map(function (r) { return h('li', { class: r.s || null }, (r.s === 'done' ? '✓ ' : '') + r.t); })),
      h('p', { class: 'small muted', style: 'margin:12px 0 0' }, 'Deine Punkte auf diesem Gerät: ', h('strong', null, String(p)))));
    add(app, h('h2', null, 'Postfach: deine Aufträge'));
    bundle.modules.forEach(function (m) {
      if (locked(m)) {
        add(app, h('div', { class: 'mod locked' }, h('div', { class: 'ico', 'aria-hidden': 'true' }, '🔒'),
          h('div', null, h('h3', null, m.title), h('p', null, 'Wird am ' + fmtDate(m.ab) + ' freigeschaltet.'))));
        return;
      }
      var pr = modProgress(m);
      add(app, h('a', { class: 'mod', href: '#/m/' + m.id }, h('div', { class: 'ico', 'aria-hidden': 'true' }, m.icon || '📁'),
        h('div', { style: 'flex:1' },
          h('div', null, h('span', { class: 'pill o' }, m.tag), pr >= 1 ? h('span', { class: 'pill g' }, 'erledigt') : null),
          h('h3', null, m.title), h('p', null, m.intro),
          h('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(pr * 100)), 'aria-label': 'Fortschritt' }, h('i', { style: 'width:' + Math.round(pr * 100) + '%' })))));
    });
    add(app, h('div', { class: 'row', style: 'margin-top:18px' },
      h('a', { class: 'btn sec', href: '#/glossar' }, 'Glossar öffnen'),
      h('button', { class: 'btn ghost', onclick: function () { LS.del('lb_code'); bundle = null; location.hash = '#/'; go(); } }, 'Abmelden'),
      h('button', { class: 'btn ghost', onclick: function () { if (confirm('Lernstand auf diesem Gerät wirklich löschen?')) { LS.del(pkey()); go(); } } }, 'Lernstand löschen')));
  }

  /* ---------- Modul ---------- */
  function viewModule(id, idx) {
    var m = bundle.modules.filter(function (x) { return x.id === id; })[0];
    if (!m || locked(m)) { location.hash = '#/'; return; }
    if (isNaN(idx) || idx < 0 || idx >= m.steps.length) idx = 0;
    var s = m.steps[idx];
    add(app, h('p', { class: 'small' }, h('a', { href: '#/' }, '← Postfach'), ' · ', m.title));
    add(app, h('div', { class: 'stepper', 'aria-hidden': 'true' }, m.steps.map(function (_, i) { return h('i', { class: i === idx ? 'cur' : (isDone(m.id, i) ? 'done' : null) }); })));
    var box = h('section', { class: 'card' }, h('div', { class: 'kicker' }, 'Schritt ' + (idx + 1) + ' von ' + m.steps.length + (s.k ? ' · ' + s.k : '')), s.title ? h('h2', null, s.title) : null, s.lead ? h('p', { html: s.lead }) : null);
    add(app, box);
    var done = function (pts, max) { setDone(m.id, idx, pts || 0, max || 0); };
    (RENDER[s.t] || RENDER.info)(s, box, done, m.id + ':' + idx);
    if (!INTERACTIVE[s.t]) done(0, 0);
    add(app, h('div', { class: 'stepnav' },
      idx > 0 ? h('a', { class: 'btn sec', href: '#/m/' + m.id + '/' + (idx - 1) }, '← Zurück') : h('span'),
      idx < m.steps.length - 1 ? h('a', { class: 'btn', href: '#/m/' + m.id + '/' + (idx + 1) }, 'Weiter →') : h('a', { class: 'btn', href: '#/' }, 'Fertig ✓')));
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

  /* ---------- Glossar ---------- */
  function viewGlossar() {
    var terms = bundle.glossary.slice().sort(function (a, b) { return a.b.localeCompare(b.b, 'de'); });
    var list = h('dl', { class: 'gl' }), mode = 'list', area = h('div');
    function draw(filter) {
      list.textContent = '';
      var f = (filter || '').toLowerCase(), hits = terms.filter(function (t) { return !f || (t.b + ' ' + t.d).toLowerCase().indexOf(f) >= 0; });
      hits.forEach(function (t) { add(list, h('div', null, h('dt', null, t.b), h('dd', null, t.d))); });
      if (!hits.length) add(list, h('p', { class: 'muted' }, 'Kein Begriff gefunden.'));
    }
    function cards() {
      var deck = shuffle(terms), i = 0, back = false;
      var card = h('button', { class: 'flash', type: 'button', 'aria-live': 'polite', onclick: function () { back = !back; paint(); } });
      var count = h('p', { class: 'small muted', style: 'text-align:center' });
      function paint() { card.className = 'flash' + (back ? ' back' : ''); card.textContent = back ? deck[i].d : deck[i].b; count.textContent = 'Karte ' + (i + 1) + ' von ' + deck.length + ' · Tippe zum Umdrehen'; }
      paint();
      return [card, count, h('div', { class: 'stepnav' },
        h('button', { class: 'btn sec', type: 'button', onclick: function () { i = (i - 1 + deck.length) % deck.length; back = false; paint(); } }, '← Zurück'),
        h('button', { class: 'btn', type: 'button', onclick: function () { i = (i + 1) % deck.length; back = false; paint(); } }, 'Nächste →'))];
    }
    function paintMode() {
      area.textContent = '';
      if (mode === 'list') { var s = h('input', { class: 'search', type: 'search', placeholder: 'Begriff suchen …', 'aria-label': 'Begriff suchen', oninput: function () { draw(s.value); } }); add(area, [s, list]); draw(''); }
      else add(area, cards());
    }
    add(app, [h('h1', null, 'Glossar ' + bundle.short),
      h('div', { class: 'row', style: 'margin-bottom:14px' },
        h('button', { class: 'btn sec', type: 'button', onclick: function () { mode = 'list'; paintMode(); } }, 'Liste'),
        h('button', { class: 'btn sec', type: 'button', onclick: function () { mode = 'cards'; paintMode(); } }, 'Lernkarten')), area]);
    paintMode();
  }

  /* ---------- Start ---------- */
  window.addEventListener('hashchange', go);
  var saved = LS.get('lb_code', null);
  if (saved && window.crypto && crypto.subtle) {
    unlock(saved).then(function (data) { if (data) bundle = data; else LS.del('lb_code'); go(); }, function () { go(); });
  } else go();
})();
