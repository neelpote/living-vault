import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createPublicClient, createWalletClient, http, parseUnits, keccak256, toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { hardhat } from 'viem/chains';

const node = spawn('node', ['node_modules/hardhat/dist/src/cli.js', 'node', '--port', '18545'], { stdio: 'ignore' });
const transport = http('http://127.0.0.1:18545', { retryCount: 0 });
const client = createPublicClient({ chain: hardhat, transport });
// Public Hardhat test keys. Never funded on a public chain.
const alice = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const bob = privateKeyToAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d');
const wallet = account => createWalletClient({ account, chain: hardhat, transport });
const artifact = name => JSON.parse(readFileSync(`artifacts/${name}.json`, 'utf8'));
let checks = 0;
function check(label, fn) { fn(); checks++; console.log(`PASS ${label}`); }
async function write(address, abi, functionName, args = [], account = alice) {
  const { request } = await client.simulateContract({ address, abi, functionName, args, account });
  const receipt = await client.waitForTransactionReceipt({ hash: await wallet(account).writeContract(request) });
  assert.equal(receipt.status, 'success'); return receipt;
}
async function deploy(name, args = []) {
  const a = artifact(name);
  const receipt = await client.waitForTransactionReceipt({ hash: await wallet(alice).deployContract({ abi: a.abi, bytecode: a.bytecode, args }) });
  assert.equal(receipt.status, 'success'); return { address: receipt.contractAddress, abi: a.abi };
}
async function rejects(label, fn) { await assert.rejects(fn); checks++; console.log(`PASS ${label}`); }
try {
  for (let i = 0; i < 100; i++) {
    try { await client.getChainId(); break; } catch { await new Promise(r => setTimeout(r, 100)); }
  }
  assert.equal(await client.getChainId(), 31337);
  const token = await deploy('MockUSDC');
  const vault = await deploy('LivingVault', [token.address]);
  const read = (functionName, args = []) => client.readContract({ ...vault, functionName, args });
  await write(token.address, token.abi, 'faucet');
  check('six decimals and faucet balance', () => {});
  assert.equal(await client.readContract({ ...token, functionName: 'decimals' }), 6);
  assert.equal(await client.readContract({ ...token, functionName: 'balanceOf', args: [alice.address] }), 1_000_000_000n);
  await rejects('faucet cooldown', () => write(token.address, token.abi, 'faucet'));
  await rejects('deployer-only seed mint', () => write(token.address, token.abi, 'mint', [bob.address, 1n], bob));
  await write(token.address, token.abi, 'approve', [vault.address, 1_000_000_000n]);
  await rejects('zero mint', () => write(vault.address, vault.abi, 'mint', [0n, alice.address]));
  await rejects('below minimum mint', () => write(vault.address, vault.abi, 'mint', [999_999n, alice.address]));
  await rejects('uint128 overflow', () => write(vault.address, vault.abi, 'mint', [2n ** 128n, alice.address]));
  await write(vault.address, vault.abi, 'mint', [parseUnits('10', 6), alice.address]);
  check('mint ownership, accounting, enumeration', () => {});
  assert.equal(await read('ownerOf', [1n]), alice.address);
  assert.equal((await read('vaultInfo', [1n]))[0], 10_000_000n);
  assert.equal(await read('tokenOfOwnerByIndex', [alice.address, 0n]), 1n);
  await rejects('unauthorized top-up', () => write(vault.address, vault.abi, 'topUp', [1n, 1n], bob));
  await rejects('zero top-up', () => write(vault.address, vault.abi, 'topUp', [1n, 0n]));
  await rejects('unauthorized redeem', () => write(vault.address, vault.abi, 'redeem', [1n], bob));
  let previous = await read('tokenURI', [1n]);
  const decode = uri => JSON.parse(Buffer.from(uri.split(',')[1], 'base64').toString());
  const svg = meta => Buffer.from(meta.image.split(',')[1], 'base64').toString();
  mkdirSync('public/art', { recursive: true });
  const manifest = [];
  for (let count = 0; count <= 12; count++) {
    if (count > 0) {
      await write(vault.address, vault.abi, 'topUp', [1n, 1_000_000n]);
      const current = await read('tokenURI', [1n]);
      assert.notEqual(current, previous); previous = current;
    }
    const [principal, topUps, level] = await read('vaultInfo', [1n]);
    assert.equal(level, BigInt(Math.min(count, 8)));
    assert.equal(topUps, count);
    const meta = decode(previous), image = svg(meta);
    assert.equal(image, await read('previewSVG', [1n, principal, BigInt(count)]));
    assert.equal(previous, await read('tokenURI', [1n]));
    assert.ok(Buffer.byteLength(image) < 14_000);
    if (count <= 8) {
      writeFileSync(`public/art/level-${count}.svg`, image);
      manifest.push({ level: count, tokenId: '1', principal: principal.toString(), topUps: count, digest: keccak256(toHex(image)) });
    }
  }
  writeFileSync('public/art/manifest.json', JSON.stringify({ origin: 'Compiled Solidity previewSVG on local EVM, not minted testnet NFTs', previews: manifest }, null, 2));
  check('every top-up mutates; deterministic metadata; exact preview; level cap; SVG <14KB', () => {});
  await write(vault.address, vault.abi, 'approve', [bob.address, 1n]);
  await write(token.address, token.abi, 'faucet', [], bob);
  await write(token.address, token.abi, 'approve', [vault.address, 1_000_000n], bob);
  await write(vault.address, vault.abi, 'topUp', [1n, 1_000_000n], bob);
  check('approved operator may top up with their own funds', () => {});
  const beforeTransfer = await read('vaultInfo', [1n]);
  await write(vault.address, vault.abi, 'transferFrom', [alice.address, bob.address, 1n]);
  assert.deepEqual(await read('vaultInfo', [1n]), beforeTransfer);
  await rejects('previous owner loses redemption rights', () => write(vault.address, vault.abi, 'redeem', [1n]));
  const beforeBalance = await client.readContract({ ...token, functionName: 'balanceOf', args: [bob.address] });
  await write(vault.address, vault.abi, 'approve', [alice.address, 1n], bob);
  await write(vault.address, vault.abi, 'redeem', [1n]);
  assert.equal(await client.readContract({ ...token, functionName: 'balanceOf', args: [bob.address] }), beforeBalance + beforeTransfer[0]);
  assert.equal(await read('totalSupply'), 0n);
  await rejects('burned metadata unavailable', () => read('tokenURI', [1n]));
  check('transfer preserves state; operator redemption pays current owner and burns', () => {});
  await write(vault.address, vault.abi, 'mint', [1_000_000n, alice.address]);
  assert.equal(await read('nextTokenId'), 3n);
  check('token IDs never reused', () => {});
  const hostile = await deploy('HostileToken');
  const badVault = await deploy('LivingVault', [hostile.address]);
  await write(hostile.address, hostile.abi, 'approve', [badVault.address, 1_000_000_000n]);
  await write(hostile.address, hostile.abi, 'setFee', [true]);
  await rejects('fee-on-transfer mint rejected', () => write(badVault.address, badVault.abi, 'mint', [1_000_000n, alice.address]));
  await write(hostile.address, hostile.abi, 'setFee', [false]);
  await write(badVault.address, badVault.abi, 'mint', [1_000_000n, alice.address]);
  await write(hostile.address, hostile.abi, 'setFailPayout', [true]);
  await rejects('failed payout rolls back burn', () => write(badVault.address, badVault.abi, 'redeem', [1n]));
  assert.equal(await client.readContract({ ...badVault, functionName: 'ownerOf', args: [1n] }), alice.address);
  check('failed payout retains NFT and principal', () => {});
  console.log(`\n${checks} contract checks passed. Preview assets generated from Solidity.`);
} finally { node.kill('SIGTERM'); }
