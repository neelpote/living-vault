import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createPublicClient, http, keccak256, toHex } from 'viem';
import { monadTestnet } from 'viem/chains';
const d = JSON.parse(readFileSync('config/f1-deployment.json'));
assert.equal(d.chainId,10143);assert.ok(d.address,'F1 oracle is not deployed yet.');
const abi=JSON.parse(readFileSync('artifacts/F1LivingArt.json')).abi;
const client=createPublicClient({chain:monadTestnet,transport:http('https://testnet-rpc.monad.xyz')});
assert.equal(await client.getChainId(),10143);
const read=(functionName,args=[])=>client.readContract({address:d.address,abi,functionName,args});
const report=d.latestReport;assert.ok(report?.canonical,'Save the published source report with deployment configuration.');
assert.equal(keccak256(toHex(report.canonical)),report.sourceHash);assert.equal(await read('sourceHash'),report.sourceHash);
const raw=JSON.parse(report.canonical);const championshipYears=new Map();
for(const source of raw.champions){const list=source.body.MRData.StandingsTable.StandingsLists;assert.equal(list.length,1);const winner=list[0].ConstructorStandings[0];assert.equal(winner.position,'1');const id=winner.Constructor.constructorId;championshipYears.set(id,[...(championshipYears.get(id)??[]),Number(list[0].season)]);}
const rows=raw.standings.body.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
assert.equal(await read('teamCount'),BigInt(raw.roster.length));
const teams=[];
for(let i=0;i<raw.roster.length;i++){
  const [team,result]=await read('teamInfo',[BigInt(i)]);assert.equal(team.constructorId,raw.roster[i].constructorId);assert.equal(team.name,raw.roster[i].name);
  const years=championshipYears.get(team.constructorId)??[];assert.equal(result.titles,years.length);assert.equal(result.lastTitle,years.at(-1)??0);
  const standing=rows.find(r=>r.Constructor.constructorId===team.constructorId);assert.ok(standing);assert.equal(result.pointsMilli,Math.round(Number(standing.points)*1000));assert.equal(result.wins,Number(standing.wins));assert.equal(result.position,Number(standing.position));
  const svg=await read('teamSVG',[BigInt(i)]);assert.ok(svg.startsWith('<svg'));assert.ok(svg.includes(`${result.titles} CONSTRUCTORS TITLES`));
  teams.push({constructorId:team.constructorId,titles:result.titles,years,pointsMilli:result.pointsMilli,wins:result.wins,svgDigest:keccak256(toHex(svg)),svgBytes:Buffer.byteLength(svg)});
}
const supply=await read('totalSupply');let nft;
if(supply>0n){const id=await read('tokenByIndex',[0n]);const uri=await read('tokenURI',[id]);const metadata=JSON.parse(Buffer.from(uri.split(',')[1],'base64').toString());const teamId=await read('tokenTeam',[id]);assert.equal(Buffer.from(metadata.image.split(',')[1],'base64').toString(),await read('teamSVG',[teamId]));nft={id:id.toString(),owner:await read('ownerOf',[id]),name:metadata.name};}
const receipt=await client.getTransactionReceipt({hash:d.deploymentHash});assert.equal(receipt.status,'success');assert.equal(receipt.contractAddress.toLowerCase(),d.address.toLowerCase());
const evidence={checkedAt:new Date().toISOString(),chainId:10143,address:d.address,reporter:await read('reporter'),sourceHash:report.sourceHash,revision:(await read('revision')).toString(),season:await read('season'),round:await read('round'),throughSeason:await read('throughSeason'),deploymentHash:d.deploymentHash,totalSupply:supply.toString(),nft,teams,scope:'Public-chain reads and confirmed deployment. Exact raw report hash and derived team data compared. No oracle update or mint is signed by this script.'};
writeFileSync('docs/f1-testnet-evidence.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence,null,2));console.log('PASS: real source report, all team values, original SVGs and deployment independently checked.');
