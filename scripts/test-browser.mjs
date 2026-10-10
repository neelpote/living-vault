import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, mkdtempSync, cpSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createPublicClient, createWalletClient, http } from 'viem';
import { hardhat } from 'viem/chains';
import { multicall3Bytecode } from '../node_modules/viem/_esm/constants/contracts.js';

const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3001';
let appServer;
let appDirectory;
const alice = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const bob = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const node = spawn('node', ['node_modules/hardhat/dist/src/cli.js', 'node', '--port', '18546'], { stdio: 'ignore' });
const transport = http('http://127.0.0.1:18546', { retryCount: 0 });
const client = createPublicClient({ chain: hardhat, transport });
const wallet = createWalletClient({ account: alice, chain: hardhat, transport });
let browser;
let activePage;
const errors = [];
const checks = [];
let failArtworkReads = false;
let permissionPrompts = 0;
const pass = label => { checks.push(label); console.log(`PASS ${label}`); };
try {
  if (!process.env.TEST_BASE_URL) {
    // Isolate generated test addresses from the user's real deployment and running app.
    appDirectory = mkdtempSync(path.join(tmpdir(), 'living-vault-browser-'));
    for (const entry of ['app', 'components', 'lib', 'public', 'package.json', 'tsconfig.json', 'next.config.ts', 'next-env.d.ts']) cpSync(entry, path.join(appDirectory, entry), { recursive: true });
    mkdirSync(path.join(appDirectory, 'config'));
    writeFileSync(path.join(appDirectory, 'config/deployment.json'), JSON.stringify({ chainId: 10143, mockUSDC: null, livingVault: null, blockNumber: null, deployedAt: null, verification: {} }));
    symlinkSync(path.resolve('node_modules'), path.join(appDirectory, 'node_modules'));
    appServer = spawn('node', [path.resolve('node_modules/next/dist/bin/next'), 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', '3001'], { cwd: appDirectory, stdio: 'ignore' });
    for (let i = 0; i < 150; i++) { try { if ((await fetch(baseURL)).ok) break; } catch {} await new Promise(r => setTimeout(r, 200)); }
  }
  for (let i = 0; i < 100; i++) { try { await client.getChainId(); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
  async function deploy(name, args = []) { const a = JSON.parse(readFileSync(`artifacts/${name}.json`, 'utf8')); const r = await client.waitForTransactionReceipt({ hash: await wallet.deployContract({ abi: a.abi, bytecode: a.bytecode, args }) }); return r.contractAddress; }
  const multicallReceipt = await client.waitForTransactionReceipt({ hash: await wallet.sendTransaction({ data: multicall3Bytecode }) });
  await client.request({ method: 'hardhat_setCode', params: ['0xcA11bde05977b3631167028862bE2a173976CA11', await client.getCode({ address: multicallReceipt.contractAddress })] });
  const deployment = { chainId: 10143, mockUSDC: null, livingVault: null, blockNumber: null, deployedAt: null };
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await context.route('**/api/deployment', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ saved: false }) }));
  await context.route(/https:\/\/(testnet-rpc\.monad\.xyz|rpc-testnet\.monadinfra\.com)/, async route => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
    const input = request.postDataJSON();
    const rpc = async payload => {
      if (failArtworkReads && payload.method === 'eth_call' && payload.params[0]?.data?.includes('c87b56dd')) return { jsonrpc: '2.0', id: payload.id, error: { code: -32000, message: 'Injected temporary artwork read failure' } };
      return payload.method === 'eth_chainId' ? { jsonrpc: '2.0', id: payload.id, result: '0x279f' } : await (await fetch('http://127.0.0.1:18546', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })).json();
    };
    const output = Array.isArray(input) ? await Promise.all(input.map(rpc)) : await rpc(input);
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(output) });
  });
  await context.exposeBinding('localWalletRpc', async (_source, payload) => {
    if (payload.method === 'wallet_requestPermissions') permissionPrompts++;
    if (payload.method === 'eth_sendTransaction') { delete payload.params[0].chainId; delete payload.params[0].nonce; }
    const result = await (await fetch('http://127.0.0.1:18546', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, id: 1, jsonrpc: '2.0' }) })).json();
    if (result.error) throw new Error(result.error.message);
    return result.result;
  });
  await context.addInitScript(({ deployment, alice }) => {
    if (!localStorage.getItem('living-vault-deployment')) localStorage.setItem('living-vault-deployment', JSON.stringify(deployment));
    const listeners = new Map();
    window.__walletChain = '0x279f'; window.__rejectNext = false;
    window.ethereum = { isMetaMask: true,
      on: (event, fn) => { const list = listeners.get(event) || []; list.push(fn); listeners.set(event, list); },
      removeListener: (event, fn) => listeners.set(event, (listeners.get(event) || []).filter(f => f !== fn)),
      request: async ({ method, params = [] }) => {
        if (method === 'eth_requestAccounts') { localStorage.setItem('test-wallet-authorized', 'true'); return [alice]; }
        if (method === 'eth_accounts') return localStorage.getItem('test-wallet-authorized') ? [alice] : [];
        if (method === 'eth_chainId') return window.__walletChain;
        if (method === 'wallet_switchEthereumChain' || method === 'wallet_addEthereumChain') { window.__walletChain = params[0].chainId; for (const fn of listeners.get('chainChanged') || []) fn(window.__walletChain); return null; }
        if (method === 'wallet_getCapabilities') return {};
        if (method === 'eth_sendTransaction' && window.__rejectNext) { window.__rejectNext = false; const e = new Error('User rejected the request.'); e.code = 4001; throw e; }
        return window.localWalletRpc({ method, params });
      }
    };
    window.__changeChain = chain => { window.__walletChain = chain; for (const fn of listeners.get('chainChanged') || []) fn(chain); };
  }, { deployment, alice });
  const page = await context.newPage(); activePage = page; page.setDefaultTimeout(30_000); page.on('pageerror', e => errors.push(e.message));
  mkdirSync('test-results', { recursive: true });
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
  assert.equal(await page.getByRole('link', { name: 'View evolving vault No. 001' }).getAttribute('href'), '/vault/1'); pass('museum exhibition links to the live evolving vault');
  await page.getByRole('button', { name: 'Connect wallet' }).first().click();
  await page.getByRole('button', { name: 'MetaMask', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('dialog'));
  assert.equal(permissionPrompts, 0); pass('MetaMask connects through direct accounts request without forced permissions prompt');
  await page.evaluate(() => window.__changeChain('0x8f'));
  await page.getByRole('button', { name: 'Switch network', exact: true }).waitFor(); pass('wrong network warning');
  await page.getByRole('button', { name: 'Switch network', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('.network-banner')); pass('network switch restores testnet');
  await page.goto(`${baseURL}/deploy`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Deploy token', exact: true }).click();
  await page.getByRole('button', { name: 'Deploy vault', exact: true }).waitFor();
  await page.waitForFunction(() => !document.querySelector('button[disabled]')?.textContent?.includes('Deploy vault'));
  await page.getByRole('button', { name: 'Deploy vault', exact: true }).click();
  await page.getByRole('link', { name: 'Mint the first vault' }).waitFor();
  pass('browser wallet deploys both actual contracts, checks code, persists addresses');
  await page.goto(`${baseURL}/create`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Get 1,000 test mUSDC' }).click();
  await page.getByText('Confirmed · artwork refreshed', { exact: true }).waitFor({ timeout: 30_000 }); pass('faucet receipt refreshes balance');
  await page.locator('#amount').fill('0'); assert.equal(await page.getByRole('button', { name: 'Create my vault' }).isDisabled(), true); pass('zero deposit blocked');
  await page.locator('#amount').fill('1001'); assert.equal(await page.getByRole('button', { name: 'Create my vault' }).isDisabled(), true); pass('over-balance deposit blocked');
  await page.locator('#amount').fill('100');
  await page.evaluate(() => { window.__rejectNext = true; });
  await page.getByRole('button', { name: 'Create my vault' }).click();
  await page.getByText('You cancelled the request in your wallet.', { exact: true }).waitFor(); pass('rejected signature is not success');
  await page.getByRole('button', { name: 'Create my vault' }).click();
  await page.waitForURL('**/vault/1', { timeout: 30_000 });
  await page.getByRole('heading', { name: 'Living Vault No. 001.' }).waitFor(); pass('approval and mint create real local vault');
  const before = await page.locator('.detail-wall img').getAttribute('src');
  await page.getByRole('button', { name: 'Add to vault', exact: true }).click();
  await page.getByRole('button', { name: 'Deposit & evolve' }).click();
  await page.waitForFunction(src => document.querySelector('.detail-wall img')?.getAttribute('src') !== src && !document.querySelector('dialog'), before);
  assert.match(await page.locator('.level-heading').innerText(), /1 \/ 8/); pass('confirmed deposit mutates on-chain art and level');
  const activeDeployment = await page.evaluate(() => JSON.parse(localStorage.getItem('living-vault-deployment')));
  const tokenArtifact = JSON.parse(readFileSync('artifacts/MockUSDC.json', 'utf8'));
  await client.waitForTransactionReceipt({ hash: await wallet.writeContract({ address: activeDeployment.mockUSDC, abi: tokenArtifact.abi, functionName: 'approve', args: [activeDeployment.livingVault, 100_000_000n] }) });
  const beforePending = await page.locator('.detail-wall img').getAttribute('src');
  await page.getByRole('button', { name: 'Add to vault', exact: true }).click();
  await client.request({ method: 'evm_setAutomine', params: [false] });
  await page.getByRole('button', { name: 'Deposit & evolve' }).click();
  await page.getByText('Submitted · awaiting confirmation', { exact: true }).waitFor();
  assert.equal(await page.locator('.detail-wall img').getAttribute('src'), beforePending);
  assert.match(await page.locator('.level-heading').innerText(), /1 \/ 8/); pass('pending deposit never evolves the current artwork');
  failArtworkReads = true;
  await client.request({ method: 'evm_mine', params: [] }); await client.request({ method: 'evm_setAutomine', params: [true] });
  await page.getByText('Confirmed. Refreshing the artwork failed. Use Refresh to try again.', { exact: true }).waitFor();
  assert.equal(await page.locator('.detail-wall img').getAttribute('src'), beforePending); pass('failed refresh preserves confirmed receipt and old artwork');
  failArtworkReads = false;
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('dialog'));
  assert.match(await page.locator('.level-heading').innerText(), /2 \/ 8/); pass('refresh retry reads actual evolved state without sending another transaction');
  await page.getByRole('button', { name: 'View evolution history' }).click();
  await page.locator('.history-strip a').nth(1).waitFor(); pass('history reconstructed from deposit logs');
  const dl = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download exact SVG' }).click(); const download = await dl; assert.equal(download.suggestedFilename(), 'living-vault-1.svg'); pass('exact SVG export');
  await page.screenshot({ path: 'test-results/vault-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Transfer', exact: true }).click();
  await page.locator('#recipient').fill(bob);
  await page.getByRole('button', { name: 'Transfer vault', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('dialog'));
  assert.equal(await page.getByRole('button', { name: 'Add to vault', exact: true }).count(), 0); pass('transfer removes previous owner actions');
  // Second mint exercises keyboard hold-to-redeem and atomic payout.
  await page.goto(`${baseURL}/create`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Create my vault' }).click(); await page.waitForURL('**/vault/2', { timeout: 30_000 });
  await page.getByRole('button', { name: 'Redeem', exact: true }).click();
  await page.getByRole('button', { name: 'Hold to redeem' }).focus(); await page.keyboard.down('Space'); await page.waitForTimeout(1750); await page.keyboard.up('Space');
  await page.getByText('RETURNED TO ITS OWNER', { exact: true }).waitFor({ timeout: 30_000 }); pass('hold-to-redeem burns artwork and shows payout');
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}`);
    const images = await page.locator('.exhibition img').evaluateAll(imgs => imgs.length > 0 && imgs.every(img => img.complete && img.naturalWidth > 0)); assert.equal(images, true);
    await page.screenshot({ path: `test-results/home-${width}.png`, fullPage: true });
    await page.goto(`${baseURL}/create`, { waitUntil: 'networkidle' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Create overflow at ${width}`);
    await page.screenshot({ path: `test-results/create-${width}.png`, fullPage: true });
    pass(`artwork renders and no horizontal overflow at ${width}px`);
  }
  assert.deepEqual(errors, []);
  writeFileSync('test-results/browser-report.json', JSON.stringify({ checkedAt: new Date().toISOString(), chain: 'Local Hardhat EVM; browser-only RPC interception represents testnet, NO public-chain writes', checks, errors }, null, 2));
  console.log(`${checks.length} browser checks passed; no page errors.`);
} catch (error) {
  if (activePage) { await activePage.screenshot({ path: 'test-results/failure.png', fullPage: true }); writeFileSync('test-results/failure.txt', await activePage.locator('body').innerText()); }
  throw error;
} finally {
  await browser?.close(); node.kill('SIGTERM');
  if (appServer) { appServer.kill('SIGTERM'); await new Promise(resolve => appServer.once('exit', resolve)); }
  if (appDirectory) rmSync(appDirectory, { recursive: true, force: true });
}
