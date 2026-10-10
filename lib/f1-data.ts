import history from '@/config/f1-history.json';
import { keccak256, toHex } from 'viem';

type Constructor = { constructorId: string; name: string; nationality: string };
type Standing = { position: string; points: string; wins: string; Constructor: Constructor };
type ChampionBody = { MRData: { StandingsTable: { StandingsLists: { season: string; round: string; ConstructorStandings: Standing[] }[] } } };
type Source = { url: string; body: ChampionBody };
export type F1Team = { constructorId: string; name: string; nationality: string; color: number; titles: number; years: number[]; lastTitle: number; pointsMilli: number; wins: number; position: number };
export type F1Report = { season: number; round: number; throughSeason: number; observedAt: number; sourceHash: `0x${string}`; teams: F1Team[]; canonical: string; sources: string[]; identityPolicy: string };
const colors: Record<string, number> = { ferrari: 0xe22b38, mclaren: 0xff8700, mercedes: 0x27d2bf, red_bull: 0x6294ff, williams: 0x28a3ee, alpine: 0xed92bd, aston_martin: 0x42b995, audi: 0xee3f36, cadillac: 0xc4bce4, haas: 0xe5e5e5, rb: 0x77b2ff };

function integer(value: string, max = 1000000) { if (!/^\d+$/.test(value)) throw new Error('Invalid numeric sports data'); const n = Number(value); if (!Number.isSafeInteger(n) || n > max) throw new Error('Sports value out of range'); return n; }
export function deriveF1Report(roster: Constructor[], champions: Source[], standings: Source, calendar: { url: string; body: unknown }, observedAt: number): F1Report {
  const list = standings.body.MRData.StandingsTable.StandingsLists;
  if (list.length !== 1 || list[0].season !== '2026' || roster.length !== 11 || new Set(roster.map(t => t.constructorId)).size !== roster.length) throw new Error('Incomplete 2026 F1 data');
  const current = list[0]; const seen = new Set<number>();
  const years = new Map<string, number[]>();
  for (const { body } of champions) {
    const rows = body.MRData.StandingsTable.StandingsLists;
    if (rows.length !== 1 || rows[0].ConstructorStandings.length !== 1 || rows[0].ConstructorStandings[0].position !== '1') throw new Error('Invalid season champion');
    const year = integer(rows[0].season, 2026); if (year < 1958 || seen.has(year)) throw new Error('Duplicate or invalid championship year'); seen.add(year);
    const id = rows[0].ConstructorStandings[0].Constructor.constructorId;
    years.set(id, [...(years.get(id) ?? []), year]);
  }
  const throughSeason = Math.max(...seen); for (let year = 1958; year <= throughSeason; year++) if (!seen.has(year)) throw new Error(`Missing championship season ${year}`);
  const rows = current.ConstructorStandings;
  if (rows.length !== roster.length || new Set(rows.map(r => r.Constructor.constructorId)).size !== roster.length || new Set(rows.map(r => r.position)).size !== roster.length) throw new Error('Incomplete standings');
  const teams = roster.map(team => {
    if (!/^[A-Za-z0-9 _-]{1,64}$/.test(team.name) || !(team.constructorId in colors)) throw new Error('Unsupported team identity');
    const r = rows.find(row => row.Constructor.constructorId === team.constructorId); if (!r) throw new Error('Team missing from standings');
    if (!/^\d+(\.\d{1,3})?$/.test(r.points)) throw new Error('Invalid points');
    const pointsMilli = Math.round(Number(r.points) * 1000); if (!Number.isSafeInteger(pointsMilli) || pointsMilli > 0xffffffff) throw new Error('Points out of range');
    const won = (years.get(team.constructorId) ?? []).sort((a, b) => a - b);
    return { ...team, color: colors[team.constructorId], titles: won.length, years: won, lastTitle: won.at(-1) ?? 0, pointsMilli, wins: integer(r.wins, 50), position: integer(r.position, roster.length) };
  });
  const canonical = JSON.stringify({ schema: 'living-vault-f1-v1', roster, champions, standings, calendar, identityPolicy: 'Exact Jolpica constructorId; predecessor titles are not inherited.' });
  return { season: 2026, round: integer(current.round, 50), throughSeason, observedAt, sourceHash: keccak256(toHex(canonical)), teams, canonical, sources: [...champions.map(c => c.url), standings.url, calendar.url, 'https://api.jolpi.ca/ergast/f1/2026/constructors.json?limit=100'], identityPolicy: 'Exact constructor identity. Predecessor titles are not inherited.' };
}

export async function fetchF1Report(): Promise<F1Report> {
  async function get(path: string) {
    const url = `https://api.jolpi.ca/ergast/f1/${path}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'LivingVault/1.1 (github.com/neelpote/living-vault)' }, signal: AbortSignal.timeout(15000), next: { revalidate: 300 } });
    if (!response.ok) throw new Error(`Jolpica returned ${response.status}. No substitute data was used.`);
    return { url, body: await response.json() };
  }
  const [roster, standings, calendar] = await Promise.all([get('2026/constructors.json?limit=100'), get('2026/constructorstandings.json?limit=100'), get('2026/races.json?limit=100')]);
  const champions = [...history.seasons] as Source[];
  const races = calendar.body.MRData?.RaceTable?.Races;
  const latest = standings.body.MRData?.StandingsTable?.StandingsLists?.[0];
  if (!Array.isArray(races) || races.length < 1 || !latest) throw new Error('Missing calendar or standings');
  const finalRound = Math.max(...races.map((r: { round: string }) => integer(r.round, 50)));
  const finalDate = Date.parse(races.find((r: { round: string }) => Number(r.round) === finalRound).date + 'T23:59:59Z');
  if (Number(latest.round) === finalRound && Date.now() > finalDate) champions.push(await get('2026/constructorstandings/1.json?limit=100'));
  return deriveF1Report(roster.body.MRData.ConstructorTable.Constructors, champions, standings, calendar, Math.floor(Date.now() / 1000));
}

export function contractReport(report: F1Report) { return { season: report.season, round: report.round, throughSeason: report.throughSeason, observedAt: BigInt(report.observedAt), sourceHash: report.sourceHash, results: report.teams.map(t => ({ titles: t.titles, lastTitle: t.lastTitle, pointsMilli: t.pointsMilli, wins: t.wins, position: t.position })) }; }
