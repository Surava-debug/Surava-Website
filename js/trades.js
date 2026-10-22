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
  { instrument: "Moderna", symbol: "MRNA", direction: "short", opened: "2026-10-22T16:45:38Z", closed: "2026-10-22T16:46:45Z", entry: 204.78, exit: 199.94, link: "/insights/insight-05-moderna-hazard-ratio.html" },
  { instrument: "Moderna", symbol: "MRNA", direction: "short", opened: "2026-10-22T16:49:23Z", closed: "2026-10-22T16:54:18Z", entry: 194.59, exit: 202.16, link: "/insights/insight-05-moderna-hazard-ratio.html" },
  { instrument: "Moderna", symbol: "MRNA", direction: "short", opened: "2026-10-22T17:02:11Z", closed: "2026-10-22T17:05:07Z", entry: 194.42, exit: 189.90, link: "/insights/insight-05-moderna-hazard-ratio.html" },
  { instrument: "Moderna", symbol: "MRNA", direction: "long",  opened: "2026-10-22T17:16:43Z", closed: "2026-10-22T18:01:54Z", entry: 184.55, exit: 180.75, link: "/insights/insight-05-moderna-hazard-ratio.html" },
];

/* Price data behind the chart: 5-minute candles saved once per period
   (frozen, so the chart never moves on after the trades). One file per symbol. */
const tradePrices = {
  MRNA: "/data/prices/mrna-2026-10-21_22.json"
};

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

  // ---- Charts: candlesticks with our entries and exits marked ----
  if (!charts || typeof LightweightCharts === 'undefined') return;
  var groups = {};
  chrono.forEach(function (t) { if (tradePrices[t.symbol]) (groups[t.symbol] = groups[t.symbol] || []).push(t); });
  var TZ = 2 * 3600; // show Zurich time (CEST, UTC+2) on the time axis
  function zurichOffset(sec) {
    var p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', timeZoneName: 'shortOffset' }).formatToParts(new Date(sec * 1000));
    var z = (p.filter(function (x) { return x.type === 'timeZoneName'; })[0] || {}).value || 'GMT+2';
    var m = z.match(/GMT([+-]\d+)/); return m ? +m[1] * 3600 : TZ;
  }

  Object.keys(groups).forEach(function (sym, k) {
    var list = groups[sym];
    var box = document.createElement('figure');
    box.className = 'trade-chart';
    box.innerHTML = '<figcaption>' + esc(list[0].instrument) + ' <span>' + esc(sym) + ' &middot; 5-minute candles</span></figcaption>' +
      '<div class="trade-chart-wrap" id="tc' + k + '" role="img" aria-label="' + esc(list[0].instrument) + ' price chart with our trade entries and exits"></div>';
    charts.appendChild(box);

    fetch(tradePrices[sym]).then(function (r) { return r.json(); }).then(function (d) {
      var off = zurichOffset(d.bars[0][0]);
      var bars = d.bars.map(function (b) { return { time: b[0] + off, open: b[1], high: b[2], low: b[3], close: b[4] }; });
      var times = bars.map(function (b) { return b.time; });
      function snap(iso) { // the candle the trade happened in
        var t = Math.floor(Date.parse(iso) / 1000) + off, best = times[0];
        for (var i = 0; i < times.length && times[i] <= t; i++) best = times[i];
        return best;
      }
      var el = document.getElementById('tc' + k);
      var chart = LightweightCharts.createChart(el, {
        autoSize: true,
        localization: { locale: 'en-GB' },
        layout: { background: { color: '#FFFFFF' }, textColor: '#6B7480', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' },
        grid: { vertLines: { color: '#F0F2F4' }, horzLines: { color: '#F0F2F4' } },
        rightPriceScale: { borderColor: '#E2E6EA' },
        timeScale: { borderColor: '#E2E6EA', timeVisible: true, secondsVisible: false },
        crosshair: { mode: 0 },
        handleScroll: { vertTouchDrag: false }
      });
      var series = chart.addCandlestickSeries({
        upColor: '#2F7D4A', downColor: '#B23A32', borderVisible: false,
        wickUpColor: '#2F7D4A', wickDownColor: '#B23A32',
        priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
        lastValueVisible: false, priceLineVisible: false
      });
      series.setData(bars);
      var marks = [];
      list.forEach(function (t) {
        var short = t.direction === 'short';
        marks.push({ time: snap(t.opened), position: short ? 'aboveBar' : 'belowBar', shape: short ? 'arrowDown' : 'arrowUp',
                     color: short ? '#B23A32' : '#2F7D4A', text: '#' + t._n });
        marks.push({ time: snap(t.closed), position: short ? 'belowBar' : 'aboveBar', shape: short ? 'arrowUp' : 'arrowDown',
                     color: '#1B2A3F', text: '#' + t._n });
      });
      marks.sort(function (a, b) { return a.time - b.time; });
      series.setMarkers(marks);
      chart.timeScale().fitContent();

      // Zoom buttons: whole period, or the busiest stretch (around the trades closed last)
      var last = list.reduce(function (m, t) { return Math.max(m, Date.parse(t.closed) / 1000); }, 0) + off;
      var first = list.reduce(function (m, t) { return Math.min(m, Date.parse(t.opened) / 1000); }, Infinity) + off;
      var busyFrom = Math.max(times[0], last - 3 * 3600), busyTo = Math.min(times[times.length - 1], last + 45 * 60);
      var bar = document.createElement('div');
      bar.className = 'chart-zoom';
      bar.innerHTML = '<button type="button" class="is-on" data-z="all">All trades</button>' +
                      '<button type="button" data-z="busy">Zoom: busiest hours</button>';
      box.insertBefore(bar, el);
      bar.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        bar.querySelectorAll('button').forEach(function (x) { x.classList.toggle('is-on', x === b); });
        if (b.getAttribute('data-z') === 'busy') chart.timeScale().setVisibleRange({ from: busyFrom, to: busyTo });
        else chart.timeScale().fitContent();
      });
    });
  });
})();
