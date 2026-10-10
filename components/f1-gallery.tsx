'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount, useWalletClient } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { encodeDeployData, formatEther, keccak256, toHex, type Abi, type Address, type Hash } from 'viem';
import { ArrowUpRight, ArrowRight, Download, RefreshCw, Radio, Trophy } from 'lucide-react';
import testnetConfigured from '@/config/f1-deployment.json';
import mainnetConfigured from '@/config/f1-mainnet.json';
import { f1Abi } from '@/lib/generated/F1LivingArt';
import { publicClient as testnetClient, mainnetClient, mainnetExplorer, explorer as testnetExplorer, shortAddress } from '@/lib/chain';
import { friendlyError, useTransaction, type TxState } from '@/lib/hooks';
import type { F1Report } from '@/lib/f1-data';
import { TxPanel, WalletButton } from './shell';

type Saved = { chainId: number; address: Address | null; transactionHash?: Hash | null };
const toContract = (r: F1Report) => ({ season: r.season, round: r.round, throughSeason: r.throughSeason, observedAt: BigInt(r.observedAt), sourceHash: r.sourceHash, results: r.teams.map(t => ({ titles: t.titles, lastTitle: t.lastTitle, pointsMilli: t.pointsMilli, wins: t.wins, position: t.position })) });
function download(name: string, data: string, type = 'application/json') { const url = URL.createObjectURL(new Blob([data], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); }

export function F1Gallery({mainnet = false}: {mainnet?: boolean} = {}) {
  const configured = mainnet ? mainnetConfigured : testnetConfigured;
  const publicClient = mainnet ? mainnetClient : testnetClient;
  const explorer = mainnet ? mainnetExplorer : testnetExplorer;
  const networkId = mainnet ? 143 : 10143;
  const networkName = mainnet ? 'Monad Mainnet' : 'Monad Testnet';
  const storageKey = mainnet ? 'living-vault-f1-mainnet' : 'living-vault-f1';
  const { address, chainId } = useAccount(); const { data: wallet } = useWalletClient(); const cache = useQueryClient();
  const [deployment, setDeployment] = useState<Saved>(configured as Saved); const [selected, setSelected] = useState(4);
  const [deployTx, setDeployTx] = useState<TxState>({ stage: 'idle', label: '' }); const [lastMint, setLastMint] = useState<bigint>();
  const { run, tx, busy, retryRefresh } = useTransaction(publicClient, networkId);
  useEffect(() => { if (!configured.address) { try { const stored = JSON.parse(localStorage.getItem(storageKey) || 'null'); if (stored?.chainId === networkId && /^0x[0-9a-fA-F]{40}$/.test(stored.address)) setDeployment(stored); } catch {} } }, [mainnet]);
  const source = useQuery<F1Report>({ queryKey: ['f1-source'], staleTime: 300000, queryFn: async () => { const response = await fetch('/api/f1'); const body = await response.json(); if (!response.ok) throw new Error(body.error); if (keccak256(toHex(body.canonical)) !== body.sourceHash) throw new Error('Source digest mismatch'); return body; } });
  const oracle = useQuery({ queryKey: ['f1-oracle', networkId, deployment.address], enabled: !!deployment.address, refetchInterval: 15000, queryFn: async () => {
    const a = deployment.address!;
    const [reporter, hash, revision, season, round, through, observed, total] = await Promise.all([
      publicClient.readContract({address:a,abi:f1Abi,functionName:'reporter'}), publicClient.readContract({address:a,abi:f1Abi,functionName:'sourceHash'}), publicClient.readContract({address:a,abi:f1Abi,functionName:'revision'}), publicClient.readContract({address:a,abi:f1Abi,functionName:'season'}), publicClient.readContract({address:a,abi:f1Abi,functionName:'round'}), publicClient.readContract({address:a,abi:f1Abi,functionName:'throughSeason'}), publicClient.readContract({address:a,abi:f1Abi,functionName:'observedAt'}), publicClient.readContract({address:a,abi:f1Abi,functionName:'teamCount'})]);
    const teams = await Promise.all(Array.from({length:Number(total)}, (_,i) => publicClient.readContract({address:a,abi:f1Abi,functionName:'teamInfo',args:[BigInt(i)]})));
    return {reporter,hash,revision,season,round,through,observed,teams};
  } });
  const artwork = useQuery({ queryKey: ['f1-art', networkId, deployment.address, selected, oracle.data?.hash], enabled: !!oracle.data && selected < oracle.data.teams.length, queryFn: () => publicClient.readContract({address:deployment.address!,abi:f1Abi,functionName:'teamSVG',args:[BigInt(selected)]}) });
  const owned = useQuery({ queryKey: ['f1-owned', networkId, deployment.address, address, lastMint?.toString()], enabled: !!deployment.address && !!address, queryFn: async () => { const count = await publicClient.readContract({address:deployment.address!,abi:f1Abi,functionName:'balanceOf',args:[address!]}); const ids = await Promise.all(Array.from({length:Math.min(Number(count),50)},(_,i)=>publicClient.readContract({address:deployment.address!,abi:f1Abi,functionName:'tokenOfOwnerByIndex',args:[address!,BigInt(i)]}))); return {count,ids}; } });
  const isReporter = !!address && !!oracle.data && oracle.data.reporter.toLowerCase() === address.toLowerCase();
  const inFlight = busy || ['estimating','signature','submitted','confirmed'].includes(deployTx.stage);
  const active = oracle.data?.teams[selected]; const real = source.data?.teams[selected];
  async function persist(d: Saved, report: F1Report) { const response = await fetch('/api/f1-deployment', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...d,report})}); const result = await response.json(); if (result.error) throw new Error(`Confirmed on-chain, but configuration was not saved: ${result.error}`); }
  async function deploy() {
    if (!wallet || !address || !source.data) return;
    let hash: Hash | undefined; let confirmed = false;
    const pendingKey = `${storageKey}-pending:${address.toLowerCase()}`;
    try {
      if (chainId !== networkId || await wallet.getChainId() !== networkId || await publicClient.getChainId() !== networkId) throw new Error(`Switch to ${networkName}.`);
      setDeployTx({stage:'estimating',label:'Deploy the real-data F1 oracle and collection'});
      const r = await source.refetch({throwOnError:true}); const report = r.data!;
      const response = await fetch('/deploy/F1LivingArt.json'); if (!response.ok) throw new Error('F1 contract build unavailable');
      const artifact = await response.json() as {abi:Abi;bytecode:`0x${string}`};
      const args = [report.teams.map(t=>({constructorId:t.constructorId,name:t.name,color:t.color})),toContract(report)];
      const pending = JSON.parse(localStorage.getItem(pendingKey) || 'null');
      let receipt;
      if (pending?.hash) { hash=pending.hash; }
      else {
        const estimate = await publicClient.estimateGas({account:address,data:encodeDeployData({...artifact,args})}); const gas=estimate+estimate/20n; const fees=await publicClient.estimateFeesPerGas();
        if (mainnet && await publicClient.getBalance({address}) < gas*fees.maxFeePerGas) throw new Error('Not enough MON on Monad Mainnet for the maximum deployment fee.');
        setDeployTx({stage:'signature',label:`Deploy F1 collection on ${networkName}`,cost:formatEther(gas*fees.maxFeePerGas)});
        hash=await wallet.deployContract({...artifact,args,account:address,chain:publicClient.chain,gas,...fees});
        localStorage.setItem(pendingKey,JSON.stringify({hash,report}));
      }
      setDeployTx({stage:'submitted',label:'F1 oracle deployment',hash});
      while (!receipt) { try {receipt=await publicClient.waitForTransactionReceipt({hash:hash!,timeout:60000});} catch {setDeployTx({stage:'submitted',label:'F1 oracle deployment · still pending',hash});await new Promise(r=>setTimeout(r,3000));} }
      if (receipt.status!=='success'||!receipt.contractAddress) {localStorage.removeItem(pendingKey);throw new Error('Deployment reverted');}
      confirmed=true;setDeployTx({stage:'confirmed',label:'Checking the F1 oracle',hash});
      const deployedReporter=await publicClient.readContract({address:receipt.contractAddress,abi:f1Abi,functionName:'reporter'});
      if(deployedReporter.toLowerCase()!==address.toLowerCase())throw new Error('Reporter mismatch');
      const d:Saved={chainId:networkId,address:receipt.contractAddress,transactionHash:hash};
      localStorage.setItem(storageKey,JSON.stringify(d));setDeployment(d);await persist(d,pending?.report??report);localStorage.removeItem(pendingKey);
      setDeployTx({stage:'refreshed',label:'Real F1 results published with the collection',hash});
    }catch(error){setDeployTx({stage:confirmed?'confirmed':'failed',label:'F1 deployment',hash,error:friendlyError(error)});}
  }
  async function publish() { if (!deployment.address || !isReporter) return; let prepared=false;try {const latest=(await source.refetch({throwOnError:true})).data!; if(latest.sourceHash===oracle.data?.hash)throw new Error('Published data already matches the source.');prepared=true; await run('Publish real-source F1 results',{address:deployment.address,abi:f1Abi,functionName:'publish',args:[toContract(latest)]},async receipt=>{await oracle.refetch({throwOnError:true});await persist({...deployment,transactionHash:receipt.transactionHash},latest);});}catch(error){if(!prepared)setDeployTx({stage:'failed',label:'F1 source update',error:friendlyError(error)});} }
  async function mint() { if(!deployment.address)return;try{await run('Mint your F1 living artwork',{address:deployment.address,abi:f1Abi,functionName:'mint',args:[BigInt(selected)]},async receipt=>{const minted=receipt.logs.find(l=>l.topics[0]===keccak256(toHex('TeamMinted(uint256,uint256,address)')));if(minted?.topics[1])setLastMint(BigInt(minted.topics[1]));await owned.refetch({throwOnError:true});});}catch{} }
  return <section className="f1-page"><Link href="/" className="back-link">Back to exhibition<ArrowUpRight size={16}/></Link><div className="page-title"><span className="eyebrow">REAL RESULTS / LIVING ART</span><h1>The F1 collection<span className="red">.</span></h1><p>Every championship leaves a mark. Every race adds a new line.</p></div>
    {mainnet && <div className="network-banner"><span>Monad Mainnet · 143. Wallet confirmations spend real MON. No deposit custody.</span><Link href="/mainnet/together">Shared collection<ArrowUpRight size={15}/></Link></div>}
    <div className="f1-status"><span><Radio size={17}/>{oracle.data ? `On-chain · revision ${oracle.data.revision}` : 'Awaiting on-chain publication'}</span><span>2026 grid · Constructors titles</span><button className="icon-button" title="Refresh real results" aria-label="Refresh real results" disabled={inFlight} onClick={()=>{void source.refetch();if(deployment.address)void oracle.refetch();if(oracle.data)void artwork.refetch();}}><RefreshCw size={18}/></button></div>
    {source.isError&&<p className="error" role="alert">Real sports data unavailable: {source.error.message}. No substitute data is displayed.</p>}{oracle.isError&&<p className="error" role="alert">On-chain feed unavailable. Please refresh; source results below are not a confirmed update.</p>}
    <div className="f1-feature"><div className="f1-canvas">{artwork.data ? <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(artwork.data)}`} alt={`${active?.[0].name} artwork from the published F1 oracle`}/> : <div className="f1-art-empty"><Trophy size={38}/><p>{artwork.isPending&&oracle.data?'Reading on-chain artwork…':'The artwork opens after the real results are published on-chain.'}</p></div>}</div><div className="f1-feature-copy"><label className="field-label" htmlFor="f1-team">Choose your team</label><select id="f1-team" value={selected} onChange={e=>setSelected(Number(e.target.value))}>{(oracle.data?.teams.map(t=>t[0].name)??source.data?.teams.map(t=>t.name)??[]).map((name,i)=><option value={i} key={name}>{name}</option>)}</select><h2>{active?.[0].name??real?.name??'Reading the grid…'}</h2><div className="f1-title-total"><strong>{active?.[1].titles??real?.titles??'—'}</strong><span>Constructors' Championships<br/>through {oracle.data?.through??source.data?.throughSeason??'—'}</span></div><p>Titles determine the layers. Race points rotate the composition; wins add detail. A published oracle update changes the on-chain SVG and every NFT linked to that team.</p><p className="f1-feed-label">{oracle.data?`Published results: round ${oracle.data.round}. Artwork is the original contract SVG.`:'Real source results shown here are not yet published on-chain.'}</p>{!address?<WalletButton/>:deployment.address?<button className="button full" disabled={inFlight||chainId!==networkId||!oracle.data} onClick={mint}>Mint this team's artwork<ArrowRight size={18}/></button>:<button className="button full" disabled={inFlight||chainId!==networkId||!source.data} onClick={deploy}>Deploy F1 oracle & collection<ArrowRight size={18}/></button>}{artwork.data&&<button className="text-button" onClick={()=>download(`f1-${active?.[0].constructorId}.svg`,artwork.data!,'image/svg+xml')}><Download size={16}/>Download original on-chain SVG</button>}<p className="fine-print">Free mint plus {mainnet ? 'real MON' : 'test MON'} gas. This separate F1 collection has no mUSDC deposit or redemption balance.</p>{lastMint&&<p role="status" className="f1-mint-success">Minted No. {lastMint.toString()} · <Link href={`${mainnet?"/mainnet":""}/nft/f1/${lastMint}`}>View NFT<ArrowUpRight size={14}/></Link></p>}{owned.data&&owned.data.count>0n&&<p className="fine-print">You own {owned.data.count.toString()} F1 artwork{owned.data.count===1n?'':'s'}. {owned.data.ids.map(id=><Link className="f1-owned" key={id.toString()} href={`${mainnet?"/mainnet":""}/nft/f1/${id}`}>No. {id.toString()}</Link>)}</p>}</div></div>
    <TxPanel explorerUrl={explorer} tx={deployTx} retry={()=>void deploy()}/><TxPanel explorerUrl={explorer} tx={tx} retry={()=>void retryRefresh()}/>
    <section className="f1-grid-section"><div className="section-heading"><div><span className="eyebrow">ALL 11 TEAMS / EXACT CONSTRUCTOR IDENTITY</span><h2>The championship record.</h2></div></div><p>Counts include completed seasons only. Predecessor teams are not merged. Championship years can be checked against the original source responses.</p><div className="f1-table-wrap"><table><thead><tr><th>Team</th><th>Source titles</th><th>Published titles</th><th>Source points</th><th>Championship years</th></tr></thead><tbody>{source.data?.teams.map((team,i)=>{const published=oracle.data?.teams.find(t=>t[0].constructorId===team.constructorId);return <tr key={team.constructorId} className={selected===i?'selected':''}><td><button onClick={()=>setSelected(i)}><span className="f1-swatch" style={{background:`#${team.color.toString(16).padStart(6,'0')}`}}/>{team.name}</button></td><td>{team.titles}</td><td>{published?.[1].titles??'Not published'}</td><td>{team.pointsMilli/1000}</td><td>{team.years.length?team.years.map(y=><a key={y} href={`https://api.jolpi.ca/ergast/f1/${y}/constructorstandings/1.json?limit=100`} target="_blank" rel="noreferrer">{y}</a>):'None under this identity'}</td></tr>})}</tbody></table></div></section>
    <section className="f1-provenance"><span className="eyebrow">ORACLE PROVENANCE</span><h2>Follow the data, all the way.</h2><p>Jolpica results → validated championship ledger → authorized publisher → {networkName} → on-chain generative SVG. This is a custom, single-reporter push oracle. The reporter is trusted to publish correct data; the source digest lets anyone verify the exact report. It is not a decentralized consensus feed.</p><dl><div><dt>Source</dt><dd><a href="https://api.jolpi.ca/ergast/f1/2026/constructorstandings.json?limit=100" target="_blank" rel="noreferrer">Jolpica F1 / 2026 standings<ArrowUpRight size={15}/></a></dd></div><div><dt>Source retrieved</dt><dd>{source.data?new Date(source.data.observedAt*1000).toISOString():'Awaiting source'}</dd></div><div><dt>Published observation</dt><dd>{oracle.data?new Date(Number(oracle.data.observed)*1000).toISOString():'Not published'}</dd></div><div><dt>Reporter</dt><dd>{oracle.data?<a href={`${explorer}/address/${oracle.data.reporter}`} target="_blank" rel="noreferrer">{shortAddress(oracle.data.reporter)}</a>:'Assigned to the deploying wallet'}</dd></div><div><dt>Oracle / collection</dt><dd>{deployment.address?<a href={`${explorer}/address/${deployment.address}`} target="_blank" rel="noreferrer">{deployment.address}</a>:'Not deployed'}</dd></div><div><dt>Published source digest</dt><dd>{oracle.data?.hash??'Not published'}</dd></div><div><dt>Source comparison</dt><dd>{source.data&&oracle.data?(source.data.sourceHash===oracle.data.hash?'Exact report digest match':'Source differs; a publisher update is required'):'Awaiting publication'}</dd></div></dl><div className="f1-oracle-actions">{source.data&&<button className="button secondary" onClick={()=>download(`f1-report-${source.data!.sourceHash}.json`,JSON.stringify(source.data,null,2))}><Download size={17}/>Download source report</button>}{deployment.address&&<button className="button secondary" onClick={()=>download('f1-deployment.json',JSON.stringify(deployment,null,2))}><Download size={17}/>Export deployment</button>}{isReporter&&<button className="button" disabled={inFlight||chainId!==networkId||!source.data||source.data.sourceHash===oracle.data?.hash} onClick={publish}>Publish latest real results<ArrowRight size={17}/></button>}</div><p className="fine-print">The source is cached for up to five minutes. Publishing unchanged results is disabled. Championship totals change after a completed season; points and wins can change after races. No synthetic results or forced evolution button.</p></section>
  </section>;
}
