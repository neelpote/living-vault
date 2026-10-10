'use client';
import { useAccount, useWalletClient } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { type Abi, type Address, type Hash, formatEther, parseEther, type TransactionReceipt, type PublicClient } from 'viem';
import { vaultAbi } from '@/lib/generated/LivingVault';
import { tokenAbi } from '@/lib/generated/MockUSDC';
import { publicClient, decodeMetadata, type Vault } from '@/lib/chain';
import { useDeployment } from '@/components/providers';

export async function fetchVault(address: Address, id: bigint): Promise<Vault> {
  const [info, owner, uri] = await Promise.all([
    publicClient.readContract({ address, abi: vaultAbi, functionName: 'vaultInfo', args: [id] }),
    publicClient.readContract({ address, abi: vaultAbi, functionName: 'ownerOf', args: [id] }),
    publicClient.readContract({ address, abi: vaultAbi, functionName: 'tokenURI', args: [id] })
  ]);
  return { id, owner, principal: info[0], count: info[1], level: Number(info[2]), mintedAt: Number(info[3]), image: decodeMetadata(uri).image, uri };
}
export function useVault(id: bigint | undefined) {
  const { deployment } = useDeployment();
  return useQuery({ queryKey: ['vault', deployment.livingVault, id?.toString()], enabled: !!deployment.livingVault && id !== undefined,
    queryFn: () => fetchVault(deployment.livingVault!, id!) });
}
export function useBalances() {
  const { address } = useAccount(); const { deployment } = useDeployment();
  return useQuery({ queryKey: ['balances', deployment.mockUSDC, address], enabled: !!address,
    queryFn: async () => ({ mon: await publicClient.getBalance({ address: address! }), token: deployment.mockUSDC ? await publicClient.readContract({ address: deployment.mockUSDC, abi: tokenAbi, functionName: 'balanceOf', args: [address!] }) : 0n }) });
}
export function useCollection() {
  const { address } = useAccount(); const { deployment } = useDeployment();
  return useQuery({ queryKey: ['collection', deployment.livingVault, address], enabled: !!address && !!deployment.livingVault,
    queryFn: async () => {
      const total = await publicClient.readContract({ address: deployment.livingVault!, abi: vaultAbi, functionName: 'balanceOf', args: [address!] });
      const ids: bigint[] = [];
      // Bounded chunks protect public RPCs and handle collections beyond the first page.
      for (let offset = 0n; offset < total; offset += 20n) {
        const length = Number(total - offset > 20n ? 20n : total - offset);
        const page = await publicClient.multicall({ allowFailure: false, contracts: Array.from({ length }, (_, i) => ({ address: deployment.livingVault!, abi: vaultAbi, functionName: 'tokenOfOwnerByIndex' as const, args: [address!, offset + BigInt(i)] as const })) });
        ids.push(...page);
      }
      const vaults: Vault[] = [];
      for (let offset = 0; offset < ids.length; offset += 4) vaults.push(...await Promise.all(ids.slice(offset, offset + 4).map(id => fetchVault(deployment.livingVault!, id))));
      return vaults;
    } });
}
export type TxState = { stage: 'idle' | 'estimating' | 'signature' | 'submitted' | 'confirmed' | 'refreshed' | 'failed'; label: string; hash?: Hash; error?: string; cost?: string };
export function friendlyError(error: unknown) {
  const e = error as { shortMessage?: string; message?: string; details?:string };
  const message = e.shortMessage || e.message || 'The network is busy. Please try again.';
  if (/reserve balance violation/i.test(`${e.details??''} ${e.message??''}`)) return 'Monad rejected this payment because of its reserve-balance rules. A smart-account wallet must retain 10 MON plus the deposit and network fee. Use a regular account or review your smart-account balance.';
  if (/reject|denied/i.test(message)) return 'You cancelled the request in your wallet.';
  if (/cooldown/i.test(message)) return 'The faucet is cooling down. Try again in 60 seconds.';
  if (/insufficient funds/i.test(message)) return 'Not enough test MON for gas. Visit the MON faucet.';
  return message.slice(0, 300);
}
export function useTransaction(client: PublicClient = publicClient, expectedChainId = 10143) {
  const publicClient = client;
  const { address, chainId } = useAccount(); const { data: wallet } = useWalletClient();
  const queryClient = useQueryClient();
  const [tx, setTx] = useState<TxState>({ stage: 'idle', label: '' });
  const confirmedRefresh = useRef<(() => Promise<void>) | null>(null);
  const busy = ['estimating', 'signature', 'submitted', 'confirmed'].includes(tx.stage);
  async function run(label: string, request: { address: Address; abi: Abi; functionName: string; args?: readonly unknown[]; value?: bigint }, refresh?: (receipt: TransactionReceipt) => Promise<void>) {
    let receipt: TransactionReceipt | undefined;
    try {
      if (!wallet || !address) throw new Error('Connect a wallet to continue.');
      if (chainId !== expectedChainId || await wallet.getChainId() !== expectedChainId || await publicClient.getChainId() !== expectedChainId) throw new Error(`Switch to ${expectedChainId === 143 ? 'Monad Mainnet' : 'Monad Testnet'} before continuing.`);
      setTx({ stage: 'estimating', label });
      let delegated = false;
      if(expectedChainId===143 && (request.value??0n)>0n){
        const [code,balance]=await Promise.all([publicClient.getCode({address}),publicClient.getBalance({address})]);
        delegated=code?.toLowerCase().startsWith('0xef0100')??false;
        if(delegated && balance < parseEther('10')+request.value!) throw new Error('This wallet is a delegated smart account. Monad requires 10 MON to remain available, plus your deposit and network fee. Use a regular account or fund this account above that amount. No deposit was sent.');
      }
      const estimate = await publicClient.estimateContractGas({ ...request, account: address });
      const gas = estimate + estimate / 20n;
      const fees = await publicClient.estimateFeesPerGas();
      if (expectedChainId === 143 && await publicClient.getBalance({address}) < (request.value ?? 0n) + gas * fees.maxFeePerGas) throw new Error(request.value ? 'Not enough MON on Monad Mainnet for the deposit plus maximum network fee.' : 'Not enough MON on Monad Mainnet for the maximum network fee.');
      if(delegated && await publicClient.getBalance({address}) < parseEther('10')+request.value!+gas*fees.maxFeePerGas) throw new Error('Keep 10 MON available in this smart account after the deposit and maximum network fee. No deposit was sent.');
      const cost = formatEther(gas * fees.maxFeePerGas);
      setTx({ stage: 'signature', label, cost });
      const hash = await wallet.writeContract({ ...request, account: address, chain: publicClient.chain, gas, ...fees });
      setTx({ stage: 'submitted', label, hash, cost });
      // Long pending receipts retain their hash and pending state, never report a timeout as a revert.
      while (!receipt) {
        try { receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 }); }
        catch { setTx({ stage: 'submitted', label: `${label} · still pending`, hash, cost }); await new Promise(r => setTimeout(r, 3000)); }
      }
      if (receipt.status !== 'success') throw new Error('The transaction reverted. Your artwork has not changed.');
      setTx({ stage: 'confirmed', label, hash, cost });
      const confirmedReceipt = receipt;
      // Vault writes refresh their exact token explicitly; burned tokens must not be re-read.
      confirmedRefresh.current = async () => { await refresh?.(confirmedReceipt); await queryClient.invalidateQueries({ predicate: query => query.queryKey[0] !== 'vault' }, { throwOnError: true }); };
      try {
        await confirmedRefresh.current();
        setTx({ stage: 'refreshed', label, hash, cost });
      } catch {
        setTx({ stage: 'confirmed', label, hash, cost, error: 'Confirmed. Refreshing the artwork failed. Use Refresh to try again.' });
      }
      return receipt;
    } catch (error) {
      setTx(previous => ({ ...previous, stage: receipt?.status === 'success' ? 'confirmed' : 'failed', error: expectedChainId === 143 && /insufficient funds/i.test((error as Error).message) ? 'Not enough MON on Monad Mainnet for this transaction.' : friendlyError(error) }));
      throw error;
    }
  }
  async function retryRefresh() {
    try {
      if (confirmedRefresh.current) await confirmedRefresh.current();
      else await queryClient.refetchQueries({ type: 'active' }, { throwOnError: true });
      setTx(previous => ({ ...previous, stage: 'refreshed', error: undefined }));
    } catch { setTx(previous => ({ ...previous, error: 'Confirmed. The network is busy; retry Refresh in a moment.' })); }
  }
  return { tx, busy, run, setTx, retryRefresh };
}
