import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'node:fs/promises';
import { encodeAbiParameters, parseAbiParameters } from 'viem';
import { isLocalDevelopment } from '@/lib/local-development';
export async function POST(request: NextRequest) {
  if (!isLocalDevelopment(request)) return NextResponse.json({ message: 'Run npm run contracts:verify in the project to verify source.' }, { status: 403 });
  try {
    const d = JSON.parse(await readFile('config/deployment.json', 'utf8'));
    if (d.chainId !== 10143 || !d.mockUSDC || !d.livingVault) throw new Error('Deploy both contracts first.');
    const input = JSON.parse(await readFile('artifacts/standard-input.json', 'utf8'));
    const results = [];
    for (const name of ['MockUSDC', 'LivingVault']) {
      const key = name === 'MockUSDC' ? 'mockUSDC' : 'livingVault';
      const artifact = JSON.parse(await readFile(`artifacts/${name}.json`, 'utf8'));
      const response = await fetch('https://agents.devnads.com/v1/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chainId: 10143, contractAddress: d[key], contractName: artifact.sourceName + ':' + name,
          compilerVersion: 'v' + artifact.compilerVersion.split('.Emscripten')[0], standardJsonInput: input, foundryMetadata: artifact.metadata,
          ...(name === 'LivingVault' ? { constructorArgs: encodeAbiParameters(parseAbiParameters('address'), [d.mockUSDC]).slice(2) } : {}) }), signal: AbortSignal.timeout(25_000) });
      const body = await response.text(); d.verification[key] = { httpStatus: response.status, response: body, submittedAt: new Date().toISOString() };
      results.push(`${name}: ${response.ok ? 'submitted' : 'submission failed'} (${response.status}). ${body.slice(0, 400)}`);
    }
    await writeFile('config/deployment.json', JSON.stringify(d, null, 2) + '\n');
    return NextResponse.json({ message: results.join(' ') });
  } catch (e) { return NextResponse.json({ message: (e as Error).message }, { status: 500 }); }
}
