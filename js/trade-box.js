/* Foldable "Our trades" box for articles.
   Reads the trades list from /js/trades.js (load that file first) and fills
   every <details class="trade-box" data-symbol="MRNA"> on the page. */
(function () {
  if (typeof trades === 'undefined') return;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function when(iso) {
    return new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  }
  function price(v) { return '$' + v.toFixed(2); }
  // Same numbering as the trades page: oldest trade = #1
  var chrono = trades.slice().sort(function (a, b) { return new Date(a.opened) - new Date(b.opened); });
  chrono.forEach(function (t, i) { t._n = i + 1; var m = (t.exit - t.entry) / t.entry * 100; t._m = t.direction === 'short' ? -m : m; });

  document.querySelectorAll('.trade-box[data-symbol]').forEach(function (box) {
    var sym = box.getAttribute('data-symbol');
    var list = chrono.filter(function (t) { return t.symbol === sym; });
    var count = box.querySelector('.tb-count');
    if (count) count.textContent = list.length + (list.length === 1 ? ' trade' : ' trades');
    var ol = box.querySelector('.tb-list');
    if (!ol) return;
    if (!list.length) { ol.innerHTML = '<li class="tb-empty">No trades logged yet.</li>'; return; }
    ol.innerHTML = list.map(function (t, i) {
      var win = t._m >= 0, short = t.direction === 'short';
      return '<li style="--i:' + i + '"><a href="/trades/#trade-' + t._n + '">' +
        '<span class="tb-n">#' + t._n + '</span>' +
        '<span class="dir dir-' + t.direction + '">' + (short ? 'Short' : 'Long') + '</span>' +
        '<span class="tb-when">' + when(t.opened) + ' &rarr; ' + when(t.closed) + '</span>' +
        '<span class="tb-px">' + price(t.entry) + ' &rarr; ' + price(t.exit) + '</span>' +
        '<span class="tb-res ' + (win ? 'is-win' : 'is-loss') + '">' + (win ? '+' : '&minus;') + Math.abs(t._m).toFixed(2) + '%</span>' +
        '<span class="tb-go" aria-hidden="true">&rarr;</span>' +
      '</a></li>';
    }).join('');
  });
})();
