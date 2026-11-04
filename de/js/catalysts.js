/* ===================================================================
   DATES TO WATCH — this is the ONLY place you edit to add an event.
   Order doesn't matter: the list sorts itself by date, and events
   disappear automatically the day after they happen.

   Fields:
     date      "YYYY-MM-DD"
     time      Zurich time as "HH:MM" (CET/CEST is added automatically), or "" if not announced yet
     company   name shown in bold
     ticker    e.g. "NASDAQ: MRNA"
     type      short label for the pill: "Earnings", "Data readout",
               "Investor event", "Central bank", "Macro data", ...
     impact    "high", "medium" or "low": how much the event can move
               the stock. Sets the colour of the card.
     title     one line: what happens
     why       one sentence: what happens.
     points    2-3 short key points: why it gets its impact tier.
               Describe the event, never tell readers to buy or sell.
     source    link to the company's own announcement
     link      optional: our own page on this event. Makes the whole card
               clickable (it grows slightly on hover).
   =================================================================== */
const catalysts = [
  {
    date: "2026-10-24",
    time: "16:30",
    company: "Moderna",
    ticker: "NASDAQ: MRNA",
    type: "Studiendaten",
    impact: "high",
    title: "Phase-3-Daten zum Melanom-Impfstoff, ESMO",
    why: "",
    points: [
      "Die Bewertung hängt an dieser Pipeline",
      "Vollständige Daten: Grösse und Dauer des Effekts",
      "Allein die Schlagzeile im August: +177% an einem Tag"
    ],
    source: "https://www.newswire.com/news/moderna-announces-late-breaking-data-to-be-presented-at-esmo-congress-2026",
    link: "/de/insights/insight-05-moderna-hazard-ratio.html"
  },
  {
    date: "2026-10-24",
    time: "19:00",
    company: "Moderna",
    ticker: "NASDAQ: MRNA",
    type: "Investorenanlass",
    impact: "low",
    title: "Investoren-Webcast zu den Daten",
    why: "",
    points: [
      "Daten bis dahin bereits öffentlich",
      "Im Blick: Zeitplan für Zulassung und Markteinführung"
    ],
    source: "https://www.newswire.com/news/moderna-announces-late-breaking-data-to-be-presented-at-esmo-congress-2026",
    link: "/de/insights/insight-05-moderna-hazard-ratio.html"
  },
  {
    date: "2026-11-06",
    time: "14:00",
    company: "Moderna",
    ticker: "NASDAQ: MRNA",
    type: "Quartalszahlen",
    impact: "medium",
    title: "Q3-2026-Ergebnisse und Telefonkonferenz",
    why: "",
    points: [
      "Umsatz klein und weitgehend vorhersehbar",
      "Im Blick: Geldverbrauch und Ausblick"
    ],
    source: "https://www.newswire.com/news/moderna-to-report-third-quarter-2026-financial-results-on-friday-november-6-2026",
    link: "/de/insights/#analysis-q3-2026"
  }
];

/* ------------------------------------------------------------------
   Rendering — no need to touch anything below this line.
   ------------------------------------------------------------------ */
(function () {
  var list = document.getElementById('catalystList');
  if (!list) return;

  var MONTHS = ['Jan.','Feb.','März','Apr.','Mai','Juni','Juli','Aug.','Sept.','Okt.','Nov.','Dez.'];
  var DAYS = ['So','Mo','Di','Mi','Do','Fr','Sa'];

  var IMPACT = { high: 'Hoher Einfluss', medium: 'Mittlerer Einfluss', low: 'Tiefer Einfluss' };

  var today = new Date();
  today.setHours(0, 0, 0, 0);

  function parse(d) {
    var p = d.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  var upcoming = catalysts
    .map(function (c) { return Object.assign({}, c, { _d: parse(c.date) }); })
    .filter(function (c) { return c._d >= today; })
    .sort(function (a, b) {
      return a._d - b._d || (a.time || '99').localeCompare(b.time || '99');
    });

  if (!upcoming.length) {
    list.innerHTML = '<p class="catalyst-empty">Derzeit stehen keine Termine an. Neue kommen dazu, sobald Unternehmen sie ankündigen.</p>';
    return;
  }

  // Official Zurich time zone for that date: CEST in summer, CET in winter
  function zurichZone(dateStr) {
    try {
      var parts = new Intl.DateTimeFormat('de-CH', { timeZone: 'Europe/Zurich', timeZoneName: 'short' })
        .formatToParts(new Date(dateStr + 'T12:00:00Z'));
      var z = parts.filter(function (x) { return x.type === 'timeZoneName'; })[0];
      return z ? ' ' + z.value : '';
    } catch (e) { return ''; }
  }

  list.innerHTML = upcoming.map(function (c) {
    var days = Math.round((c._d - today) / 86400000);
    var countdown = days === 0 ? 'Heute' : days === 1 ? 'Morgen' : 'In ' + days + ' Tagen';
    var impact = IMPACT[c.impact] ? c.impact : 'medium';
    var when = DAYS[c._d.getDay()] + (c.time ? ' ' + esc(c.time) + zurichZone(c.date) : ' · Zeit folgt');

    return '' +
      '<article class="catalyst impact-' + impact + (days <= 7 ? ' is-soon' : '') + (c.link ? ' has-link' : '') + '"' +
        (c.link ? ' data-href="' + esc(c.link) + '" tabindex="0" role="link" aria-label="' + esc(c.title) + ': Analyse lesen"' : '') + '>' +
        '<div class="catalyst-date">' +
          '<span class="catalyst-day">' + c._d.getDate() + '</span>' +
          '<span class="catalyst-month">' + MONTHS[c._d.getMonth()] + '</span>' +
        '</div>' +
        '<div class="catalyst-body">' +
          '<div class="catalyst-meta">' +
            '<span class="impact-pill">' + IMPACT[impact] + '</span>' +
            '<span class="catalyst-pill">' + esc(c.type) + '</span>' +
            '<span class="catalyst-when">' + when + '</span>' +
          '</div>' +
          '<h3>' + esc(c.title) + '</h3>' +
          (c.why ? '<p>' + esc(c.why) + '</p>' : '') +
          (c.points && c.points.length
            ? '<ul class="catalyst-points">' + c.points.map(function (pt) { return '<li>' + esc(pt) + '</li>'; }).join('') + '</ul>'
            : '') +
          (c.source ? '<a class="catalyst-src" href="' + esc(c.source) + '" target="_blank" rel="noopener">Quelle ↗</a>' : '') +
        '</div>' +
        '<div class="catalyst-countdown">' + countdown + '</div>' +
      '</article>';
  }).join('');

  // Cards with our own page: whole card opens it (the Source link keeps working)
  function go(card, e) {
    var href = card.getAttribute('data-href');
    if (!href) return;
    if (e && (e.metaKey || e.ctrlKey)) window.open(href, '_blank', 'noopener');
    else window.location.href = href;
  }
  list.addEventListener('click', function (e) {
    var card = e.target.closest('.catalyst.has-link');
    if (!card || e.target.closest('a')) return;
    if (String(window.getSelection ? window.getSelection() : '').length) return;
    go(card, e);
  });
  list.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var card = e.target.closest('.catalyst.has-link');
    if (card && e.target === card) go(card, e);
  });
})();
