/* ===================================================================
   COMPANY IN FOCUS: ARCHIVE. This is the ONLY place you edit.
   Add a new entry at the top whenever a new company goes into focus,
   and set the old one to status "past" with an end date and outcome.
   Newest entries are shown first automatically.

   Fields:
     company   name shown in bold
     ticker    e.g. "NASDAQ: MRNA"
     status    "current" or "past"
     from      "YYYY-MM" when it went into focus
     to        "YYYY-MM" when it left focus ("" while current)
     why       1-2 sentences: why it caught our attention
     outcome   1-2 sentences: what happened. Facts, never a buy/sell view.
               Leave "" while it is still current.
     link      page to read more (markets.html while current,
               an Insights article later), or ""
   =================================================================== */
const focusArchive = [
  {
    company: "Moderna",
    ticker: "NASDAQ: MRNA",
    status: "current",
    from: "2026-10",
    to: "",
    why: "Phase 3 data showed its personalised mRNA cancer vaccine, used with Keytruda, lowered the risk of melanoma returning. The shares more than doubled in a day.",
    outcome: "",
    link: "/markets/"
  }
];

(function () {
  var grid = document.getElementById('focus-archive-grid');
  if (!grid) return;
  var M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmt(ym) { if (!ym) return ''; var p = ym.split('-'); return M[+p[1] - 1] + ' ' + p[0]; }
  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }

  var items = focusArchive.slice().sort(function (a, b) {
    if (a.status !== b.status) return a.status === 'current' ? -1 : 1;
    return (b.from || '').localeCompare(a.from || '');
  });

  grid.innerHTML = items.map(function (f) {
    var current = f.status === 'current';
    var period = fmt(f.from) + ' – ' + (current ? 'today' : fmt(f.to));
    return '' +
      '<article class="focus-card' + (current ? ' is-current' : '') + '">' +
        '<div class="focus-card-top">' +
          '<span class="focus-status">' + (current ? 'Current focus' : 'Past focus') + '</span>' +
          '<span class="focus-period">' + esc(period) + '</span>' +
        '</div>' +
        '<h3>' + esc(f.company) + ' <span class="focus-ticker">' + esc(f.ticker) + '</span></h3>' +
        '<div class="focus-label">Why we watched</div>' +
        '<p>' + esc(f.why) + '</p>' +
        '<div class="focus-label">What happened</div>' +
        '<p>' + (f.outcome ? esc(f.outcome) : '<em>Still unfolding.</em>') + '</p>' +
        (f.link ? '<a class="card-link" href="' + esc(f.link) + '">' + (current ? 'Follow it on Markets' : 'Read more') + ' →</a>' : '') +
      '</article>';
  }).join('') +
  '<div class="focus-card focus-card-next">' +
    '<span class="coming-soon-pill">Next</span>' +
    '<p>The next company goes here once something catches our attention.</p>' +
  '</div>';
})();
