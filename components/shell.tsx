'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { ArrowUpRight, Plus, X, Wallet, Check, LoaderCircle, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useDeployment } from './providers';
import { explorer, shortAddress, publicClient } from '@/lib/chain';
import type { TxState } from '@/lib/hooks';

export function WalletButton() {
  const { address, isConnected } = useAccount(); const { connectors, connect, error, isPending } = useConnect();
  const { disconnect } = useDisconnect(); const [open, setOpen] = useState(false);
  useEffect(() => { if (isConnected) setOpen(false); }, [isConnected]);
  return <><button className="wallet-button" aria-label={address ? `Wallet ${shortAddress(address)}` : 'Connect wallet'} title={address ? shortAddress(address) : 'Connect wallet'} onClick={() => isConnected ? setOpen(!open) : setOpen(true)}><Wallet size={15}/><span>{address ? shortAddress(address) : 'Connect wallet'}</span></button>
    {open && <Dialog title={address ? 'Your wallet' : 'Connect a wallet'} onClose={() => setOpen(false)}>
      {address ? <><p className="mono address-text">{address}</p><button className="button secondary" onClick={() => { disconnect(); setOpen(false); }}>Disconnect</button></> : <>
        <p className="muted">Use a wallet with test MON on Monad Testnet.</p>
        {connectors.filter((c, i, all) => all.findIndex(other => other.name === c.name) === i).map(c => <button key={c.uid} className="wallet-option" disabled={isPending} onClick={() => connect({ connector: c })}>{c.name === 'Injected' ? 'Browser wallet' : c.name}<ArrowUpRight size={18}/></button>)}
        {!connectors.length && <p>Open this site in your wallet browser or install an EVM wallet.</p>}
        {error && <p role="alert" className="error">{error.message.slice(0, 160)}</p>}
      </>}
    </Dialog>}</>;
}
export function NetworkGuard() {
  const { chainId, isConnected } = useAccount(); const { switchChain, isPending, error } = useSwitchChain();
  if (!isConnected || chainId === 10143) return null;
  return <div className="network-banner" role="alert"><span>This gallery runs on Monad Testnet. Switch networks to continue.</span><button onClick={() => switchChain({ chainId: 10143 })} disabled={isPending}>{isPending ? 'Switching…' : 'Switch network'}<ArrowUpRight size={15}/></button>{error && <span>{error.message.slice(0, 120)}</span>}</div>;
}
export function Shell({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState(false); const { deployment } = useDeployment();
  const code = useQuery({ queryKey: ['contract-code', deployment.livingVault], enabled: !!deployment.livingVault,
    queryFn: async () => !!await publicClient.getCode({ address: deployment.livingVault! }) });
  return <div className="paper"><header className="site-header"><button className="icon-button menu-toggle" aria-label={menu ? 'Close navigation' : 'Open navigation'} onClick={() => setMenu(!menu)}>{menu ? <X/> : <Plus/>}</button><Link href="/" className="wordmark">Living Vault<span className="wordmark-dot">.</span></Link><WalletButton/></header>
    {menu && <nav className="navigation" aria-label="Main navigation"><Link href="/" onClick={() => setMenu(false)}>Exhibition<ArrowUpRight/></Link><Link href="/f1" onClick={() => setMenu(false)}>F1 oracle collection<ArrowUpRight/></Link><Link href="/#collection" onClick={() => setMenu(false)}>Your collection<ArrowUpRight/></Link><Link href="/create" onClick={() => setMenu(false)}>Create a vault<ArrowUpRight/></Link><Link href="/docs" onClick={() => setMenu(false)}>Documentation<ArrowUpRight/></Link><Link href="/deploy" onClick={() => setMenu(false)}>Testnet deployment<ArrowUpRight/></Link></nav>}
    <NetworkGuard/>{code.data === false && <div className="network-banner">Contracts not found on this network. The testnet may have reset.<Link href="/deploy">Review deployment</Link></div>}
    <main>{children}</main><footer><Link href="/" className="footer-mark">Living Vault.</Link><span>Test tokens only. No real value. No yield.</span><div><Link href="/docs">Documentation<ArrowUpRight size={12}/></Link>{deployment.livingVault && <a href={`${explorer}/address/${deployment.livingVault}`} target="_blank" rel="noreferrer">Vault contract<ArrowUpRight size={12}/></a>}{deployment.mockUSDC && <a href={`${explorer}/address/${deployment.mockUSDC}`} target="_blank" rel="noreferrer">Test token<ArrowUpRight size={12}/></a>}<a href="https://faucet.monad.xyz" target="_blank" rel="noreferrer">MON faucet<ArrowUpRight size={12}/></a><span className="network-dot">Monad Testnet</span></div></footer></div>;
}
export function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLDialogElement>('dialog[open]');
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled),input,a[href],select,textarea,[tabindex="0"]') ?? []);
    focusable()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current();
      if (e.key === 'Tab') { const elements = focusable(), first = elements[0], last = elements.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } }
    };
    document.addEventListener('keydown', key); const old = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = old; previous?.focus(); };
  }, []);
  return <div className="modal-backdrop" onClick={onClose}><dialog open aria-modal="true" aria-label={title} className="modal" onClick={e => e.stopPropagation()}><div className="modal-heading"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X/></button></div>{children}</dialog></div>;
}
export function TxPanel({ tx, retry }: { tx: TxState; retry?: () => void }) {
  if (tx.stage === 'idle') return null;
  const status = { estimating: 'Preparing transaction', signature: 'Confirm in your wallet', submitted: 'Submitted · awaiting confirmation', confirmed: 'Confirmed · refreshing artwork', refreshed: 'Confirmed · artwork refreshed', failed: 'Transaction failed' }[tx.stage];
  return <div className={`tx-panel ${tx.stage === 'failed' ? 'tx-error' : ''}`} role="status" aria-live="polite"><div>{tx.stage === 'refreshed' ? <Check size={18}/> : tx.stage === 'failed' ? <X size={18}/> : <LoaderCircle size={18} className="spin"/>}<strong>{status}</strong></div><p>{tx.label}</p>{tx.cost && <small>Maximum network fee: {Number(tx.cost).toFixed(6)} MON</small>}{tx.error && <p className="error">{tx.error}</p>}{tx.hash && <a href={`${explorer}/tx/${tx.hash}`} target="_blank" rel="noreferrer">View transaction<ExternalLink size={13}/></a>}{tx.stage === 'confirmed' && tx.error && retry && <button className="text-button" onClick={retry}>Refresh</button>}</div>;
}
