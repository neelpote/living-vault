import type { NextRequest } from 'next/server';
import { readFile, writeFile } from 'node:fs/promises';
import { encodeDeployData, isAddress, type Abi } from 'viem';
import { isLocalDevelopment } from '@/lib/local-development';
import { publicClient as testnetClient, mainnetClient } from '@/lib/chain';
import { sharedAbi } from '@/lib/generated/SharedLivingArt';
import testnetF1 from '@/config/f1-deployment.json';

export async function POST(request:NextRequest) {
  if(!isLocalDevelopment(request))return Response.json({saved:false});
  try{
    const body=await request.json();
    const mainnet=body.chainId===143;
    const publicClient=mainnet?mainnetClient:testnetClient;
    const f1=mainnet?JSON.parse(await readFile('config/f1-mainnet.json','utf8')):testnetF1;
    const file=mainnet?'config/shared-mainnet.json':'config/shared-deployment.json';
    if(![10143,143].includes(body.chainId)||!isAddress(body.address)||!isAddress(body.oracle)||body.oracle.toLowerCase()!==f1.address?.toLowerCase()||!/^0x[0-9a-fA-F]{64}$/.test(body.transactionHash))throw Error('Invalid shared deployment');
    if(await publicClient.getChainId()!==body.chainId)throw Error('Wrong network');
    const receipt=await publicClient.getTransactionReceipt({hash:body.transactionHash});
    if(receipt.status!=='success'||receipt.contractAddress?.toLowerCase()!==body.address.toLowerCase())throw Error('Deployment not confirmed');
    const transaction=await publicClient.getTransaction({hash:body.transactionHash});
    const artist=await publicClient.readContract({address:body.address,abi:sharedAbi,functionName:'artist'});
    const oracle=await publicClient.readContract({address:body.address,abi:sharedAbi,functionName:'oracle'});
    if(artist.toLowerCase()!==transaction.from.toLowerCase()||oracle.toLowerCase()!==body.oracle.toLowerCase())throw Error('Deployment identity mismatch');
    const artifact=JSON.parse(await readFile('public/deploy/SharedLivingArt.json','utf8')) as {abi:Abi;bytecode:`0x${string}`};
    if(encodeDeployData({...artifact,args:[body.oracle]}).toLowerCase()!==transaction.input.toLowerCase())throw Error('Constructor bytecode mismatch');
    await writeFile(file,JSON.stringify({chainId:body.chainId,address:body.address,oracle,artist,transactionHash:body.transactionHash,blockNumber:receipt.blockNumber.toString(),deployedAt:new Date().toISOString()},null,2)+'\n');
    return Response.json({saved:true});
  }catch(error){return Response.json({saved:false,error:(error as Error).message},{status:400});}
}
