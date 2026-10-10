import { readFileSync, writeFileSync } from 'node:fs';
import { encodeAbiParameters, parseAbiParameters } from 'viem';
const deployment = JSON.parse(readFileSync('config/deployment.json', 'utf8'));
if (deployment.chainId !== 10143 || !deployment.mockUSDC || !deployment.livingVault) throw new Error('No complete testnet deployment recorded.');
const input = JSON.parse(readFileSync('artifacts/standard-input.json', 'utf8'));
for (const name of ['MockUSDC', 'LivingVault']) {
  const key = name === 'MockUSDC' ? 'mockUSDC' : 'livingVault';
  const artifact = JSON.parse(readFileSync(`artifacts/${name}.json`, 'utf8'));
  const payload = { chainId: 10143, contractAddress: deployment[key], contractName: artifact.sourceName + ':' + name,
    compilerVersion: 'v' + artifact.compilerVersion.split('.Emscripten')[0], standardJsonInput: input, foundryMetadata: artifact.metadata,
    ...(name === 'LivingVault' ? { constructorArgs: encodeAbiParameters(parseAbiParameters('address'), [deployment.mockUSDC]).slice(2) } : {}) };
  const response = await fetch('https://agents.devnads.com/v1/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(60_000) });
  const body = await response.text();
  console.log(`${name}: HTTP ${response.status}: ${body}`);
  deployment.verification[key] = { httpStatus: response.status, response: body, submittedAt: new Date().toISOString() };
  writeFileSync('config/deployment.json', JSON.stringify(deployment, null, 2));
  if (!response.ok) process.exitCode = 1;
}
