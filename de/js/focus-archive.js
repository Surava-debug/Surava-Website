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
               e.g. "/assets/charts/de/moderna-support-levels.png". Current companies
               get a live chart automatically.
     outcome   1-2 sentences: what happened. Facts, never a buy/sell view.
               Leave "" while it is still current.
     link      page to read more (markets.html while current,
               an Insights article later), or ""
     analysis  optional "Explore our analysis" box next to the card, one
               entry per key date (opens on click):
               [{ date: "Sat, 24 Oct", event: "...", text: "...",
                  url: "/insights/..." or "" for not written yet,
                  conclusion: true once the article's conclusion is published
                              (button then reads "Read the analysis & the conclusion") }]
   =================================================================== */
const focusArchive = [
  {
    company: "Moderna",
    ticker: "NASDAQ: MRNA",
    priceData: "/data/prices/mrna-1d.json",
    status: "current",
    from: "2026-10",
    to: "",
    until: "2026-11-06",
    why: "Phase-3-Daten zeigten, dass der personalisierte mRNA-Krebsimpfstoff zusammen mit Keytruda das Risiko senkte, dass ein Melanom zurückkehrt. Die Aktie hat sich an einem Tag mehr als verdoppelt.",
    homeTitle: "Eine Aktie, die sich mit einer einzigen Schlagzeile zweistellig bewegen kann.",
    homeText: "Ihr Kurs hängt an der Krebsimpfstoff-Pipeline, deshalb können Studiendaten und Quartalszahlen ihn stark in beide Richtungen bewegen.",
    outcome: "",
    link: "/de/markets/",
    analysis: [
      {
        id: "analysis-esmo-2026",
        date: "Sa, 24. Okt.",
        event: "Phase-3-Melanomdaten am ESMO",
        text: "Der Impfstoff wirkt, aber wie gut? Unser verständlicher Blick vor den Daten und unser Fazit danach.",
        url: "/de/insights/insight-05-moderna-hazard-ratio.html",
        conclusion: true
      },
      {
        id: "analysis-q3-2026",
        date: "Fr, 6. Nov.",
        event: "Q3-2026-Ergebnisse",
        text: "Unser Blick aufs Quartal folgt nach den Ergebnissen.",
        url: ""
      }
    ]
  }
];

(function () {
  var grid = document.getElementById('focus-archive-grid');
  if (!grid) return;
  var M = ['Jan.','Feb.','März','Apr.','Mai','Juni','Juli','Aug.','Sept.','Okt.','Nov.','Dez.'];
  function fmt(ym) { if (!ym) return ''; var p = ym.split('-'); return M[+p[1] - 1] + ' ' + p[0]; }
  var MF = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  function dmy(d) { var p = d.split('-'); return +p[2] + '. ' + MF[+p[1] - 1] + ' ' + p[0]; }
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
    var period = fmt(f.from) + ' – ' + (current ? (f.until ? dmy(f.until) : 'heute') : fmt(f.to));
    var compact = current && f.until;
    var hasA = !!(f.analysis && f.analysis.length);
    var panelId = 'analysis-' + String(f.company).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return '' +
      '<article class="focus-card' + (current ? ' is-current' : '') + (hasA ? ' has-analysis' : '') + (f.priceData ? ' has-chart' : '') + '"' +
        (hasA ? ' data-panel="' + panelId + '"' : '') + (f.priceData ? ' data-chart="' + esc(f.priceData) + '"' : '') + '>' +
        (f.priceData ? '<span class="focus-chart-bg" aria-hidden="true"></span>' : '') +
        '<div class="focus-card-top">' +
          '<span class="focus-status">' + (current ? 'Aktueller Fokus' : 'Früherer Fokus') + '</span>' +
          (compact ? '' : '<span class="focus-period">' + esc(period) + '</span>') +
        '</div>' +
        '<h3>' + esc(f.company) + ' <span class="focus-ticker">' + esc(f.ticker) + '</span></h3>' +
        (compact
          ? '<div class="focus-label">Zeitraum</div><p class="focus-timeframe">' + esc(period) + '</p>'
          : '<div class="focus-label">Warum wir hingeschaut haben</div><p>' + esc(f.why) + '</p>') +
        (f.outcome || !current ? '<div class="focus-label">Was passiert ist</div>' +
          '<p>' + (f.outcome ? esc(f.outcome) : '<em>Läuft noch.</em>') + '</p>' : '') +
        (hasA ? '<div class="focus-actions"><button type="button" class="focus-toggle" aria-expanded="false" aria-controls="' + panelId + '">Zu unserer Analyse <span class="focus-toggle-icon" aria-hidden="true">+</span></button>' +
          (compact && endsSoon(f.until) ? '<span class="focus-ends-soon">Ereignis endet bald</span>' : '') + '</div>' : '') +
        (f.link && !hasA ? '<a class="card-link" href="' + esc(f.link) + '">' + (current ? 'Auf der Märkte-Seite verfolgen' : 'Mehr lesen') + ' →</a>' : '') +
      '</article>' +
      (f.analysis && f.analysis.length ?
        '<div class="focus-analysis" id="' + panelId + '" hidden>' +
          '<div class="focus-label">' + esc(f.company) + ', nach wichtigen Terminen</div>' +
          f.analysis.map(function (a) {
            return '<details class="focus-analysis-item"' + (a.id ? ' id="' + esc(a.id) + '"' : '') + '>' +
              '<summary><span class="fa-date">' + esc(a.date) +
                (a.url ? '<span class="research-badge fa-pill">Eigene Marktanalyse</span>' : '<span class="fa-pill fa-pill-soon">Folgt</span>') +
              '</span><span class="fa-event">' + esc(a.event) + '</span></summary>' +
              '<div class="fa-body"><p>' + esc(a.text) + '</p>' +
              (a.url ? '<a class="fa-link fa-cta" href="' + esc(a.url) + '"><span>' + (a.conclusion ? 'Analyse und Fazit lesen' : 'Analyse lesen') + '</span><span class="fa-cta-arrow" aria-hidden="true">→</span></a>' : '<span class="fa-soon">Demnächst</span>') +
              '</div></details>';
          }).join('') +
          (f.link ? '<a class="fa-more" href="' + esc(f.link) + '">' + (current ? 'Live-Chart und wichtige Termine auf der Märkte-Seite' : 'Mehr lesen') + ' →</a>' : '') +
        '</div>' : '');
  }).join('') +
  '<div class="focus-card focus-card-next">' +
    '<span class="coming-soon-pill">Als Nächstes</span>' +
    '<p>Das nächste Unternehmen kommt hierhin, sobald uns etwas auffällt.</p>' +
  '</div>';

  // Faint one-year price line behind cards that have a "priceData" file (same saved data as the Trades charts)
  grid.querySelectorAll('.focus-card.has-chart').forEach(function (card) {
    var holder = card.querySelector('.focus-chart-bg');
    if (!holder || !window.fetch) return;
    fetch(card.getAttribute('data-chart')).then(function (r) { return r.json(); }).then(function (d) {
      var bars = (d && d.bars) || [];
      if (bars.length < 2) return;
      var cut = bars[bars.length - 1][0] - 365 * 86400;
      var c = bars.filter(function (b) { return b[0] >= cut; }).map(function (b) { return b[4]; });
      if (c.length < 2) return;
      var min = Math.min.apply(null, c), max = Math.max.apply(null, c), span = (max - min) || 1;
      var pts = c.map(function (v, i) {
        return (i / (c.length - 1) * 300).toFixed(1) + ',' + (94 - (v - min) / span * 84).toFixed(1);
      }).join(' ');
      holder.innerHTML = '<svg viewBox="0 0 300 100" preserveAspectRatio="none" focusable="false">' +
        '<polygon points="0,100 ' + pts + ' 300,100"/><polyline points="' + pts + '"/></svg>';
    }).catch(function () {});
  });

  // The company card opens and closes its "Explore our analysis" panel
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function setPanel(card, open, instant) {
    var panel = document.getElementById(card.getAttribute('data-panel'));
    var btn = card.querySelector('.focus-toggle');
    if (!panel) return;
    card.classList.toggle('is-expanded', open);
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.classList.remove('is-unfolding', 'is-folding');
    if (panel._foldTimer) { clearTimeout(panel._foldTimer); panel._foldTimer = null; }
    if (open) {
      panel.hidden = false;
      if (!instant) { void panel.offsetWidth; panel.classList.add('is-unfolding'); }
    } else if (instant || reduceMotion || panel.hidden) {
      panel.hidden = true;
    } else {
      // play the closing animation, then hide the box
      void panel.offsetWidth;
      panel.classList.add('is-folding');
      panel._foldTimer = setTimeout(function () {
        panel.hidden = true;
        panel.classList.remove('is-folding');
        panel._foldTimer = null;
      }, 300);
    }
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
    setPanel(card, true, true);
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
