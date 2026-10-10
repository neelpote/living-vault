import { NextRequest } from 'next/server';
import { writeFile } from 'node:fs/promises';
import { isAddress, keccak256, toHex, encodeDeployData, type Abi } from 'viem';
import { readFile } from 'node:fs/promises';
import { publicClient } from '@/lib/chain';
import { f1Abi } from '@/lib/generated/F1LivingArt';
import { contractReport, type F1Report } from '@/lib/f1-data';
import { isLocalDevelopment } from '@/lib/local-development';
export async function POST(request: NextRequest) {
  if (!isLocalDevelopment(request)) return Response.json({ saved: false });
  try {
    const body = await request.json(); const report = body.report as F1Report;
    if (body.chainId !== 10143 || !isAddress(body.address) || !/^0x[0-9a-fA-F]{64}$/.test(body.transactionHash) || keccak256(toHex(report.canonical)) !== report.sourceHash) throw new Error('Invalid oracle configuration');
    if (await publicClient.getChainId() !== 10143) throw new Error('Wrong network');
    const receipt = await publicClient.getTransactionReceipt({hash:body.transactionHash});
    if (receipt.status !== 'success') throw new Error('Unconfirmed transaction');
    if ((await publicClient.readContract({address:body.address,abi:f1Abi,functionName:'sourceHash'})) !== report.sourceHash) throw new Error('Report is not the current on-chain source');
    const reporter = await publicClient.readContract({address:body.address,abi:f1Abi,functionName:'reporter'});
    const transaction = await publicClient.getTransaction({hash:body.transactionHash});
    if (transaction.from.toLowerCase() !== reporter.toLowerCase()) throw new Error('Reporter mismatch');
    const initial = receipt.contractAddress?.toLowerCase() === body.address.toLowerCase();
    if (!initial && transaction.to?.toLowerCase() !== body.address.toLowerCase()) throw new Error('Wrong oracle transaction');
    let previous: Record<string, unknown> = {}; try {previous=JSON.parse(await readFile('config/f1-deployment.json','utf8'));}catch{}
    if (initial) {
      const artifact = JSON.parse(await readFile('public/deploy/F1LivingArt.json','utf8')) as {abi:Abi;bytecode:`0x${string}`};
      const args = [report.teams.map(t=>({constructorId:t.constructorId,name:t.name,color:t.color})),contractReport(report)];
      if (encodeDeployData({...artifact,args}).toLowerCase() !== transaction.input.toLowerCase()) throw new Error('Constructor payload mismatch');
      previous = {chainId:10143,address:body.address,deploymentHash:body.transactionHash,reporter,constructorReport:report};
    } else if (previous.address !== body.address) throw new Error('Unknown deployment');
    await writeFile('config/f1-deployment.json',JSON.stringify({...previous,transactionHash:body.transactionHash,latestReport:report},null,2)+'\n');
    return Response.json({saved:true});
  } catch(error) {return Response.json({saved:false,error:(error as Error).message},{status:400});}
}
