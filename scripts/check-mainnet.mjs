import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createPublicClient,http,encodeDeployData,keccak256,toHex} from 'viem';
import {monad} from 'viem/chains';

const client=createPublicClient({chain:monad,transport:http('https://rpc.monad.xyz',{timeout:15000})});
assert.equal(await client.getChainId(),143,'Wrong RPC network');
const f1=JSON.parse(readFileSync('config/f1-mainnet.json'));
const shared=JSON.parse(readFileSync('config/shared-mainnet.json'));
assert.equal(f1.chainId,143);assert.equal(shared.chainId,143);
assert.ok(f1.address&&f1.constructorReport,'F1 mainnet deployment not confirmed');
assert.ok(shared.address,'Shared mainnet deployment not confirmed');
const report=f1.constructorReport;
assert.equal(keccak256(toHex(report.canonical)),report.sourceHash);
const toContract=r=>({season:r.season,round:r.round,throughSeason:r.throughSeason,observedAt:BigInt(r.observedAt),sourceHash:r.sourceHash,results:r.teams.map(t=>({titles:t.titles,lastTitle:t.lastTitle,pointsMilli:t.pointsMilli,wins:t.wins,position:t.position}))});
const fa=JSON.parse(readFileSync('public/deploy/F1LivingArt.json'));
const sa=JSON.parse(readFileSync('public/deploy/SharedLivingArt.json'));
for(const [d,artifact,args] of [[f1,fa,[report.teams.map(t=>({constructorId:t.constructorId,name:t.name,color:t.color})),toContract(report)]],[shared,sa,[f1.address]]]){
  const hash=d.deploymentHash??d.transactionHash;
  const receipt=await client.getTransactionReceipt({hash});assert.equal(receipt.status,'success');assert.equal(receipt.contractAddress.toLowerCase(),d.address.toLowerCase());
  const transaction=await client.getTransaction({hash});assert.equal(transaction.input.toLowerCase(),encodeDeployData({...artifact,args}).toLowerCase());assert.equal(transaction.value,0n);
  assert.ok(await client.getCode({address:d.address}));
}
const readF=(functionName,args=[])=>client.readContract({address:f1.address,abi:fa.abi,functionName,args});
const readS=(functionName,args=[])=>client.readContract({address:shared.address,abi:sa.abi,functionName,args});
assert.equal((await readF('reporter')).toLowerCase(),f1.reporter.toLowerCase());
assert.equal((await readS('artist')).toLowerCase(),shared.artist.toLowerCase());
assert.equal((await readS('oracle')).toLowerCase(),f1.address.toLowerCase());
assert.equal(await readF('teamCount'),BigInt(report.teams.length));
const latest=f1.latestReport??report;
assert.equal(keccak256(toHex(latest.canonical)),latest.sourceHash);assert.equal(await readF('sourceHash'),latest.sourceHash);
const teams=[];
for(let i=0;i<latest.teams.length;i++){
  const [identity,result]=await readF('teamInfo',[BigInt(i)]);const t=latest.teams[i];
  assert.equal(identity.constructorId,t.constructorId);assert.equal(identity.name,t.name);assert.equal(identity.color,t.color);
  for(const key of ['titles','lastTitle','pointsMilli','wins','position'])assert.equal(result[key],t[key]);
  assert.ok((await readF('teamSVG',[BigInt(i)])).startsWith('<svg'));teams.push({constructorId:t.constructorId,titles:t.titles});
}
const sharedSVG=await readS('compositionSVG');assert.ok(sharedSVG.includes('0 0 720 720'));
const evidence={chainId:143,checkedAt:new Date().toISOString(),f1:{address:f1.address,reporter:await readF('reporter'),sourceHash:await readF('sourceHash'),supply:(await readF('totalSupply')).toString(),teams},shared:{address:shared.address,oracle:await readS('oracle'),artist:await readS('artist'),supply:(await readS('totalSupply')).toString(),compositionRevision:(await readS('compositionRevision')).toString(),proposalCount:(await readS('proposalCount')).toString()},scope:'Read-only public Monad mainnet identity, exact constructor calldata, report values and original SVG checks. No transaction submitted by this check.'};
writeFileSync('docs/mainnet-evidence.json',JSON.stringify(evidence,null,2)+'\n');
console.log('PASS mainnet: both exact deployments, immutable identities, all real teams, report digest and original artwork.');
