'use client';
import Link from 'next/link';
import { ArrowUpRight, Plus, RefreshCw } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useCollection } from '@/lib/hooks';
import { formatEther } from 'viem';
import nativeConfiguration from '@/config/native-mainnet.json';
import { money } from '@/lib/chain';
import { useDeployment } from './providers';
import { ArtFrame } from './art';
import { WalletButton } from './shell';
export function Collection({mainnet = false}: {mainnet?: boolean} = {}) {
  const { address } = useAccount(); const collection = useCollection(mainnet); const { deployment } = useDeployment();
  return <section id="collection" className="collection"><div className="section-heading"><div><span className="eyebrow">THE PRIVATE VIEW</span><h2>Your collection<span className="red">.</span></h2></div><Link href={mainnet ? "/mainnet/vault" : "/create"} className="text-link">Create a vault<Plus size={18}/></Link></div>
    {!address ? <div className="empty-collection"><div className="empty-outline"><span>YOUR NEXT<br/>WORK OF ART</span></div><div><h3>A wall of your own.</h3><p>Connect your wallet to see the pieces you hold.</p><WalletButton/></div><span className="empty-number">No. —</span></div> : !(mainnet ? nativeConfiguration.address : deployment.livingVault) ? <div className="empty-collection"><div className="empty-outline"><span>AWAITING<br/>FIRST EDITION</span></div><div><h3>The first exhibition starts here.</h3><p>Deploy the testnet collection to open your gallery.</p><Link className="button" href="/deploy">Deploy on testnet<ArrowUpRight size={17}/></Link></div></div> : collection.isPending ? <div className="loading-wall" role="status">Opening your collection…</div> : collection.isError ? <div className="empty-collection"><div><h3>The network is busy.</h3><p>Your collection couldn’t be loaded.</p><button className="button secondary" onClick={() => collection.refetch()}>Retry<RefreshCw size={16}/></button></div></div> : collection.data?.length === 0 ? <div className="empty-collection"><div className="empty-outline"><span>YOUR FIRST<br/>LIVING VAULT</span></div><div><h3>Every collection begins with one.</h3><p>Your first deposit gives an artwork its beginning.</p><Link href={mainnet ? "/mainnet/vault" : "/create"} className="button">Create a vault<ArrowUpRight size={17}/></Link></div></div> : <div className="gallery-grid">{collection.data?.map(v => <Link href={`${mainnet ? "/mainnet/vault" : "/vault"}/${v.id}`} className="vault-card" key={v.id.toString()}><ArtFrame image={v.image}/><div className="vault-card-caption"><div><h3>Living Vault No. {v.id.toString().padStart(3, '0')}</h3><span>LEVEL {v.level} / 08 · {v.count} TOP-UPS</span></div><ArrowUpRight size={20}/></div><p>{mainnet ? formatEther(v.principal) : money(v.principal)} <span>{mainnet ? "MON" : "mUSDC"}</span></p></Link>)}</div>}
    <div className="collection-colophon"><span>THE ART IS YOURS. SO IS WHAT IT HOLDS.</span><span>ON-CHAIN VAULTS / DEMO ART VIEW</span></div>
  </section>;
}
