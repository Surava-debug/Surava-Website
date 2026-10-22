/* ===================================================================
   TRADES JOURNAL. This is the ONLY place you edit to log a trade.
   Order doesn't matter: the table sorts newest first, the charts
   oldest first.

   Fields (times in UTC, exactly as in the Trading 212 export):
     instrument  name shown on the page, e.g. "Moderna"
     symbol      e.g. "MRNA"
     direction   "short" (sold first, bought back) or "long"
     opened      "Date opened (UTC)" from the export, as "YYYY-MM-DDTHH:MM:SSZ"
     closed      "Date closed (UTC)"
     entry       "Average price"
     exit        "Close price"
     link        optional: our analysis behind the trade

   Only prices and times go in here. This file is public on GitHub,
   so never put position sizes, CHF amounts or account details in it.
   =================================================================== */
const trades = [
  { instrument: "Moderna", symbol: "MRNA", direction: "short", opened: "2026-10-21T17:21:06Z", closed: "2026-10-22T16:33:49Z", entry: 247.90, exit: 216.70, link: "/insights/insight-05-moderna-hazard-ratio.html" },
  { instrument: "Moderna", symbol: "MRNA", direction: "short", opened: "2026-10-22T08:00:24Z", closed: "2026-10-22T16:54:19Z", entry: 241.88, exit: 202.21, link: "/insights/insight-05-moderna-hazard-ratio.html" },
  { instrument: "Silver",  symbol: "XAGUSD", direction: "long", opened: "2026-10-22T12:51:08Z", closed: "2026-10-22T19:05:30Z", entry: 55.9705, exit: 54.6128 },
  { instrument: "Moderna", symbol: "MRNA", direction: "short", opened: "2026-10-22T16:45:38Z", closed: "2026-10-22T16:46:45Z", entry: 204.78, exit: 199.94, link: "/insights/insight-05-moderna-hazard-ratio.html" },
  { instrument: "Moderna", symbol: "MRNA", direction: "short", opened: "2026-10-22T16:49:23Z", closed: "2026-10-22T16:54:18Z", entry: 194.59, exit: 202.16, link: "/insights/insight-05-moderna-hazard-ratio.html" },
  { instrument: "Moderna", symbol: "MRNA", direction: "short", opened: "2026-10-22T17:02:11Z", closed: "2026-10-22T17:05:07Z", entry: 194.42, exit: 189.90, link: "/insights/insight-05-moderna-hazard-ratio.html" },
  { instrument: "Moderna", symbol: "MRNA", direction: "long",  opened: "2026-10-22T17:16:43Z", closed: "2026-10-22T18:01:54Z", entry: 184.55, exit: 180.75, link: "/insights/insight-05-moderna-hazard-ratio.html" },
  { instrument: "Silver",  symbol: "XAGUSD", direction: "short", opened: "2026-10-22T19:01:08Z", closed: "2026-10-22T19:05:28Z", entry: 54.5990, exit: 54.6357 }
];

/* ------------------------------------------------------------------
   Rendering. No need to touch anything below this line.
   ------------------------------------------------------------------ */
(function () {
  var body = document.getElementById('trades-body');
  var charts = document.getElementById('trade-charts');
  if (!body || !trades.length) return;

  var GREEN = '#2F7D4A', RED = '#B23A32';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function when(iso) {
    return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  }
  function move(t) { // share-price move in the trade's favour, in %
    var m = (t.exit - t.entry) / t.entry * 100;
    return t.direction === 'short' ? -m : m;
  }
  function price(v) { return '$' + (v >= 100 ? v.toFixed(2) : v.toFixed(3)); }

  var chrono = trades.slice().sort(function (a, b) { return new Date(a.opened) - new Date(b.opened); });
  chrono.forEach(function (t, i) { t._n = i + 1; t._m = move(t); });

  // ---- Table: newest first ----
  body.innerHTML = chrono.slice().reverse().map(function (t) {
    var win = t._m >= 0;
    return '<tr>' +
      '<td class="t-num">#' + t._n + '</td>' +
      '<td class="t-date">' + when(t.opened) + '<br><span>to ' + when(t.closed) + '</span></td>' +
      '<td class="t-asset">' + esc(t.instrument) + ' <span class="t-sym">' + esc(t.symbol) + '</span></td>' +
      '<td><span class="dir dir-' + t.direction + '">' + (t.direction === 'short' ? 'Short' : 'Long') + '</span></td>' +
      '<td class="t-px">' + price(t.entry) + '</td>' +
      '<td class="t-px">' + price(t.exit) + '</td>' +
      '<td class="t-move ' + (win ? 'is-win' : 'is-loss') + '">' + (win ? '+' : '&minus;') + Math.abs(t._m).toFixed(2) + '%</td>' +
      '<td>' + (t.link ? '<a class="t-link" href="' + esc(t.link) + '">Analysis &rarr;</a>' : '<span class="t-none">&ndash;</span>') + '</td>' +
    '</tr>';
  }).join('');

  // ---- Charts: one per instrument, entry to exit per trade ----
  if (!charts || typeof Chart === 'undefined') return;
  var groups = {};
  chrono.forEach(function (t) { (groups[t.instrument] = groups[t.instrument] || []).push(t); });

  charts.innerHTML = Object.keys(groups).map(function (name, k) {
    return '<figure class="trade-chart"><figcaption>' + esc(name) + '</figcaption>' +
      '<div class="trade-chart-wrap"><canvas id="tc' + k + '" role="img" aria-label="' + esc(name) +
      ': entry and exit price of each trade"></canvas></div></figure>';
  }).join('');

  Object.keys(groups).forEach(function (name, k) {
    var list = groups[name];
    var narrow = window.matchMedia && window.matchMedia('(max-width: 600px)').matches;
    var labels = list.map(function (t) {
      var d = t.direction === 'short' ? 'Short' : 'Long';
      return narrow ? ['#' + t._n, d] : ['#' + t._n + ' ' + d, when(t.opened)];
    });
    var lo = Math.min.apply(null, list.map(function (t) { return Math.min(t.entry, t.exit); }));
    var hi = Math.max.apply(null, list.map(function (t) { return Math.max(t.entry, t.exit); }));
    var pad = Math.max((hi - lo) * 0.12, hi * 0.004);
    var colors = list.map(function (t) { return t._m >= 0 ? GREEN : RED; });
    new Chart(document.getElementById('tc' + k), {
      data: {
        labels: labels,
        datasets: [
          { type: 'bar', label: 'Entry to exit', data: list.map(function (t) { return [t.entry, t.exit]; }),
            backgroundColor: colors.map(function (c) { return c + '33'; }), borderColor: colors, borderWidth: 1.5,
            borderSkipped: false, borderRadius: 3, maxBarThickness: 26 },
          { type: 'line', label: 'Entry', data: list.map(function (t) { return t.entry; }), showLine: false,
            pointStyle: 'triangle', pointRadius: 7, pointHoverRadius: 8,
            pointRotation: list.map(function (t) { return t.direction === 'short' ? 180 : 0; }),
            pointBackgroundColor: '#1B2A3F', pointBorderColor: '#1B2A3F' },
          { type: 'line', label: 'Exit', data: list.map(function (t) { return t.exit; }), showLine: false,
            pointStyle: 'circle', pointRadius: 4.5, pointHoverRadius: 6,
            pointBackgroundColor: '#fff', pointBorderColor: '#1B2A3F', pointBorderWidth: 2 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: {
            title: function (items) { var t = list[items[0].dataIndex]; return '#' + t._n + ' ' + name + ' ' + (t.direction === 'short' ? 'short' : 'long'); },
            label: function () { return null; },
            afterBody: function (items) {
              var t = list[items[0].dataIndex];
              return ['Entry ' + price(t.entry) + '  (' + when(t.opened) + ')', 'Exit  ' + price(t.exit) + '  (' + when(t.closed) + ')',
                      'Move  ' + (t._m >= 0 ? '+' : '-') + Math.abs(t._m).toFixed(2) + '%'];
            }
          } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#6B7480', autoSkip: false, maxRotation: 0, font: { size: 11 } } },
          y: { beginAtZero: false, suggestedMin: lo - pad, suggestedMax: hi + pad, grid: { color: '#E2E6EA' }, border: { display: false },
               ticks: { color: '#6B7480', maxTicksLimit: 6, callback: function (v) { return '$' + (Math.abs(v) >= 100 ? Math.round(v) : v.toFixed(2)); } } }
        }
      }
    });
  });
})();
