import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createPublicClient, http, keccak256, toHex } from 'viem';
import { monadTestnet } from 'viem/chains';

const d = JSON.parse(readFileSync('config/deployment.json', 'utf8'));
const abi = JSON.parse(readFileSync('artifacts/LivingVault.json', 'utf8')).abi;
const tokenAbi = JSON.parse(readFileSync('artifacts/MockUSDC.json', 'utf8')).abi;
const client = createPublicClient({ chain: monadTestnet, transport: http('https://testnet-rpc.monad.xyz', { retryCount: 2 }) });
assert.equal(d.chainId, 10143); assert.equal(await client.getChainId(), 10143);
const tokenId = BigInt(process.argv[2] || '1');
const read = (functionName, args = []) => client.readContract({ address: d.livingVault, abi, functionName, args });
const info = await read('vaultInfo', [tokenId]); const owner = await read('ownerOf', [tokenId]);
assert.equal((await read('asset')).toLowerCase(), d.mockUSDC.toLowerCase());
const uri = await read('tokenURI', [tokenId]);
const metadata = JSON.parse(Buffer.from(uri.split(',')[1], 'base64').toString());
const svg = Buffer.from(metadata.image.split(',')[1], 'base64').toString();
const current = await read('previewSVG', [tokenId, info[0], BigInt(info[1])]);
assert.equal(svg, current);
const end = await client.getBlockNumber(); const minted = [], topUps = [];
// Observed QuickNode limit is 100 blocks per eth_getLogs request.
for (let from = BigInt(d.blockNumber); from <= end; from += 100n) {
  const to = from + 99n > end ? end : from + 99n;
  const pages = await Promise.all([
    client.getContractEvents({ address: d.livingVault, abi, eventName: 'Minted', args: { tokenId }, fromBlock: from, toBlock: to }),
    client.getContractEvents({ address: d.livingVault, abi, eventName: 'ToppedUp', args: { tokenId }, fromBlock: from, toBlock: to })
  ]);
  minted.push(...pages[0]); topUps.push(...pages[1]);
}
assert.equal(minted.length, 1); assert.equal(topUps.length, info[1]);
const original = await read('previewSVG', [tokenId, minted[0].args.amount, 0n]);
if (info[1] > 0) assert.notEqual(original, svg);
const held = await client.readContract({ address: d.mockUSDC, abi: tokenAbi, functionName: 'balanceOf', args: [d.livingVault] });
assert.ok(held >= info[0]);
const events = [...minted, ...topUps];
for (const e of events) assert.equal((await client.getTransactionReceipt({ hash: e.transactionHash })).status, 'success');
const evidence = { checkedAt: new Date().toISOString(), chainId: 10143, tokenId, owner, principal: info[0], topUpCount: info[1], level: info[2], mintedAt: info[3],
  metadataName: metadata.name, svgBytes: Buffer.byteLength(svg), svgMatchesCurrentPreview: svg === current, changedFromMint: original !== svg,
  vaultTokenBalance: held, currentDigest: keccak256(toHex(svg)), mintDigest: keccak256(toHex(original)),
  minted: minted.map(e => ({ transactionHash: e.transactionHash, blockNumber: e.blockNumber, amount: e.args.amount })),
  topUps: topUps.map(e => ({ transactionHash: e.transactionHash, blockNumber: e.blockNumber, amount: e.args.amount, newPrincipal: e.args.newPrincipal, newTopUpCount: e.args.newTopUpCount })) };
const json = JSON.stringify(evidence, (_key, value) => typeof value === 'bigint' ? value.toString() : value, 2);
writeFileSync('docs/testnet-evidence.json', json + '\n');
console.log(json);
assert.ok(info[1] > 0, 'Vault is minted, but no confirmed top-up is recorded yet. Complete approve + deposit, then rerun.');
console.log('PASS: actual testnet mint, confirmed deposits, accounting, tokenURI/preview equality and artwork mutation.');
