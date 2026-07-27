(async function() {
  const container = document.getElementById('econGlance');
  if (!container) return;

  function sparklinePath(points, width, height) {
    const values = points.map(p => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const step = width / (points.length - 1);
    return points.map((p, i) => {
      const x = i * step;
      const y = height - ((p.value - min) / range) * height;
      return (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2);
    }).join(' ');
  }

  function renderSparkline(svgId, points) {
    const svg = document.getElementById(svgId);
    if (!svg || points.length < 2) return;
    svg.innerHTML = '<path d="' + sparklinePath(points, 300, 100) + '" />';
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  try {
    const res = await fetch('data/econ-glance.json');
    const data = await res.json();
    const s = data.series;

    const lastUpper = s.fedFundsUpper[s.fedFundsUpper.length - 1].value;
    const lastLower = s.fedFundsLower[s.fedFundsLower.length - 1].value;
    document.getElementById('fedFundsValue').textContent = lastLower + '% to ' + lastUpper + '%';

    const pce = s.pce;
    const pceYoY = pce.slice(12).map((p, i) => ({
      date: p.date,
      value: ((p.value / pce[i].value) - 1) * 100
    }));
    const lastPce = pceYoY[pceYoY.length - 1];
    document.getElementById('pceValue').textContent = lastPce.value.toFixed(1) + '%';
    document.getElementById('pceDate').textContent = formatDate(lastPce.date);
    renderSparkline('pceSpark', pceYoY);

    const unrate = s.unemployment.filter(p => p.value !== null);
    const lastUnrate = unrate[unrate.length - 1];
    document.getElementById('unrateValue').textContent = lastUnrate.value + '%';
    document.getElementById('unrateDate').textContent = formatDate(lastUnrate.date);
    renderSparkline('unrateSpark', unrate);

    const gdp = s.gdp;
    const lastGdp = gdp[gdp.length - 1];
    document.getElementById('gdpValue').textContent = (lastGdp.value > 0 ? '+' : '') + lastGdp.value + '%';
    document.getElementById('gdpDate').textContent = formatDate(lastGdp.date);
    renderSparkline('gdpSpark', gdp);

  } catch (err) {
    console.error('Failed to load economic data:', err);
  }
})();