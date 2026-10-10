import type {NextRequest} from 'next/server';
import {readFile,writeFile} from 'node:fs/promises';
import {isAddress} from 'viem';
import {isLocalDevelopment} from '@/lib/local-development';
import {mainnetClient} from '@/lib/chain';
export async function POST(request:NextRequest){
  if(!isLocalDevelopment(request))return Response.json({saved:false});
  try{
    const body=await request.json();
    if(body.chainId!==143||!isAddress(body.address)||!/^0x[\da-fA-F]{64}$/.test(body.transactionHash))throw Error('Invalid MON vault deployment.');
    if(await mainnetClient.getChainId()!==143)throw Error('Wrong RPC network.');
    const [receipt,transaction,artifact]=await Promise.all([mainnetClient.getTransactionReceipt({hash:body.transactionHash}),mainnetClient.getTransaction({hash:body.transactionHash}),readFile('public/deploy/NativeLivingVault.json','utf8').then(JSON.parse)]);
    if(receipt.status!=='success'||receipt.contractAddress?.toLowerCase()!==body.address.toLowerCase()||transaction.to!==null||transaction.value!==0n||transaction.input.toLowerCase()!==artifact.bytecode.toLowerCase())throw Error('Confirmed deployment does not match the MON vault artifact.');
    if((await mainnetClient.getCode({address:body.address}))?.toLowerCase()!==artifact.deployedBytecode.toLowerCase())throw Error('Deployed runtime bytecode mismatch.');
    await writeFile('config/native-mainnet.json',JSON.stringify({chainId:143,address:body.address,transactionHash:body.transactionHash,blockNumber:receipt.blockNumber.toString(),deployedAt:new Date().toISOString(),verification:'not-submitted'},null,2)+'\n');
    return Response.json({saved:true});
  }catch(error){return Response.json({saved:false,error:(error as Error).message},{status:400});}
}
