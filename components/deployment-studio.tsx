'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAccount, useWalletClient } from 'wagmi';
import { encodeDeployData, type Abi, type Address, type Hash, formatEther } from 'viem';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Download, ShieldCheck } from 'lucide-react';
import { useDeployment } from './providers';
import { publicClient, explorer, type Deployment } from '@/lib/chain';
import { vaultAbi } from '@/lib/generated/LivingVault';
import { tokenAbi } from '@/lib/generated/MockUSDC';
import { friendlyError, type TxState } from '@/lib/hooks';
import { TxPanel, WalletButton } from './shell';

export function DeploymentStudio() {
  const { address, chainId } = useAccount(); const { data: wallet } = useWalletClient(); const { deployment, save } = useDeployment();
  const [tx, setTx] = useState<TxState>({ stage: 'idle', label: '' }); const [verification, setVerification] = useState(''); const [cost, setCost] = useState('');
  const [activeName, setActiveName] = useState<'MockUSDC' | 'LivingVault'>('MockUSDC');
  const busy = ['estimating', 'signature', 'submitted', 'confirmed'].includes(tx.stage);
  async function deploy(name: 'MockUSDC' | 'LivingVault') {
    if (!wallet || !address) return;
    let hash: Hash | undefined;
    let confirmed = false;
    const pendingKey = `living-vault-pending-deploy:${name}:${address.toLowerCase()}`;
    try {
      setActiveName(name);
      if (await wallet.getChainId() !== 10143 || await publicClient.getChainId() !== 10143) throw new Error('Switch to Monad Testnet before deploying.');
      setTx({ stage: 'estimating', label: `Deploy ${name}` });
      const response = await fetch(`/deploy/${name}.json`); if (!response.ok) throw new Error('Deployment build is unavailable. Recompile contracts.');
      const artifact = await response.json() as { abi: Abi; bytecode: `0x${string}` };
      if (name === 'LivingVault' && !deployment.mockUSDC) throw new Error('Deploy Mock USDC first.');
      const args = name === 'LivingVault' ? [deployment.mockUSDC!] : [];
      const cached = localStorage.getItem(pendingKey);
      let maxCost: string | undefined;
      if (cached && /^0x[0-9a-fA-F]{64}$/.test(cached)) hash = cached as Hash;
      else {
        const estimate = await publicClient.estimateGas({ account: address, data: encodeDeployData({ ...artifact, args }) });
        const gas = estimate + estimate / 20n; const fees = await publicClient.estimateFeesPerGas();
        maxCost = formatEther(gas * fees.maxFeePerGas); setCost(maxCost);
        setTx({ stage: 'signature', label: `Deploy ${name} on Monad Testnet`, cost: maxCost });
        hash = await wallet.deployContract({ ...artifact, args, account: address, chain: publicClient.chain, gas, ...fees });
        localStorage.setItem(pendingKey, hash);
      }
      setTx({ stage: 'submitted', label: `Deploy ${name}`, hash, cost: maxCost });
      let receipt;
      while (!receipt) { try { receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 }); } catch { setTx({ stage: 'submitted', label: `Deploy ${name} · still pending`, hash, cost: maxCost }); await new Promise(r => setTimeout(r, 3000)); } }
      if (receipt.status !== 'success' || !receipt.contractAddress) { localStorage.removeItem(pendingKey); throw new Error('Deployment transaction reverted.'); }
      confirmed = true;
      setTx({ stage: 'confirmed', label: `Checking ${name} on-chain`, hash, cost: maxCost });
      const code = await publicClient.getCode({ address: receipt.contractAddress });
      if (!code || code === '0x') throw new Error('Confirmed deployment has no contract code.');
      const next: Deployment = { ...deployment, chainId: 10143, [name === 'MockUSDC' ? 'mockUSDC' : 'livingVault']: receipt.contractAddress,
        deployedAt: new Date().toISOString(), blockNumber: deployment.blockNumber ?? receipt.blockNumber.toString() };
      save(next);
      localStorage.removeItem(pendingKey);
      // Dev-only persistence checks chain, interfaces and vault asset before writing public addresses.
      let result = { saved: false };
      try { const persisted = await fetch('/api/deployment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...next, transactionHash: hash }) }); result = await persisted.json(); } catch { /* Browser config is already saved; export remains available. */ }
      setTx({ stage: 'refreshed', label: result.saved ? `${name} deployed and saved to project` : `${name} deployed. Download the configuration to share this deployment.`, hash, cost: maxCost });
    } catch (error) { setTx({ stage: confirmed ? 'confirmed' : 'failed', label: `Deploy ${name}`, hash, error: confirmed ? `Confirmed. ${friendlyError(error)} Use Refresh to check again.` : friendlyError(error) }); }
  }
  async function verify() {
    setVerification('Submitting source for verification…');
    try {
      const response = await fetch('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(deployment) });
      const body = await response.json();
      setVerification(body.message || (response.ok ? 'Verification submitted. Check the explorer results below.' : 'Verification was not completed. Use the project verification command.'));
    } catch { setVerification('Verification service unavailable. Run the project verification command and check the explorer.'); }
  }
  function download() { const url = URL.createObjectURL(new Blob([JSON.stringify(deployment, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = 'deployment.json'; a.click(); URL.revokeObjectURL(url); }
  return <section className="deployment-page"><Link href="/" className="back-link"><ArrowLeft size={16}/>Back to exhibition</Link><div className="page-title"><span className="eyebrow">OPEN THE FIRST EDITION</span><h1>Testnet deployment<span className="red">.</span></h1><p>Two contracts. Two wallet confirmations. One living collection.</p></div><div className="deploy-layout"><div><div className="testnet-notice"><ShieldCheck size={23}/><div><strong>Monad Testnet only · 10143</strong><p>Each deployment checks your wallet and RPC network. Your wallet keeps your key.</p></div></div>
    <div className="deploy-step"><span className="deploy-number">01</span><div><h2>Mock USDC</h2><p>A six-decimal test token with a 1,000 mUSDC faucet.</p>{deployment.mockUSDC ? <a className="mono deployed-address" href={`${explorer}/address/${deployment.mockUSDC}`} target="_blank" rel="noreferrer">{deployment.mockUSDC}<ArrowUpRight size={16}/></a> : null}</div><button className="button" disabled={busy || !address || chainId !== 10143 || !!deployment.mockUSDC} onClick={() => deploy('MockUSDC')}>{deployment.mockUSDC ? <><Check size={17}/>Deployed</> : <>Deploy token<ArrowRight size={17}/></>}</button></div>
    <div className="deploy-step"><span className="deploy-number">02</span><div><h2>Living Vault</h2><p>The NFT, its vault, and the artwork renderer.</p>{deployment.livingVault ? <a className="mono deployed-address" href={`${explorer}/address/${deployment.livingVault}`} target="_blank" rel="noreferrer">{deployment.livingVault}<ArrowUpRight size={16}/></a> : null}</div><button className="button" disabled={busy || !address || chainId !== 10143 || !deployment.mockUSDC || !!deployment.livingVault} onClick={() => deploy('LivingVault')}>{deployment.livingVault ? <><Check size={17}/>Deployed</> : <>Deploy vault<ArrowRight size={17}/></>}</button></div>
    {!address && <WalletButton/>}<TxPanel tx={tx} retry={() => { void deploy(activeName); }}/>{cost && <p className="fine-print">Last estimated maximum fee: {Number(cost).toFixed(6)} test MON.</p>}
    {deployment.livingVault && <div className="deploy-finish"><button className="button secondary" onClick={verify}>Verify source<ShieldCheck size={17}/></button><button className="icon-button" aria-label="Download deployment configuration" title="Download deployment configuration" onClick={download}><Download size={18}/></button><Link className="button" href="/create">Mint the first vault<ArrowRight size={17}/></Link></div>}{verification && <p role="status" className="verification-message">{verification}</p>}
    </div><aside className="deploy-aside"><span className="eyebrow">WHAT YOU ARE DEPLOYING</span><dl><div><dt>Compiler</dt><dd>Solidity 0.8.31 / Osaka</dd></div><div><dt>Standards</dt><dd>ERC-20, ERC-721, ERC-4906</dd></div><div><dt>Asset</dt><dd>Test mUSDC only</dd></div><div><dt>Storage</dt><dd>Fully on-chain</dd></div><div><dt>Admin controls</dt><dd>No vault admin or upgrades</dd></div></dl><p>After deployment, your wallet can claim test tokens, create a vault, and evolve its art.</p></aside></div></section>;
}
