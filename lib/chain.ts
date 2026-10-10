import { createPublicClient, fallback, http, formatUnits, type Address } from 'viem';
import { monad, monadTestnet } from 'viem/chains';
export { monad, monadTestnet };
export const mainnetClient = createPublicClient({chain: monad, transport: http('https://rpc.monad.xyz', {timeout: 12_000, retryCount: 2}), pollingInterval: 3000});
export const mainnetExplorer = 'https://monadvision.com';
export const explorer = 'https://testnet.monadvision.com';
export const publicClient = createPublicClient({ chain: monadTestnet,
  transport: fallback([http('https://testnet-rpc.monad.xyz', { timeout: 12_000, retryCount: 2 }), http('https://rpc-testnet.monadinfra.com', { timeout: 12_000 })]),
  batch: { multicall: { wait: 40, batchSize: 8192 } }, pollingInterval: 3000 });
export const shortAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;
export const money = (amount: bigint) => Number(formatUnits(amount, 6)).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
export function decodeMetadata(uri: string): { image: string; name: string; attributes: {trait_type: string; value: string | number}[] } {
  if (!uri.startsWith('data:application/json;base64,')) throw new Error('Unsupported metadata format');
  const meta = JSON.parse(atob(uri.split(',')[1]));
  if (typeof meta.image !== 'string' || !meta.image.startsWith('data:image/svg+xml;base64,')) throw new Error('Unsupported artwork format');
  return meta;
}
export type Deployment = { chainId: number; mockUSDC: Address | null; livingVault: Address | null; blockNumber: string | null; deployedAt: string | null };
export type Vault = { id: bigint; owner: Address; principal: bigint; count: number; level: number; mintedAt: number; image: string; uri: string };
