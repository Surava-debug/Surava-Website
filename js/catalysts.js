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
     outcome   optional, 1-2 short points: what actually happened. Shown instead
               of "points" in a past-focus box (a list with data-past="Company"
               shows that company's past dates, oldest first).
   =================================================================== */
const catalysts = [
  {
    date: "2026-10-22",
    time: "18:30",
    company: "Moderna",
    ticker: "NASDAQ: MRNA",
    type: "Data leak",
    impact: "high",
    title: "Phase 3 data leaked two days early",
    why: "",
    points: [],
    outcome: [
      "Results appeared on a medical news site before the embargo",
      "Stock fell up to 26% intraday and closed about 17% lower"
    ],
    source: "",
    link: "/insights/insight-06-moderna-conclusion.html"
  },
  {
    date: "2026-11-12",
    time: "",
    company: "Moderna",
    ticker: "NASDAQ: MRNA",
    type: "Investor event",
    impact: "medium",
    title: "Analyst Day",
    why: "",
    points: [],
    outcome: [
      "Cash costs rise again from 2027, to around $4 billion a year",
      "No revenue target for 2027; the stock fell 7% that day"
    ],
    source: "https://investors.modernatx.com",
    link: "/insights/insight-07-moderna-q3-earnings.html"
  },
  {
    date: "2026-10-24",
    time: "16:30",
    company: "Moderna",
    ticker: "NASDAQ: MRNA",
    type: "Data readout",
    impact: "high",
    title: "Phase 3 melanoma vaccine data, ESMO",
    why: "",
    points: [
      "Valuation rests on this pipeline",
      "Full data: size and durability of the effect",
      "August headline alone: +177% in a day"
    ],
    outcome: [
      "Official data matched the leak: 42% lower risk of recurrence or death",
      "The price reaction had already happened on 22 October"
    ],
    source: "https://www.newswire.com/news/moderna-announces-late-breaking-data-to-be-presented-at-esmo-congress-2026",
    link: "/insights/insight-05-moderna-hazard-ratio.html"
  },
  {
    date: "2026-10-24",
    time: "19:00",
    company: "Moderna",
    ticker: "NASDAQ: MRNA",
    type: "Investor event",
    impact: "low",
    title: "Investor webcast on the data",
    why: "",
    points: [
      "Data already public by then",
      "Watch: approval and launch timeline"
    ],
    source: "https://www.newswire.com/news/moderna-announces-late-breaking-data-to-be-presented-at-esmo-congress-2026",
    link: "/insights/insight-05-moderna-hazard-ratio.html"
  },
  {
    date: "2026-11-06",
    time: "14:00",
    company: "Moderna",
    ticker: "NASDAQ: MRNA",
    type: "Earnings",
    impact: "medium",
    title: "Q3 2026 results and call",
    why: "",
    points: [
      "Revenue small and mostly predictable",
      "Watch: cash burn and guidance"
    ],
    outcome: [
      "Surprise profit: $0.38 per share vs. an expected loss of about $1.10",
      "Revenue $1.31 billion, 2026 growth target raised to 15-25%"
    ],
    source: "https://www.newswire.com/news/moderna-to-report-third-quarter-2026-financial-results-on-friday-november-6-2026",
    link: "/insights/insight-07-moderna-q3-earnings.html"
  }
];

/* ------------------------------------------------------------------
   Rendering — no need to touch anything below this line.
   ------------------------------------------------------------------ */
(function () {
  var list = document.getElementById('catalystList');
  if (!list) return;
  // data-past="Company": show that company's past dates (past-focus box)
  var pastCo = list.getAttribute('data-past');

  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  var IMPACT = { high: 'High impact', medium: 'Medium impact', low: 'Low impact' };

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
    .filter(function (c) { return pastCo ? c.company === pastCo && c._d < today : c._d >= today; })
    .sort(function (a, b) {
      return a._d - b._d || (a.time || '99').localeCompare(b.time || '99');
    });

  if (!upcoming.length) {
    list.innerHTML = '<p class="catalyst-empty">No dates on the list right now. New ones are added as companies announce them.</p>';
    return;
  }

  // Official Zurich time zone for that date: CEST in summer, CET in winter
  function zurichZone(dateStr) {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', timeZoneName: 'short' })
        .formatToParts(new Date(dateStr + 'T12:00:00Z'));
      var z = parts.filter(function (x) { return x.type === 'timeZoneName'; })[0];
      return z ? ' ' + z.value : '';
    } catch (e) { return ''; }
  }

  list.innerHTML = upcoming.map(function (c) {
    var days = Math.round((c._d - today) / 86400000);
    var countdown = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : 'In ' + days + ' days';
    var impact = IMPACT[c.impact] ? c.impact : 'medium';
    var when = DAYS[c._d.getDay()] + (c.time ? ' ' + esc(c.time) + zurichZone(c.date) : ' · time TBC');
    if (pastCo) {
      countdown = 'Past';
      if (!c.time) when = DAYS[c._d.getDay()];
    }
    var pts = pastCo && c.outcome && c.outcome.length ? c.outcome : c.points;

    return '' +
      '<article class="catalyst impact-' + impact + (!pastCo && days <= 7 ? ' is-soon' : '') + (c.link ? ' has-link' : '') + '"' +
        (c.link ? ' data-href="' + esc(c.link) + '" tabindex="0" role="link" aria-label="' + esc(c.title) + ': read our analysis"' : '') + '>' +
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
          (pts && pts.length
            ? '<ul class="catalyst-points">' + pts.map(function (pt) { return '<li>' + esc(pt) + '</li>'; }).join('') + '</ul>'
            : '') +
          (pastCo && c.link ? '<a class="catalyst-read" href="' + esc(c.link) + '">Read our analysis →</a>' : '') +
          (c.source ? '<a class="catalyst-src" href="' + esc(c.source) + '" target="_blank" rel="noopener">Source ↗</a>' : '') +
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
