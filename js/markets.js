/* ============================================
   Surava Capital — Live Markets Page
   ============================================
   Data sources (no API key required):
   - Frankfurter (https://www.frankfurter.app)  -> live FX rates
   - World Bank Open Data API                   -> country indicators

   To switch to Trading Economics (paid, more granular, true intraday
   calendar data), set TE_API_KEY below and swap the fetch calls in
   loadIndicators() for the commented Trading Economics versions.
*/

const TE_API_KEY = null; // e.g. "yourkey:yourkey" — leave null to use free sources

const FX_SYMBOLS = ["EUR", "USD", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY"];

const COUNTRY_NAMES = {
  US: "United States", DE: "Germany", GB: "United Kingdom", FR: "France",
  JP: "Japan", CN: "China", BR: "Brazil", MX: "Mexico", AU: "Australia",
  ES: "Spain", IN: "India", CA: "Canada",
};

const INDICATORS = [
  { code: "NY.GDP.MKTP.KD.ZG", label: "GDP Growth", unit: "%" },
  { code: "FP.CPI.TOTL.ZG", label: "Inflation Rate (CPI)", unit: "%" },
  { code: "SL.UEM.TOTL.ZS", label: "Unemployment Rate", unit: "%" },
];

function formatNumber(value, unit) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(2)}${unit}`;
}

async function loadFxRates() {
  const grid = document.getElementById("fx-grid");
  const updated = document.getElementById("fx-updated");
  const base = document.getElementById("fx-base").value;
  const symbols = FX_SYMBOLS.filter((s) => s !== base);

  grid.innerHTML = `<div class="market-card market-skeleton">Loading exchange rates…</div>`;

  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${base}&to=${symbols.join(",")}`
    );
    if (!res.ok) throw new Error(`FX request failed (${res.status})`);
    const data = await res.json();

    grid.innerHTML = "";
    Object.entries(data.rates).forEach(([currency, rate]) => {
      const card = document.createElement("div");
      card.className = "market-card";
      card.innerHTML = `
        <div class="market-pair">${base} / ${currency}</div>
        <div class="market-value">${rate.toFixed(4)}</div>
        <div class="market-sub">1 ${base} = ${rate.toFixed(4)} ${currency}</div>
      `;
      grid.appendChild(card);
    });

    updated.textContent = `Live rate, base ${base} · as of ${data.date}`;
  } catch (err) {
    grid.innerHTML = `<div class="market-card market-error">Couldn't load exchange rates right now. Please try again shortly.</div>`;
    updated.textContent = "Update failed";
    console.error(err);
  }
}

async function fetchWorldBankIndicator(countryCode, indicatorCode) {
  const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicatorCode}?format=json&per_page=5&mrnev=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`World Bank request failed (${res.status})`);
  const json = await res.json();
  const series = json[1];
  if (!series || !series.length) return null;
  const entry = series.find((d) => d.value !== null) || null;
  return entry ? { value: entry.value, year: entry.date } : null;
}

async function loadIndicators() {
  const grid = document.getElementById("indicators-grid");
  const updated = document.getElementById("indicators-updated");
  const country = document.getElementById("country-select").value;

  grid.innerHTML = `<div class="market-card market-skeleton">Loading indicators…</div>`;

  try {
    const results = await Promise.all(
      INDICATORS.map((ind) => fetchWorldBankIndicator(country, ind.code))
    );

    grid.innerHTML = "";
    results.forEach((result, i) => {
      const { label, unit } = INDICATORS[i];
      const card = document.createElement("div");
      card.className = "market-card";
      card.innerHTML = `
        <div class="market-pair">${label}</div>
        <div class="market-value">${result ? formatNumber(result.value, unit) : "—"}</div>
        <div class="market-sub">${result ? `Most recent: ${result.year}` : "No data available"}</div>
      `;
      grid.appendChild(card);
    });

    updated.textContent = `${COUNTRY_NAMES[country] || country} · figures from the World Bank's most recently published data`;
  } catch (err) {
    grid.innerHTML = `<div class="market-card market-error">Couldn't load country indicators right now. Please try again shortly.</div>`;
    updated.textContent = "Update failed";
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("fx-grid")) return; // not on markets.html

  loadFxRates();
  loadIndicators();

  document.getElementById("fx-base").addEventListener("change", loadFxRates);
  document.getElementById("fx-refresh").addEventListener("click", loadFxRates);
  document.getElementById("country-select").addEventListener("change", loadIndicators);

  // Keep FX rates fresh without a manual refresh
  setInterval(loadFxRates, 60000);
});
