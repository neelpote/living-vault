'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isAddress, type Address, type Hash } from 'viem';
import { ArrowUpRight } from 'lucide-react';
import f1 from '@/config/f1-mainnet.json';
import shared from '@/config/shared-mainnet.json';
import { SharedGallery } from './shared-gallery';

export function MainnetTogether() {
  const [oracle,setOracle] = useState<Address|null>(isAddress(f1.address ?? '') ? f1.address as Address : null);
  useEffect(()=>{if(f1.address)return;try{const d=JSON.parse(localStorage.getItem('living-vault-f1-mainnet')||'null');if(d?.chainId===143&&isAddress(d.address))setOracle(d.address);}catch{}},[]);
  if(!oracle)return <section className="deployment-page"><div className="page-title"><span className="eyebrow">MONAD MAINNET / 143</span><h1>The shared edition<span className="red">.</span></h1><p>Deploy the mainnet F1 oracle first. This collection links to its real reports, not the testnet oracle.</p></div><Link className="button" href="/mainnet">Deploy F1 oracle first<ArrowUpRight size={18}/></Link></section>;
  return <SharedGallery mainnet configuration={{chainId:143,address:shared.address as Address|null,oracle,transactionHash:shared.transactionHash as Hash|null}}/>;
}
