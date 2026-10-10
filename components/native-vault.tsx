'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useAccount,useWalletClient} from 'wagmi';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {ArrowRight,ArrowUpRight,RefreshCw,Send,Download} from 'lucide-react';
import {decodeEventLog,formatEther,isAddress,parseEther,type Address,type Hash,type Hex} from 'viem';
import {nativeVaultAbi} from '@/lib/generated/NativeLivingVault';
import {mainnetClient,mainnetExplorer,decodeMetadata,shortAddress} from '@/lib/chain';
import {friendlyError,useTransaction} from '@/lib/hooks';
import configuration from '@/config/native-mainnet.json';
import {ArtFrame} from './art';
import {Dialog,TxPanel,WalletButton} from './shell';

type Deployment={chainId:number;address:Address|null;transactionHash:Hash|null;blockNumber:string|null};
const storageKey='living-vault-native-mainnet';
const pendingKey=storageKey+'-pending';
const zero=/^0x0{40}$/i;
export function NativeVault({tokenId}:{tokenId?:string}) {
  const {address,chainId}=useAccount();const {data:wallet}=useWalletClient();const queryClient=useQueryClient();
  const [deployment,setDeployment]=useState<Deployment>(configuration as Deployment);
  const [loaded,setLoaded]=useState(false);const [deployBusy,setDeployBusy]=useState(false);
  const [value,setValue]=useState('0.01');const [recipient,setRecipient]=useState('');
  const [modal,setModal]=useState<'transfer'|'redeem'|null>(null);const [burned,setBurned]=useState(false);
  const [original,setOriginal]=useState(false);
  const {tx,busy,run,setTx,retryRefresh}=useTransaction(mainnetClient,143);
  useEffect(()=>{
    if(!configuration.address){try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved?.chainId===143&&isAddress(saved.address)&&!zero.test(saved.address))setDeployment(saved);}catch{/* Invalid local configuration is ignored. */}}
    setLoaded(true);
  },[]);
  useEffect(()=>{setBurned(false);setModal(null);},[tokenId]);
  const contract=deployment.address;
  const identity=useQuery({queryKey:['native-identity',contract],enabled:loaded&&!!contract,queryFn:async()=>{
    const artifact=await fetch('/deploy/NativeLivingVault.json').then(r=>r.json());
    const code=await mainnetClient.getCode({address:contract!});
    if(!artifact.deployedBytecode||code?.toLowerCase()!==artifact.deployedBytecode.toLowerCase())throw Error('This address does not contain the expected MON vault contract. Transactions are disabled.');
    return true;
  }});
  const ready=identity.data===true&&!identity.isError;const inFlight=busy||deployBusy;
  const balance=useQuery({queryKey:['native-balance',address],enabled:!!address,queryFn:()=>mainnetClient.getBalance({address:address!})});
  const walletCode=useQuery({queryKey:['native-wallet-code',address],enabled:!!address,queryFn:async()=>await mainnetClient.getCode({address:address!})??'0x'});
  const reserveBlocked=walletCode.data?.toLowerCase().startsWith('0xef0100')&&balance.data!==undefined&&balance.data<parseEther('10');
  const ids=useQuery({queryKey:['native-collection',contract,address],enabled:ready&&!!address,queryFn:async()=>{
    const count=await mainnetClient.readContract({address:contract!,abi:nativeVaultAbi,functionName:'balanceOf',args:[address!]});
    const result:bigint[]=[];
    for(let offset=0n;offset<count;offset+=20n){const length=Number(count-offset>20n?20n:count-offset);result.push(...await Promise.all(Array.from({length},(_,i)=>mainnetClient.readContract({address:contract!,abi:nativeVaultAbi,functionName:'tokenOfOwnerByIndex',args:[address!,offset+BigInt(i)]}))));}
    return result;
  }});
  const validId=tokenId&&/^[1-9]\d{0,76}$/.test(tokenId)&&BigInt(tokenId)<2n**256n?BigInt(tokenId):undefined;
  const piece=useQuery({queryKey:['native-piece',contract,tokenId],enabled:ready&&validId!==undefined&&!burned,queryFn:async()=>{
    const [info,owner,uri]=await Promise.all([
      mainnetClient.readContract({address:contract!,abi:nativeVaultAbi,functionName:'vaultInfo',args:[validId!]}),
      mainnetClient.readContract({address:contract!,abi:nativeVaultAbi,functionName:'ownerOf',args:[validId!]}),
      mainnetClient.readContract({address:contract!,abi:nativeVaultAbi,functionName:'tokenURI',args:[validId!]})
    ]);return {principal:info[0],count:info[1],level:Number(info[2]),owner,uri,image:decodeMetadata(uri).image};
  }});
  const next=useQuery({queryKey:['native-next',contract],enabled:ready&&!tokenId,queryFn:()=>mainnetClient.readContract({address:contract!,abi:nativeVaultAbi,functionName:'nextTokenId'})});
  let amount=0n;let validation='';
  try{if(!/^\d+(\.\d{0,18})?$/.test(value))throw Error();amount=parseEther(value);}catch{validation='Enter a MON amount with up to 18 decimals.';}
  if(!validation&&amount===0n)validation='Enter an amount greater than zero.';
  if(!validation&&!tokenId&&amount<parseEther('0.01'))validation='The first deposit must be at least 0.01 MON.';
  if(!validation&&amount>2n**128n-1n-(piece.data?.principal??0n))validation='This deposit exceeds the contract accounting limit.';
  if(!validation&&balance.data!==undefined&&amount>=balance.data)validation='Leave enough MON in your wallet for the network fee.';
  const [debounced,setDebounced]=useState(amount);
  useEffect(()=>{const timer=setTimeout(()=>setDebounced(amount),300);return()=>clearTimeout(timer);},[amount]);
  const previewId=validId??next.data;
  const preview=useQuery({queryKey:['native-preview',contract,previewId?.toString(),debounced.toString(),piece.data?.count],enabled:ready&&previewId!==undefined&&debounced>0n&&!burned&&(!tokenId||!!piece.data),queryFn:()=>mainnetClient.readContract({address:contract!,abi:nativeVaultAbi,functionName:'previewSVG',args:[previewId!,(piece.data?.principal??0n)+debounced,BigInt(tokenId?(piece.data?.count??0)+1:0)]})});
  const owns=!!address&&piece.data?.owner.toLowerCase()===address.toLowerCase();
  const correctNetwork=chainId===143;
  async function refresh(){await queryClient.invalidateQueries({predicate:q=>String(q.queryKey[0]).startsWith('native-')},{throwOnError:true});}
  async function deploy(){
    if(!wallet||!address||!correctNetwork||inFlight)return;
    setDeployBusy(true);
    try{
      if(await wallet.getChainId()!==143||await mainnetClient.getChainId()!==143)throw Error('Switch to Monad Mainnet before continuing.');
      let hash=localStorage.getItem(pendingKey) as Hash|null;
      if(!hash){
        setTx({stage:'estimating',label:'Deploy MON vault'});
        const response=await fetch('/deploy/NativeLivingVault.json');if(!response.ok)throw Error('Deployment artifact unavailable.');
        const artifact=await response.json() as {bytecode:Hex};
        const estimate=await mainnetClient.estimateGas({account:address,data:artifact.bytecode});const gas=estimate+estimate/20n;
        const fees=await mainnetClient.estimateFeesPerGas();const maximum=gas*fees.maxFeePerGas;
        if(await mainnetClient.getBalance({address})<maximum)throw Error('Not enough MON for the maximum deployment fee.');
        setTx({stage:'signature',label:'Deploy MON vault',cost:formatEther(maximum)});
        hash=await wallet.sendTransaction({account:address,chain:mainnetClient.chain,data:artifact.bytecode,gas,...fees});localStorage.setItem(pendingKey,hash);
      }
      setTx(previous=>({...previous,stage:'submitted',label:'Deploy MON vault',hash:hash!}));
      const receipt=await mainnetClient.waitForTransactionReceipt({hash,timeout:120_000});
      if(receipt.status!=='success'||!receipt.contractAddress){localStorage.removeItem(pendingKey);throw Error('Deployment reverted.');}
      const result:Deployment={chainId:143,address:receipt.contractAddress,transactionHash:hash,blockNumber:receipt.blockNumber.toString()};
      localStorage.setItem(storageKey,JSON.stringify(result));localStorage.removeItem(pendingKey);setDeployment(result);
      setTx(previous=>({...previous,stage:'refreshed',label:'MON vault deployed. Deposit MON to create your first artwork.',hash:hash!}));
      const saved=await fetch('/api/native-deployment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(result)}).then(r=>r.json());
      if(saved.error)setTx(previous=>({...previous,error:`Deployed, but public configuration could not be saved: ${saved.error}`}));
    }catch(error){const pending=localStorage.getItem(pendingKey) as Hash|null;setTx(previous=>({...previous,stage:pending?'submitted':'failed',hash:pending??previous.hash,error:pending?'Deployment is still pending. Retry to check the same transaction without signing again.':friendlyError(error)}));}
    finally{setDeployBusy(false);}
  }
  async function submit(){
    if(!ready||!address||!correctNetwork||validation||inFlight||burned||tokenId&&!owns)return;
    try{await run(tokenId?'Deposit MON & evolve':'Deposit MON & mint',{address:contract!,abi:nativeVaultAbi,functionName:tokenId?'topUp':'mint',args:tokenId?[validId!]:[address],value:amount},async receipt=>{
      await refresh();
      if(!tokenId){for(const log of receipt.logs){try{const event=decodeEventLog({abi:nativeVaultAbi,data:log.data,topics:log.topics});if(log.address.toLowerCase()===contract!.toLowerCase()&&event.eventName==='Minted')window.location.assign(`/mainnet/vault/${event.args.tokenId}`);}catch{/* Ignore unrelated logs. */}}}
    });}catch{/* TxPanel displays the failure. */}
  }
  async function transfer(){if(!owns||!validId||!isAddress(recipient)||zero.test(recipient)||recipient.toLowerCase()===address?.toLowerCase()||recipient.toLowerCase()===contract?.toLowerCase())return;
    try{await run('Transfer MON vault',{address:contract!,abi:nativeVaultAbi,functionName:'safeTransferFrom',args:[address!,recipient,validId]},refresh);setModal(null);}catch{/* TxPanel displays the failure. */}}
  async function redeem(){if(!owns||!validId||recipient&&(!isAddress(recipient)||zero.test(recipient)||recipient.toLowerCase()===contract?.toLowerCase()))return;
    try{await run('Redeem MON principal',{address:contract!,abi:nativeVaultAbi,functionName:recipient?'redeemTo':'redeem',args:recipient?[validId,recipient]:[validId]},async()=>{setBurned(true);setModal(null);await queryClient.invalidateQueries({queryKey:['native-collection']});await queryClient.invalidateQueries({queryKey:['native-balance']});});}catch{/* A failed payout retains the NFT and principal. */}}
  const error=identity.error||piece.error||ids.error||balance.error||preview.error||next.error;
  return <section className="native-page"><Link href="/mainnet" className="back-link">Mainnet exhibition<ArrowUpRight size={16}/></Link>
    <header className="section-heading"><div><span className="eyebrow">NATIVE MON / LIVING CUSTODY</span><h1>{tokenId?`MON Vault No. ${tokenId}`:'Your MON. Living art.'}<span className="red">.</span></h1></div><Link href="/docs#native-mon" className="text-link">Vault rules<ArrowUpRight size={16}/></Link></header>
    <div className="network-banner">Monad Mainnet · 143. Deposits hold real MON. Experimental contract, not independently audited. No yield.</div>
    {contract&&<div className="native-explorer-actions">{deployment.transactionHash&&<a className="button secondary" href={`${mainnetExplorer}/tx/${deployment.transactionHash}`} target="_blank" rel="noreferrer">View deployment transaction<ArrowUpRight size={16} aria-hidden="true"/></a>}<a className="text-link" href={`${mainnetExplorer}/address/${contract}`} target="_blank" rel="noreferrer">View contract<ArrowUpRight size={15} aria-hidden="true"/></a></div>}
    {tokenId&&validId===undefined&&<p role="alert" className="error">Invalid vault number.</p>}
    {error&&<p role="alert" className="error">{friendlyError(error)} No substitute balances or artwork are displayed.</p>}
    {!loaded?<p>Loading vault configuration...</p>:!contract?<div className="native-deploy"><h2>Open the MON collection.</h2><p>Deploy one non-upgradeable contract. Deployment pays gas only; deposits are a separate transaction.</p>{!address?<WalletButton/>:<button className="button" disabled={!correctNetwork||inFlight} onClick={()=>void deploy()}>Deploy MON vault<ArrowRight size={18}/></button>}</div>:<div className="native-layout"><div>
      {piece.data&&!burned?<ArtFrame image={piece.data.image} original={original} evolving={tx.stage==='refreshed'}/>:!tokenId&&preview.data?<ArtFrame image={`data:image/svg+xml;base64,${btoa(preview.data)}`} original={original}/>:<div className="shared-empty"><h2>{burned?'Principal returned. Artwork burned.':tokenId?'Reading the on-chain artwork...':'The first deposit awaits.'}</h2></div>}
      {(piece.data||preview.data)&&!burned&&<div className="native-art-tools"><span>{piece.data?`Level ${piece.data.level} / 8 · ${piece.data.count} top-ups`:'On-chain deposit preview'}</span><button className="text-button" aria-pressed={original} onClick={()=>setOriginal(!original)}>{original?'Browser presentation':'Original on-chain SVG'}</button>{piece.data&&<button className="text-button" onClick={()=>{const a=document.createElement('a');a.href=piece.data!.image;a.download=`living-vault-mon-${tokenId}.svg`;a.click();}}><Download size={15}/>SVG</button>}</div>}
    </div><div className="native-controls">
      <span className="eyebrow">{tokenId?'HELD IN THIS VAULT':'DEPOSIT & MINT'}</span><h2>{tokenId&&piece.data?`${formatEther(piece.data.principal)} MON`:'Create a MON vault'}</h2>
      {piece.data&&<p>Owner: <span title={piece.data.owner}>{shortAddress(piece.data.owner)}</span></p>}
      {balance.data!==undefined&&<p className="muted">Wallet: {formatEther(balance.data)} MON</p>}
      {reserveBlocked&&<p role="alert" className="error">Smart-account reserve: this delegated wallet cannot deposit MON below Monad's 10 MON reserve. Use a regular account, or keep 10 MON plus your deposit and gas in this account. <a href="https://docs.monad.xyz/developer-essentials/reserve-balance" target="_blank" rel="noreferrer">Network rules</a></p>}
      {burned?<Link href="/mainnet/vault" className="button">Create another vault<ArrowRight size={18}/></Link>:(!tokenId||owns)&&<><label className="field-label" htmlFor="native-amount">{tokenId?'Add MON':'Deposit MON'}</label><input id="native-amount" className="text-input" inputMode="decimal" value={value} disabled={inFlight} onChange={e=>setValue(e.target.value)}/>{validation&&<p className="error">{validation}</p>}<p className="fine-print">{tokenId?'Every confirmed top-up evolves your artwork.':'Minimum first deposit: 0.01 MON.'} The deposit is principal, not a purchase fee. Keep MON aside for gas.</p>{!address?<WalletButton/>:<button className="button full" disabled={!ready||!correctNetwork||!!validation||inFlight||!!tokenId&&!piece.data} onClick={()=>void submit()}>{tokenId?'Deposit MON & evolve':'Deposit MON & mint'}<ArrowRight size={18}/></button>}</>}
      {owns&&!burned&&<div className="vault-actions"><div><button className="button secondary" disabled={!correctNetwork||inFlight} onClick={()=>{setRecipient('');setModal('transfer');}}><Send size={16}/>Transfer</button><button className="button secondary" disabled={!correctNetwork||inFlight} onClick={()=>{setRecipient('');setModal('redeem');}}>Redeem MON</button></div></div>}
      <button className="text-button" disabled={inFlight} onClick={()=>void refresh().catch(()=>{})}><RefreshCw size={15}/>Refresh on-chain state</button>
    </div></div>}
    <TxPanel tx={tx} retry={()=>void retryRefresh()} explorerUrl={mainnetExplorer}/>
    {ids.data&&<section id="collection" className="native-collection"><div className="section-heading"><h2>Your MON vaults</h2><Link href="/mainnet/vault" className="text-link">New vault<ArrowRight size={16}/></Link></div>{ids.data.length?<div className="native-vault-links">{ids.data.map(id=><Link key={id.toString()} href={`/mainnet/vault/${id}`}>Vault No. {id.toString()}<ArrowUpRight size={16}/></Link>)}</div>:<p className="muted">No MON vault NFTs owned by this wallet.</p>}</section>}
    {modal==='transfer'&&<Dialog title="Transfer MON vault" onClose={()=>{if(!inFlight)setModal(null);}}><p>The NFT and its {formatEther(piece.data!.principal)} MON principal move together. The recipient becomes the only owner.</p><label htmlFor="native-recipient" className="field-label">Recipient address</label><input id="native-recipient" className="text-input mono" value={recipient} onChange={e=>setRecipient(e.target.value)} disabled={inFlight}/><button className="button full" disabled={inFlight||!correctNetwork||!isAddress(recipient)||zero.test(recipient)||recipient.toLowerCase()===address?.toLowerCase()||recipient.toLowerCase()===contract?.toLowerCase()} onClick={()=>void transfer()}>Transfer vault<Send size={16}/></button><TxPanel tx={tx} explorerUrl={mainnetExplorer}/></Dialog>}
    {modal==='redeem'&&<Dialog title="Redeem your MON" onClose={()=>{if(!inFlight)setModal(null);}}><p>Return <strong>{formatEther(piece.data!.principal)} MON</strong> to {recipient&&isAddress(recipient)?shortAddress(recipient):shortAddress(piece.data!.owner)} and permanently burn this NFT. Network fees are separate.</p><label htmlFor="native-payout" className="field-label">Alternative payout address (optional)</label><input id="native-payout" className="text-input mono" placeholder="Default: current owner" value={recipient} onChange={e=>setRecipient(e.target.value)} disabled={inFlight}/><button className="button full" disabled={inFlight||!correctNetwork||!!recipient&&(!isAddress(recipient)||zero.test(recipient)||recipient.toLowerCase()===contract?.toLowerCase())} onClick={()=>void redeem()}>Burn NFT & return MON<ArrowRight size={18}/></button><TxPanel tx={tx} explorerUrl={mainnetExplorer}/></Dialog>}
  </section>;
}
