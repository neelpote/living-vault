'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Droplets, ArrowUpRight } from 'lucide-react';
import { decodeEventLog, parseUnits, formatUnits, type Hash } from 'viem';
import { publicClient, money, type Vault } from '@/lib/chain';
import { tokenAbi } from '@/lib/generated/MockUSDC';
import { vaultAbi } from '@/lib/generated/LivingVault';
import { useBalances, useTransaction, fetchVault } from '@/lib/hooks';
import { useDeployment } from './providers';
import { ArtFrame, unlocks } from './art';
import { TxPanel, WalletButton } from './shell';

export function Studio({ vault, onDone, onBusyChange }: { vault?: Vault; onDone?: (updated: Vault, hash: Hash) => void; onBusyChange?: (busy: boolean) => void }) {
  const router = useRouter(); const { address, chainId } = useAccount(); const { deployment } = useDeployment();
  const balances = useBalances(); const { tx, busy: txBusy, run, retryRefresh } = useTransaction();
  const [workflowBusy, setWorkflowBusy] = useState(false);
  const busy = txBusy || workflowBusy;
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  const [value, setValue] = useState(vault ? '10' : '100'); const [step, setStep] = useState(0); const [notice, setNotice] = useState('');
  let amount = 0n; let validation = '';
  try { if (!/^\d+(\.\d{0,6})?$/.test(value)) throw new Error(); amount = parseUnits(value, 6); } catch { validation = 'Enter a number with up to six decimals.'; }
  if (!validation && amount === 0n) validation = 'Enter an amount greater than zero.';
  if (!validation && !vault && amount < 1_000_000n) validation = 'The first deposit must be at least 1 mUSDC.';
  if (!validation && balances.data && amount > balances.data.token) validation = 'This amount exceeds your test-token balance.';
  const ready = !!deployment.livingVault && !!deployment.mockUSDC;
  const nextId = useQuery({ queryKey: ['nextId', deployment.livingVault], enabled: ready && !vault,
    queryFn: () => publicClient.readContract({ address: deployment.livingVault!, abi: vaultAbi, functionName: 'nextTokenId' }) });
  const id = vault?.id ?? nextId.data;
  const [debounced, setDebounced] = useState(amount);
  useEffect(() => { const t = setTimeout(() => setDebounced(amount), 300); return () => clearTimeout(t); }, [amount]);
  const preview = useQuery({ queryKey: ['preview', deployment.livingVault, id?.toString(), debounced.toString(), vault?.count], enabled: ready && id !== undefined && debounced > 0n,
    queryFn: () => publicClient.readContract({ address: deployment.livingVault!, abi: vaultAbi, functionName: 'previewSVG', args: [id!, (vault?.principal ?? 0n) + debounced, BigInt(vault ? vault.count + 1 : 0)] }) });
  const image = preview.data ? `data:image/svg+xml;base64,${btoa(preview.data)}` : vault?.image ?? '/art/level-0.svg';
  async function faucet() { setNotice(''); try { await run('Get 1,000 test mUSDC', { address: deployment.mockUSDC!, abi: tokenAbi, functionName: 'faucet' }); } catch { /* TxPanel owns the error. */ } }
  async function submit() {
    if (!address || !ready || validation || chainId !== 10143 || busy) return;
    setNotice(''); setStep(0); setWorkflowBusy(true);
    try {
      const allowance = await publicClient.readContract({ address: deployment.mockUSDC!, abi: tokenAbi, functionName: 'allowance', args: [address, deployment.livingVault!] });
      if (allowance < amount) {
        const receipt = await run('Approve exact deposit amount', { address: deployment.mockUSDC!, abi: tokenAbi, functionName: 'approve', args: [deployment.livingVault!, amount] });
        if (receipt?.status !== 'success') return;
        const confirmed = await publicClient.readContract({ address: deployment.mockUSDC!, abi: tokenAbi, functionName: 'allowance', args: [address, deployment.livingVault!] });
        if (confirmed < amount) throw new Error('Approval is confirmed but allowance is too low. Please retry.');
      }
      setStep(1);
      await run(vault ? 'Evolve your artwork' : 'Mint your Living Vault', { address: deployment.livingVault!, abi: vaultAbi, functionName: vault ? 'topUp' : 'mint', args: vault ? [vault.id, amount] : [amount, address] }, async receipt => {
        if (vault) { onDone?.(await fetchVault(deployment.livingVault!, vault.id), receipt.transactionHash); }
        else {
          const log = receipt.logs.filter(log => log.address.toLowerCase() === deployment.livingVault!.toLowerCase()).map(log => {
            try { return decodeEventLog({ abi: vaultAbi, data: log.data, topics: log.topics }); } catch { return null; }
          }).find(log => log?.eventName === 'Minted');
          if (!log || log.eventName !== 'Minted') throw new Error('Mint confirmed; reload your collection to find the token.');
          await fetchVault(deployment.livingVault!, log.args.tokenId);
          sessionStorage.setItem(`vault-minted-${log.args.tokenId}`, receipt.transactionHash);
          router.push(`/vault/${log.args.tokenId}`);
        }
      });
    } catch (e) { setNotice((e as Error).message.slice(0, 180)); }
    finally { setWorkflowBusy(false); }
  }
  return <section className={`studio ${vault ? 'studio-inline' : ''}`}>
    {!vault && <><Link href="/" className="back-link"><ArrowLeft size={16}/>Back to exhibition</Link><div className="page-title"><span className="eyebrow">THE BEGINNING OF SOMETHING</span><h1>Create a vault<span className="red">.</span></h1><p>Your first deposit. Your first brushstroke.</p></div></>}
    <div className="studio-grid"><div className="studio-art"><ArtFrame image={image}/><div className="art-label"><span>{vault ? 'NEXT EVOLUTION' : 'YOUR FIRST EDITION'}</span><span>LEVEL {vault ? Math.min(vault.count + 1, 8) : 0} / 08</span></div><p className="preview-caption">{'Demo art / projected state'} · {unlocks[vault ? Math.min(vault.count + 1, 8) : 0]}{!vault && preview.data ? ' · Final token number is assigned at mint.' : ''}</p>{preview.isError && <p className="error">Preview unavailable. <button onClick={() => preview.refetch()}>Retry</button></p>}</div>
    <div className="studio-form"><span className="eyebrow">{vault ? 'ADD A BRUSHSTROKE' : 'INITIAL DEPOSIT'}</span><label className="amount-label" htmlFor="amount">Amount in mUSDC</label><div className="amount-input"><input id="amount" inputMode="decimal" autoComplete="off" value={value} onChange={e => { setValue(e.target.value); setStep(0); }} disabled={busy} aria-describedby="amount-error"/><button disabled={!balances.data || busy} onClick={() => setValue(formatUnits(balances.data!.token, 6))}>MAX</button></div><div className="balance-line"><span>Available</span><span title={balances.data ? formatUnits(balances.data.token, 6) : undefined}>{balances.isError ? 'Unavailable' : balances.isPending && address ? 'Loading…' : money(balances.data?.token ?? 0n)} mUSDC</span></div>{validation && address && <p id="amount-error" className="error">{validation}</p>}
      <div className="deposit-facts"><div><span>{vault ? 'New vault balance' : 'Vault balance'}</span><strong>{money((vault?.principal ?? 0n) + amount)} mUSDC</strong></div><div><span>Evolution level</span><strong>{vault ? Math.min(vault.count + 1, 8) : 0} / 8</strong></div><div><span>Token standard</span><strong>ERC-721</strong></div><div><span>Network</span><strong>Monad Testnet</strong></div></div>
      <div className="steps"><span className={step > 0 ? 'complete' : ''}>{step > 0 ? <Check size={14}/> : <span className="step-number">1</span>}Approve</span><span className="step-rule"/><span className={step > 0 ? 'current' : ''}><span className="step-number">2</span>{vault ? 'Evolve' : 'Mint'}</span></div>
      {!address ? <WalletButton/> : !ready ? <Link className="button" href="/deploy">Deploy the testnet collection<ArrowUpRight size={17}/></Link> : <button className="button full" disabled={busy || !!validation || chainId !== 10143 || balances.isPending || balances.isError} onClick={submit}>{busy ? 'Transaction in progress…' : vault ? 'Deposit & evolve' : 'Create my vault'}<ArrowRight size={20}/></button>}
      <button className="text-button faucet-button" disabled={!address || !ready || busy || chainId !== 10143} onClick={faucet}><Droplets size={15}/>Get 1,000 test mUSDC</button><p className="fine-print">mUSDC is a test token with no real value. Your deposit stays in the vault until you redeem it.</p>
      {balances.data && balances.data.mon < 10n ** 16n && <p className="error">Low test MON balance. <a href="https://faucet.monad.xyz" target="_blank" rel="noreferrer">Get MON for gas</a>.</p>}
      {notice && tx.stage !== 'failed' && <p className="error" role="alert">{notice}</p>}<TxPanel tx={tx} retry={() => { retryRefresh().catch(() => {}); }}/>
    </div></div>
  </section>;
}
