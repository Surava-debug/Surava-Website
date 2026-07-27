import fs from "fs";

const API_KEY = process.env.FRED_API_KEY;
const START_DATE = "2018-01-01";

const SERIES = {
  fedFundsUpper: "DFEDTARU",
  fedFundsLower: "DFEDTARL",
  pce: "PCEPI",
  unemployment: "UNRATE",
  gdp: "A191RL1Q225SBEA"
};

async function fetchSeries(seriesId) {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${API_KEY}&file_type=json&observation_start=${START_DATE}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FRED error for ${seriesId}: ${res.status}`);
  const data = await res.json();
  return data.observations
    .filter(o => o.value !== ".")
    .map(o => ({ date: o.date, value: parseFloat(o.value) }));
}

async function main() {
  const result = { updated: new Date().toISOString(), series: {} };

  for (const [key, seriesId] of Object.entries(SERIES)) {
    console.log(`Fetching ${key} (${seriesId})...`);
    result.series[key] = await fetchSeries(seriesId);
  }

  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync("data/econ-glance.json", JSON.stringify(result, null, 2));
  console.log("Done. Wrote data/econ-glance.json");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});