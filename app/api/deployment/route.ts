import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'node:fs/promises';
import { isAddress } from 'viem';
import { publicClient } from '@/lib/chain';
import { tokenAbi } from '@/lib/generated/MockUSDC';
import { vaultAbi } from '@/lib/generated/LivingVault';
import { isLocalDevelopment } from '@/lib/local-development';
export async function POST(request: NextRequest) {
  if (!isLocalDevelopment(request)) return NextResponse.json({ saved: false, message: 'Download deployment.json and put it in config/ for shared deployments.' });
  try {
    const d = await request.json();
    if (d.chainId !== 10143 || !isAddress(d.mockUSDC) || (d.livingVault && !isAddress(d.livingVault))) throw new Error('Invalid testnet configuration');
    if (await publicClient.getChainId() !== 10143) throw new Error('Wrong RPC chain');
    if (!await publicClient.getCode({ address: d.mockUSDC })) throw new Error('Token has no code');
    if (await publicClient.readContract({ address: d.mockUSDC, abi: tokenAbi, functionName: 'decimals' }) !== 6) throw new Error('Wrong token decimals');
    if (d.livingVault) {
      if (!await publicClient.getCode({ address: d.livingVault })) throw new Error('Vault has no code');
      const asset = await publicClient.readContract({ address: d.livingVault, abi: vaultAbi, functionName: 'asset' });
      if (asset.toLowerCase() !== d.mockUSDC.toLowerCase()) throw new Error('Vault asset mismatch');
    }
    const receipt = await publicClient.getTransactionReceipt({ hash: d.transactionHash });
    const expectedAddress = d.livingVault || d.mockUSDC;
    if (receipt.status !== 'success' || receipt.contractAddress?.toLowerCase() !== expectedAddress.toLowerCase()) throw new Error('Deployment receipt mismatch');
    const old = JSON.parse(await readFile('config/deployment.json', 'utf8'));
    const clean = { chainId: 10143, mockUSDC: d.mockUSDC, livingVault: d.livingVault || null, blockNumber: d.blockNumber, deployedAt: d.deployedAt,
      verification: old.verification, transactions: [...(old.transactions || []), d.transactionHash] };
    await writeFile('config/deployment.json', JSON.stringify(clean, null, 2) + '\n');
    return NextResponse.json({ saved: true });
  } catch (e) { return NextResponse.json({ saved: false, message: (e as Error).message }, { status: 400 }); }
}
