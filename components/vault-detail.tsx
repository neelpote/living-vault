'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAddress, parseAbi, type Address } from 'viem';
import { ArrowLeft, ArrowRight, ArrowUpRight, Copy, Download, RefreshCw, Send, X, Check, Eye } from 'lucide-react';
import { useVault, useTransaction, fetchVault } from '@/lib/hooks';
import { publicClient, explorer, money, shortAddress, type Vault } from '@/lib/chain';
import { vaultAbi } from '@/lib/generated/LivingVault';
import { useDeployment } from './providers';
import { ArtFrame, unlocks } from './art';
import { Dialog, TxPanel } from './shell';
import { Studio } from './studio';

export function VaultDetail({ tokenId }: { tokenId: string }) {
  const valid = /^[1-9]\d{0,76}$/.test(tokenId); const id = valid ? BigInt(tokenId) : undefined;
  const query = useVault(id); const { deployment } = useDeployment(); const { address, chainId } = useAccount();
  const [modal, setModal] = useState<'deposit' | 'transfer' | 'redeem' | null>(null); const [previous, setPrevious] = useState<string>();
  const [evolving, setEvolving] = useState(false); const [redeemed, setRedeemed] = useState(false); const [lastVault, setLastVault] = useState<Vault>();
  const [recipient, setRecipient] = useState(''); const [copied, setCopied] = useState(''); const [holding, setHolding] = useState(false);
  const [depositBusy, setDepositBusy] = useState(false);
  const [originalArt, setOriginalArt] = useState(false);
  const { tx, busy, run, setTx, retryRefresh } = useTransaction(); const queryClient = useQueryClient(); const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const v = redeemed ? lastVault : query.data; const owner = v && address?.toLowerCase() === v.owner.toLowerCase();
  useEffect(() => { if (query.data) setLastVault(query.data); }, [query.data]);
  useEffect(() => { if (!evolving) return; const t = setTimeout(() => setEvolving(false), 2100); return () => clearTimeout(t); }, [evolving]);
  useEffect(() => { const hash = sessionStorage.getItem(`vault-minted-${tokenId}`); if (hash) { setTx({ stage: 'refreshed', label: 'Your vault was minted', hash: hash as `0x${string}` }); sessionStorage.removeItem(`vault-minted-${tokenId}`); setEvolving(true); } }, [tokenId, setTx]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  async function copy(text: string, label: string) { try { await navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(''), 2000); } catch { setCopied('Copy unavailable'); } }
  function download() { if (!v) return; const svg = atob(v.image.split(',')[1]); const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); const a = document.createElement('a'); a.href = url; a.download = `living-vault-${tokenId}.svg`; a.click(); URL.revokeObjectURL(url); }
  async function transfer() { if (!v || !address || !isAddress(recipient) || recipient.toLowerCase() === address.toLowerCase()) return; try { await run('Transfer the artwork and vault', { address: deployment.livingVault!, abi: vaultAbi, functionName: 'safeTransferFrom', args: [address, recipient as Address, v.id] }, async () => { await query.refetch({ throwOnError: true }); setModal(null); }); } catch {} }
  async function redeem() { if (!v) return; try { await run(`Return ${money(v.principal)} mUSDC and burn artwork`, { address: deployment.livingVault!, abi: vaultAbi, functionName: 'redeem', args: [v.id] }, async () => { const codeOwner = await publicClient.readContract({ address: deployment.livingVault!, abi: vaultAbi, functionName: 'balanceOf', args: [v.owner] }); void codeOwner; setLastVault(v); setRedeemed(true); setModal(null); }); } catch {} }
  function startHold() { if (busy || holding || chainId !== 10143) return; setHolding(true); timer.current = setTimeout(() => { timer.current = null; setHolding(false); void redeem(); }, 1600); }
  function stopHold() { if (timer.current) clearTimeout(timer.current); timer.current = null; setHolding(false); }
  if (!valid) return <section className="missing-vault"><h1>Invalid vault number.</h1><Link href="/">Return to exhibition<ArrowRight/></Link></section>;
  if (!deployment.livingVault) return <section className="missing-vault"><h1>The collection hasn’t opened yet.</h1><p>No contracts have been deployed.</p><Link className="button" href="/deploy">Open testnet deployment<ArrowUpRight size={18}/></Link></section>;
  if (query.isPending && !redeemed) return <section className="missing-vault" role="status">Opening Living Vault No. {tokenId}…</section>;
  if (!v) return <MissingVault id={id!} retry={() => query.refetch()}/>;
  return <section className="vault-detail"><Link href="/#collection" className="back-link"><ArrowLeft size={16}/>Back to collection</Link><div className="detail-grid"><div className="detail-wall"><ArtFrame image={v.image} previous={previous} evolving={evolving} redeemed={redeemed} original={originalArt}/><div className="art-label"><span>{originalArt ? 'ORIGINAL / ON-CHAIN' : 'DEMO ART / ON-CHAIN STATE'}</span><span>No. {tokenId.padStart(3, '0')}</span></div><div className="art-tools"><button className="icon-button" aria-label={originalArt ? 'Show demo artwork' : 'Show original on-chain art'} title={originalArt ? 'Show demo artwork' : 'Show original on-chain art'} aria-pressed={originalArt} onClick={() => setOriginalArt(!originalArt)}><Eye size={17}/></button><button className="icon-button" title="Download exact SVG" aria-label="Download exact SVG" onClick={download}><Download size={17}/></button><button className="icon-button" title="Copy vault link" aria-label="Copy vault link" onClick={() => copy(location.href, 'Link copied')}>{copied === 'Link copied' ? <Check size={17}/> : <Copy size={17}/>}</button><a className="icon-button" title="View collection contract" aria-label="View collection contract" href={`${explorer}/address/${deployment.livingVault}`} target="_blank" rel="noreferrer"><ArrowUpRight size={19}/></a><span role="status">{copied}</span></div></div>
    <div className="placard"><span className="eyebrow">{redeemed ? 'RETURNED TO ITS OWNER' : 'A WORK IN PROGRESS'}</span><h1>Living Vault<br/>No. {tokenId.padStart(3, '0')}<span className="red">.</span></h1><p className="placard-description">{redeemed ? 'The artwork has dissolved. Its test tokens have returned to the owner.' : 'A living object. Shaped by what it holds.'}</p><div className="vault-balance"><span className="eyebrow">{redeemed ? 'RETURNED TO OWNER' : 'HELD IN THIS VAULT'}</span><strong title={`${v.principal} base units`}>{money(v.principal)}<span> mUSDC</span></strong></div><div className="level-heading"><span>Evolution level</span><strong>{v.level} / 8</strong></div><div className="level-meter" aria-label={`Level ${v.level} of 8`}>{Array.from({ length: 8 }, (_, i) => <span key={i} className={i < v.level ? 'filled' : ''}/>)}</div><p className="next-unlock">{v.level < 8 ? `Next: ${unlocks[v.level + 1]}` : 'Complete halo. Every deposit continues the rotation.'}</p>
      <dl className="vault-facts"><div><dt>Top-ups</dt><dd>{v.count}</dd></div><div><dt>Minted</dt><dd>{new Date(v.mintedAt * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</dd></div><div><dt>Owner</dt><dd><button title={v.owner} onClick={() => copy(v.owner, 'Address copied')}>{shortAddress(v.owner)}<Copy size={12}/></button></dd></div><div><dt>Network</dt><dd>Monad Testnet</dd></div></dl>
      {owner && !redeemed && <div className="vault-actions"><button className="button full" disabled={busy || chainId !== 10143} onClick={() => setModal('deposit')}>Add to vault<ArrowRight size={20}/></button><div><button className="button secondary" disabled={busy || chainId !== 10143} onClick={() => setModal('transfer')}><Send size={15}/>Transfer</button><button className="button secondary" disabled={busy || chainId !== 10143} onClick={() => setModal('redeem')}><X size={16}/>Redeem</button></div></div>}
      {redeemed && <Link href="/create" className="button">Begin again<ArrowRight size={18}/></Link>}
      <TxPanel tx={tx} retry={() => { retryRefresh().catch(() => {}); }}/><p className="fine-print">Test tokens only. No real-world value or yield.</p>
    </div></div>
    {!redeemed && <History id={v.id} current={v}/>}
    {modal === 'deposit' && <Dialog title="Evolve your artwork" onClose={() => { if (!depositBusy) setModal(null); }}><Studio vault={v} onBusyChange={setDepositBusy} onDone={(updated, hash) => { setPrevious(v.image); queryClient.setQueryData(['vault', deployment.livingVault, tokenId], updated); setEvolving(true); setTx({ stage: 'refreshed', label: 'Your artwork evolved', hash }); setModal(null); setDepositBusy(false); }}/></Dialog>}
    {modal === 'transfer' && <Dialog title="Transfer your vault" onClose={() => { if (!busy) setModal(null); }}><p>The artwork and its {money(v.principal)} mUSDC balance go with the NFT.</p><label className="field-label" htmlFor="recipient">Recipient wallet address</label><input id="recipient" className="text-input mono" placeholder="0x…" value={recipient} onChange={e => setRecipient(e.target.value)} disabled={busy}/>{recipient && (!isAddress(recipient) || /^0x0{40}$/i.test(recipient)) && <p className="error">Enter a valid non-zero EVM address.</p>}{recipient.toLowerCase() === address?.toLowerCase() && <p className="error">This is your own wallet. Choose a different recipient.</p>}<button className="button full" disabled={busy || chainId !== 10143 || !isAddress(recipient) || /^0x0{40}$/i.test(recipient) || recipient.toLowerCase() === address?.toLowerCase()} onClick={transfer}>Transfer vault<Send size={16}/></button><TxPanel tx={tx}/></Dialog>}
    {modal === 'redeem' && <Dialog title="The final brushstroke" onClose={() => { if (!busy) { stopHold(); setModal(null); } }}><p>Return <strong>{money(v.principal)} mUSDC</strong> to the current owner. The NFT will be burned permanently.</p><button className={`button full hold-button ${holding ? 'holding' : ''}`} disabled={busy || chainId !== 10143} onPointerDown={startHold} onPointerUp={stopHold} onPointerLeave={stopHold} onPointerCancel={stopHold} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) startHold(); } }} onKeyUp={stopHold} onBlur={stopHold}>{holding ? 'Keep holding…' : 'Hold to redeem'}<X size={17}/></button><TxPanel tx={tx}/></Dialog>}
  </section>;
}
function MissingVault({ id, retry }: { id: bigint; retry: () => void }) {
  const { deployment } = useDeployment();
  const next = useQuery({ queryKey: ['missing-vault', deployment.livingVault, id.toString()], queryFn: () => publicClient.readContract({ address: deployment.livingVault!, abi: vaultAbi, functionName: 'nextTokenId' }) });
  return <section className="missing-vault"><h1>{next.data ? id < next.data ? 'This vault was redeemed.' : 'This vault doesn’t exist yet.' : 'This vault couldn’t be loaded.'}</h1><p>{next.isError ? 'The network is busy. Try again.' : 'Browse your collection to find another piece.'}</p><button className="button secondary" onClick={retry}>Refresh<RefreshCw size={16}/></button><Link href="/">Return to exhibition<ArrowRight size={16}/></Link></section>;
}
function History({ id, current }: { id: bigint; current: Vault }) {
  const { deployment } = useDeployment(); const [enabled, setEnabled] = useState(false);
  const query = useQuery({ queryKey: ['history', deployment.livingVault, id.toString(), current.count], enabled,
    queryFn: async () => {
      const end = await publicClient.getBlockNumber(); let from = BigInt(deployment.blockNumber || '0'), size = 100n;
      const snapshots: { principal: bigint; count: number; hash: string }[] = [];
      while (from <= end) {
        const to = from + size - 1n > end ? end : from + size - 1n;
        try {
          const pages = await Promise.all([
            publicClient.getContractEvents({ address: deployment.livingVault!, abi: vaultAbi, eventName: 'Minted', args: { tokenId: id }, fromBlock: from, toBlock: to }),
            publicClient.getContractEvents({ address: deployment.livingVault!, abi: vaultAbi, eventName: 'ToppedUp', args: { tokenId: id }, fromBlock: from, toBlock: to })
          ]);
          const logs = pages.flat().sort((a, b) => Number(a.blockNumber! - b.blockNumber!) || a.logIndex! - b.logIndex!);
          for (const log of logs) {
            if (log.eventName === 'Minted' && log.args.amount !== undefined) snapshots.push({ principal: log.args.amount, count: 0, hash: log.transactionHash! });
            if (log.eventName === 'ToppedUp' && log.args.newPrincipal !== undefined && log.args.newTopUpCount !== undefined) snapshots.push({ principal: log.args.newPrincipal, count: log.args.newTopUpCount, hash: log.transactionHash! });
          }
          from = to + 1n;
        } catch (e) { if (size <= 25n) throw e; size /= 2n; }
      }
      const result: { image: string; count: number; hash: string }[] = [];
      for (let offset = 0; offset < snapshots.length; offset += 4) result.push(...await Promise.all(snapshots.slice(offset, offset + 4).map(async s => ({ count: s.count, hash: s.hash,
        image: `data:image/svg+xml;base64,${btoa(await publicClient.readContract({ address: deployment.livingVault!, abi: vaultAbi, functionName: 'previewSVG', args: [id, s.principal, BigInt(s.count)] }))}` }))));
      return result;
    } });
  return <section className="history"><div className="section-heading"><div><span className="eyebrow">THE JOURNEY OF THIS PIECE</span><h2>Every brushstroke.</h2></div><button className="text-link" onClick={() => { setEnabled(true); if (enabled) query.refetch(); }} disabled={query.isFetching}>{query.isFetching ? 'Loading history…' : enabled ? 'Refresh history' : 'View evolution history'}<ArrowRight size={18}/></button></div>{query.isError && <p className="error">History could not be loaded. Retry when the network is less busy.</p>}{query.data && <div className="history-strip">{query.data.map(s => <a key={s.count} href={`${explorer}/tx/${s.hash}`} target="_blank" rel="noreferrer"><ArtFrame image={s.image}/><span>{s.count === 0 ? 'Origin' : `Top-up ${s.count}`}<ArrowUpRight size={12}/></span></a>)}</div>}</section>;
}
