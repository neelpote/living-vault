import { writeFileSync } from 'node:fs';
const origin = 'https://api.jolpi.ca/ergast/f1';
async function get(path) {
  const url = `${origin}/${path}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, { headers: { 'User-Agent': 'LivingVault/1.1 (github.com/neelpote/living-vault)' }, signal: AbortSignal.timeout(20000) });
    if (response.ok) return { url, body: await response.json() };
    if (response.status !== 429 && response.status < 500) throw new Error(`${url}: ${response.status}`);
    await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
  }
  throw new Error(`Data unavailable: ${url}`);
}
const roster = await get('2026/constructors.json?limit=100');
const seasons = [];
for (let year = 1958; year <= 2025; year++) {
  const result = await get(`${year}/constructorstandings/1.json?limit=100`);
  const list = result.body.MRData?.StandingsTable?.StandingsLists;
  if (list?.length !== 1 || list[0].season !== String(year) || list[0].ConstructorStandings?.length !== 1 || list[0].ConstructorStandings[0].position !== '1') throw new Error(`Incomplete championship data for ${year}`);
  seasons.push(result);
  console.log(`${year}: ${list[0].ConstructorStandings[0].Constructor.name}`);
  await new Promise(resolve => setTimeout(resolve, 350));
}
writeFileSync('config/f1-history.json', JSON.stringify({ fetchedAt: new Date().toISOString(), roster, seasons }, null, 2) + '\n');
console.log('Saved 68 real completed-season champion responses and the 2026 roster.');
