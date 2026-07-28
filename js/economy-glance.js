(async function() {
  const container = document.getElementById('econGlance');
  if (!container) return;

  const charts = {};

  function filterByRange(points, range) {
    if (range === 'all') return points;
    const now = new Date(points[points.length - 1].date);
    let cutoff = new Date(now);
    if (range === '1m') cutoff.setMonth(now.getMonth() - 1);
    else if (range === '3m') cutoff.setMonth(now.getMonth() - 3);
    else if (range === '6m') cutoff.setMonth(now.getMonth() - 6);
    else if (range === '1y') cutoff.setFullYear(now.getFullYear() - 1);
    else if (range === '3y') cutoff.setFullYear(now.getFullYear() - 3);
    else if (range === 'ytd') cutoff = new Date(now.getFullYear(), 0, 1);
    return points.filter(p => new Date(p.date) >= cutoff);
  }

  function makeChart(canvasId, points, color) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: points.map(p => p.date),
        datasets: [{
          data: points.map(p => p.value),
          borderColor: color,
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.15
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
        scales: {
        x: {
            type: 'category',
            grid: { display: false },
            ticks: { color: '#7D8A9D', maxTicksLimit: 6, autoSkip: true }
          },
          y: {
            grid: { color: '#E2E6EA' },
            ticks: { color: '#7D8A9D' }
          }
        }
      }
    });
    return chart;
  }

  function wireRangeButtons(fullData) {
    document.querySelectorAll('.econ-range-buttons').forEach(group => {
      const chartId = group.dataset.chart;
      group.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          group.querySelectorAll('button').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const range = btn.dataset.range;
          const filtered = filterByRange(fullData[chartId], range);
          const chart = charts[chartId];
          chart.data.labels = filtered.map(p => p.date);
          chart.data.datasets[0].data = filtered.map(p => p.value);
          chart.update();
        });
      });
    });
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

    const unrate = s.unemployment.filter(p => p.value !== null);
    const lastUnrate = unrate[unrate.length - 1];
    document.getElementById('unrateValue').textContent = lastUnrate.value + '%';
    document.getElementById('unrateDate').textContent = formatDate(lastUnrate.date);

    const gdp = s.gdp;
    const lastGdp = gdp[gdp.length - 1];
    document.getElementById('gdpValue').textContent = (lastGdp.value > 0 ? '+' : '') + lastGdp.value + '%';
    document.getElementById('gdpDate').textContent = formatDate(lastGdp.date);

    const fullData = {
      fedFundsChart: s.fedFundsUpper,
      pceChart: pceYoY,
      unrateChart: unrate,
      gdpChart: gdp
    };

    charts.fedFundsChart = makeChart('fedFundsChart', fullData.fedFundsChart, '#1B2A3F');
    charts.pceChart = makeChart('pceChart', fullData.pceChart, '#1B2A3F');
    charts.unrateChart = makeChart('unrateChart', fullData.unrateChart, '#1B2A3F');
    charts.gdpChart = makeChart('gdpChart', fullData.gdpChart, '#1B2A3F');

    wireRangeButtons(fullData);

  } catch (err) {
    console.error('Failed to load economic data:', err);
  }
})();