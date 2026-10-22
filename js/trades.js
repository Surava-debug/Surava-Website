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
     tag         optional: short label, e.g. "Event", "News reaction", "Planned"
     why         optional: why we entered, 1-2 sentences
     exitWhy     optional: why we closed
     lesson      optional: what we learned

   Only prices and times go in here. This file is public on GitHub,
   so never put position sizes, CHF amounts or account details in it.
   =================================================================== */
const trades = [
  { instrument: "Moderna", symbol: "MRNA", direction: "short", opened: "2026-10-21T17:21:06Z", closed: "2026-10-22T16:33:49Z", entry: 247.90, exit: 216.70, link: "/insights/insight-05-moderna-hazard-ratio.html" },
  { instrument: "Moderna", symbol: "MRNA", direction: "short", opened: "2026-10-22T08:00:24Z", closed: "2026-10-22T16:54:19Z", entry: 241.88, exit: 202.21, link: "/insights/insight-05-moderna-hazard-ratio.html" },
  { instrument: "Moderna", symbol: "MRNA", direction: "short", opened: "2026-10-22T16:45:38Z", closed: "2026-10-22T16:46:45Z", entry: 204.78, exit: 199.94, link: "/insights/insight-05-moderna-hazard-ratio.html" },
  { instrument: "Moderna", symbol: "MRNA", direction: "short", opened: "2026-10-22T17:02:11Z", closed: "2026-10-22T17:05:07Z", entry: 194.42, exit: 189.90, link: "/insights/insight-05-moderna-hazard-ratio.html" },
];

/* Price data behind the chart: 5-minute candles saved once per period
   (frozen, so the chart never moves on after the trades). One file per symbol. */
const tradePrices = {
  MRNA: "/data/prices/mrna-2026-10-21_22.json"
};

/* Levels from our earlier chart analysis, drawn as fixed lines on the chart.
   type "res" = resistance (red), "sup" = support (grey). */
const tradeLevels = {
  MRNA: [
    { type: "res", price: 250, label: "Resistance ~$250 (previously determined)" },
    { type: "sup", from: 209, to: 217, label: "Support $209–217" },
    { type: "sup", from: 183, to: 197, label: "Support $183–197" },
    { type: "sup", from: 135, to: 160, label: "Support $135–160" }
  ]
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
  function held(t) {
    var m = Math.round((Date.parse(t.closed) - Date.parse(t.opened)) / 60000);
    if (m < 60) return Math.max(m, 1) + ' min';
    var h = m / 60; return (h < 10 ? h.toFixed(1).replace('.0', '') : Math.round(h)) + ' h';
  }
  function hasNotes(t) { return t.why || t.exitWhy || t.lesson; }
  // The last column only exists once a trade has notes (the analysis link sits in the box header)
  var anyNotes = trades.some(hasNotes);
  if (!anyNotes) { var lastTh = document.querySelector('table.trades thead th:last-child'); if (lastTh && !lastTh.textContent) lastTh.remove(); }
  body.innerHTML = chrono.slice().reverse().map(function (t) {
    var win = t._m >= 0;
    var row = '<tr data-n="' + t._n + '" tabindex="0">' +
      '<td class="t-num">#' + t._n + '</td>' +
      '<td class="t-date">' + when(t.opened) + '<br><span>to ' + when(t.closed) + '</span></td>' +
      '<td class="t-asset">' + esc(t.instrument) + ' <span class="t-sym">' + esc(t.symbol) + '</span>' +
        (t.tag ? '<br><span class="t-tag">' + esc(t.tag) + '</span>' : '') + '</td>' +
      '<td><span class="dir dir-' + t.direction + '">' + (t.direction === 'short' ? 'Short' : 'Long') + '</span></td>' +
      '<td class="t-px">' + price(t.entry) + '</td>' +
      '<td class="t-px">' + price(t.exit) + '</td>' +
      '<td class="t-held">' + held(t) + '</td>' +
      '<td class="t-worst" data-worst="' + t._n + '"><span class="t-none">&ndash;</span></td>' +
      '<td class="t-move ' + (win ? 'is-win' : 'is-loss') + '">' + (win ? '+' : '&minus;') + Math.abs(t._m).toFixed(2) + '%</td>' +
      (anyNotes ? '<td class="t-actions">' +
        (hasNotes(t) ? '<button type="button" class="t-notes-btn" data-notes="' + t._n + '" aria-expanded="false">Notes</button>' : '') + '</td>' : '') +
    '</tr>';
    if (hasNotes(t)) {
      row += '<tr class="t-notes" id="notes-' + t._n + '" hidden><td></td><td colspan="9"><dl>' +
        (t.why ? '<div><dt>Why we entered</dt><dd>' + esc(t.why) + '</dd></div>' : '') +
        (t.exitWhy ? '<div><dt>Why we closed</dt><dd>' + esc(t.exitWhy) + '</dd></div>' : '') +
        (t.lesson ? '<div><dt>What we learned</dt><dd>' + esc(t.lesson) + '</dd></div>' : '') +
        '</dl></td></tr>';
    }
    return row;
  }).join('');
  body.querySelectorAll('tr[data-n]').forEach(function (r, i) { r.style.setProperty('--i', i); });
  var tbox = body.closest('details');
  if (tbox) {
    var cnt = tbox.querySelector('.tb-count');
    if (cnt) cnt.textContent = trades.length + (trades.length === 1 ? ' trade' : ' trades');
  }
  body.addEventListener('click', function (e) {
    var b = e.target.closest('.t-notes-btn'); if (!b) return;
    e.stopPropagation();
    var r = document.getElementById('notes-' + b.getAttribute('data-notes'));
    var open = r.hidden; r.hidden = !open; b.setAttribute('aria-expanded', open ? 'true' : 'false');
  }, true);

  // ---- Charts: candlesticks with our entries and exits marked ----
  if (!charts || typeof LightweightCharts === 'undefined') return;
  var groups = {};
  chrono.forEach(function (t) { if (tradePrices[t.symbol]) (groups[t.symbol] = groups[t.symbol] || []).push(t); });
  var narrow = window.matchMedia && window.matchMedia('(max-width: 600px)').matches;
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
    box.innerHTML = '<figcaption>' + esc(list[0].instrument) + ' <span>' + esc(sym) + ' &middot; 15-minute candles</span></figcaption>' +
      '<div class="trade-chart-wrap" id="tc' + k + '" role="img" aria-label="' + esc(list[0].instrument) + ' price chart with our trade entries and exits"></div>';
    charts.appendChild(box);

    fetch(tradePrices[sym]).then(function (r) { return r.json(); }).then(function (d) {
      var off = zurichOffset(d.bars[0][0]);
      // The file holds 5-minute candles; the chart shows them merged into 15-minute candles
      var CANDLE = 900, bars = [];
      d.bars.forEach(function (b) {
        var t = Math.floor(b[0] / CANDLE) * CANDLE + off, last = bars[bars.length - 1];
        if (last && last.time === t) { last.high = Math.max(last.high, b[2]); last.low = Math.min(last.low, b[3]); last.close = b[4]; }
        else bars.push({ time: t, open: b[1], high: b[2], low: b[3], close: b[4] });
      });
      var times = bars.map(function (b) { return b.time; });
      function snap(iso) { // the candle the trade happened in
        var t = Math.floor(Date.parse(iso) / 1000) + off, best = times[0];
        for (var i = 0; i < times.length && times[i] <= t; i++) best = times[i];
        return best;
      }
      // Worst point: how far the price ran against us between entry and exit,
      // using only the 5-minute candles fully inside the trade (so very short trades show a dash).
      list.forEach(function (t) {
        var a0 = Date.parse(t.opened) / 1000, a1 = Date.parse(t.closed) / 1000, worst = null;
        d.bars.forEach(function (b) {
          if (b[0] >= a0 && b[0] + 300 <= a1) {
            var w = t.direction === 'short' ? (b[2] - t.entry) / t.entry : (t.entry - b[3]) / t.entry;
            worst = worst === null ? w : Math.max(worst, w);
          }
        });
        var cell = document.querySelector('[data-worst="' + t._n + '"]');
        if (cell && worst !== null) cell.innerHTML = worst <= 0 ? '<span class="t-none">never</span>' :
          '<span class="t-worst-v">&minus;' + (worst * 100).toFixed(2) + '%</span>';
      });
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
      var levels = tradeLevels[sym] || [];
      levels.filter(function (lv) { return lv.type === 'res'; }).forEach(function (lv) {
        series.createPriceLine({ price: lv.price, color: 'rgba(194, 65, 12, 0.75)', lineWidth: 1, lineStyle: 0, axisLabelVisible: true,
          axisLabelColor: '#C2410C', axisLabelTextColor: '#fff', title: narrow ? '' : 'Resistance' });
      });
      // Support zones as shaded bands with their name (small drawing plug-in for the chart library)
      var zones = levels.filter(function (lv) { return lv.type === 'sup'; });
      if (zones.length && series.attachPrimitive) {
        function zoneView(layer) { // layer 'bottom' = shaded band under the candles, 'top' = label above them
          return {
            zOrder: function () { return layer; },
            renderer: function () {
              return { draw: function (target) {
                target.useBitmapCoordinateSpace(function (sc) {
                  var ctx = sc.context, r = sc.horizontalPixelRatio, v = sc.verticalPixelRatio;
                  zones.forEach(function (z) {
                    var y1 = series.priceToCoordinate(z.to), y2 = series.priceToCoordinate(z.from);
                    if (y1 === null || y2 === null) return;
                    if (layer === 'bottom') {
                      ctx.fillStyle = 'rgba(92, 107, 128, 0.10)';
                      ctx.fillRect(0, y1 * v, sc.bitmapSize.width, (y2 - y1) * v);
                      return;
                    }
                    ctx.font = '600 ' + (10.5 * r) + 'px Inter, -apple-system, sans-serif';
                    var tw = ctx.measureText(z.label).width, px = 6 * r, py = (y1 + 4) * v, h = 16 * v;
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                    ctx.fillRect(px, py, tw + 10 * r, h);
                    ctx.fillStyle = 'rgba(92, 107, 128, 1)';
                    ctx.fillText(z.label, px + 5 * r, py + 11.5 * v);
                  });
                });
              } };
            }
          };
        }
        series.attachPrimitive({
          updateAllViews: function () {},
          paneViews: function () { return [zoneView('bottom'), zoneView('top')]; }
        });
      }
      // One trade at a time: chips above the chart (and the table rows) pick the trade.
      // The chart then zooms to that trade and shows only its entry and exit.
      var ENTRY = '#B23A32', EXIT = '#111827';
      var lines = [];
      function clearLines() { lines.forEach(function (l) { series.removePriceLine(l); }); lines = []; }
      function showAll() { // every entry and exit at once, arrows only
        var marks = [];
        list.forEach(function (t) {
          var short = t.direction === 'short';
          marks.push({ time: snap(t.opened), position: short ? 'aboveBar' : 'belowBar', shape: short ? 'arrowDown' : 'arrowUp', color: ENTRY, size: 1.2 });
          marks.push({ time: snap(t.closed), position: short ? 'belowBar' : 'aboveBar', shape: short ? 'arrowUp' : 'arrowDown', color: EXIT, size: 1.2 });
        });
        series.setMarkers(marks.sort(function (a, b) { return a.time - b.time; }));
        clearLines();
        chart.timeScale().fitContent();
        chips.querySelectorAll('button').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-n') === 'all'); });
        info.innerHTML = '<strong>All ' + list.length + ' trades</strong> &middot; pick a trade to zoom in on its entry and exit';
        document.querySelectorAll('#trades-body tr').forEach(function (r) { r.classList.remove('is-selected'); });
      }
      function show(t) {
        var short = t.direction === 'short', win = t._m >= 0;
        var tIn = snap(t.opened), tOut = snap(t.closed);
        series.setMarkers([
          { time: tIn, position: short ? 'aboveBar' : 'belowBar', shape: short ? 'arrowDown' : 'arrowUp',
            color: ENTRY, size: 1.4 },
          { time: tOut, position: short ? 'belowBar' : 'aboveBar', shape: short ? 'arrowUp' : 'arrowDown',
            color: EXIT, size: 1.4 }
        ].sort(function (a, b) { return a.time - b.time; }));
        clearLines();
        lines = [
          series.createPriceLine({ price: t.entry, color: ENTRY, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: narrow ? '' : 'Entry' }),
          series.createPriceLine({ price: t.exit, color: '#1B2A3F', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: narrow ? '' : 'Exit' })
        ];
        var iIn = times.indexOf(tIn), iOut = times.indexOf(tOut);
        var pad = Math.max(8, Math.round((iOut - iIn) * 0.3));
        chart.timeScale().setVisibleLogicalRange({ from: iIn - pad, to: iOut + pad });
        chips.querySelectorAll('button').forEach(function (b) { b.classList.toggle('is-on', +b.getAttribute('data-n') === t._n); });
        info.innerHTML = '<strong>#' + t._n + ' ' + (short ? 'Short' : 'Long') + '</strong> &middot; ' +
          when(t.opened) + ' &rarr; ' + when(t.closed) + ' &middot; <span class="' + (win ? 'is-win' : 'is-loss') + '">' +
          (win ? '+' : '&minus;') + Math.abs(t._m).toFixed(2) + '%</span>';
        document.querySelectorAll('#trades-body tr').forEach(function (r) { r.classList.toggle('is-selected', +r.getAttribute('data-n') === t._n); });
      }
      var chips = document.createElement('div');
      chips.className = 'chart-zoom';
      chips.innerHTML = '<button type="button" data-n="all">All trades</button>' + list.map(function (t) {
        return '<button type="button" data-n="' + t._n + '">#' + t._n + ' ' + (t.direction === 'short' ? 'Short' : 'Long') + '</button>';
      }).join('');
      var info = document.createElement('div');
      info.className = 'chart-info';
      box.insertBefore(chips, el);
      box.insertBefore(info, el);
      function pick(n) { var t = list.filter(function (x) { return x._n === n; })[0]; if (t) show(t); return t; }
      chips.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.getAttribute('data-n') === 'all') showAll(); else pick(+b.getAttribute('data-n'));
      });
      var tb = document.getElementById('trades-body');
      function fromRow(e) {
        var r = e.target.closest('tr[data-n]'); if (!r || e.target.closest('a')) return;
        var t = pick(+r.getAttribute('data-n')); if (t) { picked = t; box.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      }
      tb.addEventListener('click', fromRow);
      tb.addEventListener('keydown', function (e) { if (e.key === 'Enter') fromRow(e); });
      // Deep link from articles: /trades/#trade-3 opens trade #3
      var hm = /^#trade-(\d+)$/.exec(location.hash);
      var picked = null;
      if (hm && (picked = pick(+hm[1]))) { if (tbox) tbox.open = true; box.scrollIntoView({ block: 'center' }); }
      else showAll(); // start with every trade on one chart
      // The chart sits in a folded box: when it unfolds, let the chart take its real width, then redraw the view
      if (tbox) tbox.addEventListener('toggle', function () {
        if (!tbox.open) return;
        requestAnimationFrame(function () { if (picked) show(picked); else showAll(); });
      });
      chips.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        picked = b.getAttribute('data-n') === 'all' ? null : list.filter(function (x) { return x._n === +b.getAttribute('data-n'); })[0] || null;
      });
    });
  });
})();
