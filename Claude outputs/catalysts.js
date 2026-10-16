/* ===================================================================
   DATES TO WATCH — this is the ONLY place you edit to add an event.
   Order doesn't matter: the list sorts itself by date, and events
   disappear automatically the day after they happen.

   Fields:
     date      "YYYY-MM-DD"
     time      Zurich time as "HH:MM", or "" if not announced yet
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
   =================================================================== */
const catalysts = [
  {
    date: "2026-10-24",
    time: "16:30",
    company: "Moderna",
    ticker: "NASDAQ: MRNA",
    type: "Data readout",
    impact: "high",
    title: "Phase 3 melanoma vaccine data at ESMO (Madrid)",
    why: "Full Phase 3 results for intismeran, the personalised cancer vaccine developed with Merck.",
    points: [
      "The valuation rests on the cancer pipeline, not on today's sales",
      "August was only a headline; this shows how big the effect is and how long it lasts",
      "The August headline alone moved the stock about 177% in a day"
    ],
    source: "https://www.newswire.com/news/moderna-announces-late-breaking-data-to-be-presented-at-esmo-congress-2026"
  },
  {
    date: "2026-10-24",
    time: "19:00",
    company: "Moderna",
    ticker: "NASDAQ: MRNA",
    type: "Investor event",
    impact: "low",
    title: "Investor webcast on the ESMO data",
    why: "Management discusses the melanoma results and the wider oncology pipeline.",
    points: [
      "Comes a few hours after the data is already public",
      "Mostly explains results the market has just seen",
      "Watch for approval timelines and launch plans"
    ],
    source: "https://www.newswire.com/news/moderna-announces-late-breaking-data-to-be-presented-at-esmo-congress-2026"
  },
  {
    date: "2026-11-06",
    time: "14:00",
    company: "Moderna",
    ticker: "NASDAQ: MRNA",
    type: "Earnings",
    impact: "medium",
    title: "Q3 2026 results and conference call",
    why: "Third-quarter numbers and the first report since joining the Nasdaq-100.",
    points: [
      "Revenue is small and largely predictable from seasonal vaccine sales",
      "Arrives two weeks after ESMO, when the big news is already priced in",
      "Can still move the stock on cash burn, cost cuts or guidance"
    ],
    source: "https://www.newswire.com/news/moderna-to-report-third-quarter-2026-financial-results-on-friday-november-6-2026"
  }
];

/* ------------------------------------------------------------------
   Rendering — no need to touch anything below this line.
   ------------------------------------------------------------------ */
(function () {
  var list = document.getElementById('catalystList');
  if (!list) return;

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
    .filter(function (c) { return c._d >= today; })
    .sort(function (a, b) {
      return a._d - b._d || (a.time || '99').localeCompare(b.time || '99');
    });

  if (!upcoming.length) {
    list.innerHTML = '<p class="catalyst-empty">No dates on the list right now. New ones are added as companies announce them.</p>';
    return;
  }

  list.innerHTML = upcoming.map(function (c) {
    var days = Math.round((c._d - today) / 86400000);
    var countdown = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : 'In ' + days + ' days';
    var impact = IMPACT[c.impact] ? c.impact : 'medium';
    var when = DAYS[c._d.getDay()] + (c.time ? ' · ' + esc(c.time) + ' Zurich' : ' · time TBC');

    return '' +
      '<article class="catalyst impact-' + impact + (days <= 7 ? ' is-soon' : '') + '">' +
        '<div class="catalyst-date">' +
          '<span class="catalyst-day">' + c._d.getDate() + '</span>' +
          '<span class="catalyst-month">' + MONTHS[c._d.getMonth()] + '</span>' +
        '</div>' +
        '<div class="catalyst-body">' +
          '<div class="catalyst-meta">' +
            '<span class="impact-pill">' + IMPACT[impact] + '</span>' +
            '<span class="catalyst-pill">' + esc(c.type) + '</span>' +
            '<span class="catalyst-company">' + esc(c.company) + '</span>' +
            '<span class="catalyst-ticker">' + esc(c.ticker) + '</span>' +
          '</div>' +
          '<h3>' + esc(c.title) + '</h3>' +
          '<p>' + esc(c.why) + '</p>' +
          (c.points && c.points.length
            ? '<ul class="catalyst-points">' + c.points.map(function (pt) { return '<li>' + esc(pt) + '</li>'; }).join('') + '</ul>'
            : '') +
          '<div class="catalyst-foot">' +
            '<span>' + when + '</span>' +
            (c.source ? '<a href="' + esc(c.source) + '" target="_blank" rel="noopener">Company announcement ↗</a>' : '') +
          '</div>' +
        '</div>' +
        '<div class="catalyst-countdown">' + countdown + '</div>' +
      '</article>';
  }).join('');
})();
