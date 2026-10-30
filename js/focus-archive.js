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
     until     optional, current only: "YYYY-MM-DD" planned end of the focus.
               Shows "Time frame" on the card and an "Event ends soon" tag
               in the last 14 days. The "why" text is not shown on the current card.
     why       1-2 sentences: why it caught our attention
     homeTitle / homeText  optional: shorter wording for the homepage card
     chart     optional, for past companies: frozen chart image of the focus period,
               e.g. "/assets/charts/moderna-support-levels.png". Current companies
               get a live chart automatically.
     outcome   1-2 sentences: what happened. Facts, never a buy/sell view.
               Leave "" while it is still current.
     link      page to read more (markets.html while current,
               an Insights article later), or ""
     analysis  optional "Explore our analysis" box next to the card, one
               entry per key date (opens on click):
               [{ date: "Sat, 24 Oct", event: "...", text: "...",
                  url: "/insights/..." or "" for not written yet }]
   =================================================================== */
const focusArchive = [
  {
    company: "Moderna",
    ticker: "NASDAQ: MRNA",
    status: "current",
    from: "2026-10",
    to: "",
    until: "2026-11-06",
    why: "Phase 3 data showed its personalised mRNA cancer vaccine, used with Keytruda, lowered the risk of melanoma returning. The shares more than doubled in a day.",
    homeTitle: "A stock that can move double digits on one headline.",
    homeText: "Its price rests on the cancer vaccine pipeline, so trial data and earnings can swing it sharply in either direction.",
    outcome: "",
    link: "/markets/",
    analysis: [
      {
        id: "analysis-esmo-2026",
        date: "Sat, 24 Oct",
        event: "Phase 3 melanoma data at ESMO",
        text: "The vaccine works. Saturday shows how well. A plain-language look at the number to watch and what is already priced in.",
        url: "/insights/insight-05-moderna-hazard-ratio.html"
      },
      {
        id: "analysis-q3-2026",
        date: "Fri, 6 Nov",
        event: "Q3 2026 results",
        text: "Our look at the quarter follows after the results.",
        url: ""
      }
    ]
  }
];

(function () {
  var grid = document.getElementById('focus-archive-grid');
  if (!grid) return;
  var M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmt(ym) { if (!ym) return ''; var p = ym.split('-'); return M[+p[1] - 1] + ' ' + p[0]; }
  var MF = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  function dmy(d) { var p = d.split('-'); return p[2] + '. ' + MF[+p[1] - 1] + ' ' + p[0]; }
  function endsSoon(d) {
    var end = new Date(d + 'T23:59:59'), now = new Date();
    var days = (end - now) / 864e5;
    return days >= 0 && days <= 14;
  }
  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }

  var items = focusArchive.slice().sort(function (a, b) {
    if (a.status !== b.status) return a.status === 'current' ? -1 : 1;
    return (b.from || '').localeCompare(a.from || '');
  });

  grid.innerHTML = items.map(function (f) {
    var current = f.status === 'current';
    var period = fmt(f.from) + ' – ' + (current ? (f.until ? dmy(f.until) : 'today') : fmt(f.to));
    var compact = current && f.until;
    var hasA = !!(f.analysis && f.analysis.length);
    var panelId = 'analysis-' + String(f.company).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return '' +
      '<article class="focus-card' + (current ? ' is-current' : '') + (hasA ? ' has-analysis' : '') + '"' +
        (hasA ? ' data-panel="' + panelId + '"' : '') + '>' +
        '<div class="focus-card-top">' +
          '<span class="focus-status">' + (current ? 'Current focus' : 'Past focus') + '</span>' +
          (compact ? '' : '<span class="focus-period">' + esc(period) + '</span>') +
        '</div>' +
        '<h3>' + esc(f.company) + ' <span class="focus-ticker">' + esc(f.ticker) + '</span></h3>' +
        (compact
          ? '<div class="focus-label">Time frame</div><p class="focus-timeframe">' + esc(period) + '</p>'
          : '<div class="focus-label">Why we watched</div><p>' + esc(f.why) + '</p>') +
        (f.outcome || !current ? '<div class="focus-label">What happened</div>' +
          '<p>' + (f.outcome ? esc(f.outcome) : '<em>Still unfolding.</em>') + '</p>' : '') +
        (hasA ? '<div class="focus-actions"><button type="button" class="focus-toggle" aria-expanded="false" aria-controls="' + panelId + '">Explore our analysis <span class="focus-toggle-icon" aria-hidden="true">+</span></button>' +
          (compact && endsSoon(f.until) ? '<span class="focus-ends-soon">Event ends soon</span>' : '') + '</div>' : '') +
        (f.link && !hasA ? '<a class="card-link" href="' + esc(f.link) + '">' + (current ? 'Follow it on Markets' : 'Read more') + ' →</a>' : '') +
      '</article>' +
      (f.analysis && f.analysis.length ?
        '<div class="focus-analysis" id="' + panelId + '" hidden>' +
          '<div class="focus-label">' + esc(f.company) + ', by key date</div>' +
          f.analysis.map(function (a) {
            return '<details class="focus-analysis-item"' + (a.id ? ' id="' + esc(a.id) + '"' : '') + '>' +
              '<summary><span class="fa-date">' + esc(a.date) +
                (a.url ? '<span class="research-badge fa-pill">Own market research</span>' : '<span class="fa-pill fa-pill-soon">Coming</span>') +
              '</span><span class="fa-event">' + esc(a.event) + '</span></summary>' +
              '<div class="fa-body"><p>' + esc(a.text) + '</p>' +
              (a.url ? '<a class="fa-link" href="' + esc(a.url) + '">Read the analysis →</a>' : '<span class="fa-soon">Coming soon</span>') +
              '</div></details>';
          }).join('') +
          (f.link ? '<a class="fa-more" href="' + esc(f.link) + '">' + (current ? 'Live chart and key dates on Markets' : 'Read more') + ' →</a>' : '') +
        '</div>' : '');
  }).join('') +
  '<div class="focus-card focus-card-next">' +
    '<span class="coming-soon-pill">Next</span>' +
    '<p>The next company goes here once something catches our attention.</p>' +
  '</div>';

  // The company card opens and closes its "Explore our analysis" panel
  function setPanel(card, open) {
    var panel = document.getElementById(card.getAttribute('data-panel'));
    var btn = card.querySelector('.focus-toggle');
    if (!panel) return;
    panel.hidden = !open;
    card.classList.toggle('is-expanded', open);
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.classList.remove('is-unfolding');
    if (open) { void panel.offsetWidth; panel.classList.add('is-unfolding'); }
  }
  grid.addEventListener('click', function (e) {
    var card = e.target.closest('.focus-card.has-analysis');
    if (!card || e.target.closest('a')) return;
    if (String(window.getSelection ? window.getSelection() : '').length) return;
    e.preventDefault(); // keeps the generic card click from opening Markets
    setPanel(card, !card.classList.contains('is-expanded'));
  });

  // Current focus: card and analysis panel are both open by default
  grid.querySelectorAll('.focus-card.is-current.has-analysis').forEach(function (card) {
    setPanel(card, true);
    var panel = document.getElementById(card.getAttribute('data-panel'));
    if (panel) panel.classList.remove('is-unfolding');
  });

  // Opened from a link like /insights/#analysis-q3-2026: show the panel, unfold that date
  function openFromHash() {
    var id = decodeURIComponent((location.hash || '').slice(1));
    var el = id && document.getElementById(id);
    if (el && el.tagName === 'DETAILS') {
      var panel = el.closest('.focus-analysis');
      var card = panel && grid.querySelector('[data-panel="' + panel.id + '"]');
      if (card) setPanel(card, true);
      el.open = true;
      // after layout settles, scroll so the box sits below the sticky menu
      setTimeout(function () {
        var box = panel || el;
        var y = box.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: y < 0 ? 0 : y });
      }, 250);
    }
  }
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
})();
