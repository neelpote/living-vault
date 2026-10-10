import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createPublicClient,http,formatEther,keccak256,toHex} from 'viem';
import {monad} from 'viem/chains';
const deployment=JSON.parse(readFileSync('config/native-mainnet.json'));
const artifact=JSON.parse(readFileSync('artifacts/NativeLivingVault.json'));
assert.equal(deployment.chainId,143);assert.ok(deployment.address&&deployment.transactionHash);
const client=createPublicClient({chain:monad,transport:http('https://rpc.monad.xyz')});
assert.equal(await client.getChainId(),143);
const [receipt,transaction,code]=await Promise.all([client.getTransactionReceipt({hash:deployment.transactionHash}),client.getTransaction({hash:deployment.transactionHash}),client.getCode({address:deployment.address})]);
assert.equal(receipt.status,'success');assert.equal(receipt.contractAddress.toLowerCase(),deployment.address.toLowerCase());assert.equal(transaction.input.toLowerCase(),artifact.bytecode.toLowerCase());assert.equal(transaction.value,0n);assert.equal(code.toLowerCase(),artifact.deployedBytecode.toLowerCase());
const read=(functionName,args=[])=>client.readContract({address:deployment.address,abi:artifact.abi,functionName,args});
const [principal,balance,supply,min,next]=await Promise.all([read('totalPrincipal'),client.getBalance({address:deployment.address}),read('totalSupply'),read('MIN_DEPOSIT'),read('nextTokenId')]);
assert.ok(balance>=principal);assert.equal(min,10n**16n);
const tokens=[];let sum=0n;
assert.ok(supply<=1000n,'Collection exceeds bounded read-only evidence scan; use an indexer.');
for(let i=0n;i<supply;i++){
  const id=await read('tokenByIndex',[i]);const [info,owner,uri]=await Promise.all([read('vaultInfo',[id]),read('ownerOf',[id]),read('tokenURI',[id])]);
  const metadata=JSON.parse(Buffer.from(uri.split(',')[1],'base64'));const svg=Buffer.from(metadata.image.split(',')[1],'base64').toString();
  assert.equal(svg,await read('previewSVG',[id,info[0],BigInt(info[1])]));sum+=info[0];tokens.push({id:id.toString(),owner,principalWei:info[0].toString(),topUps:info[1],level:info[2].toString(),artworkDigest:keccak256(toHex(svg))});
}
assert.equal(sum,principal);
const evidence={checkedAt:new Date().toISOString(),scope:'Read-only actual Monad Mainnet. No wallet signing or write.',chainId:143,address:deployment.address,transactionHash:deployment.transactionHash,deployer:transaction.from,blockNumber:receipt.blockNumber.toString(),exactCreationAndRuntimeMatch:true,gasLimit:transaction.gas.toString(),deploymentFeeMON:formatEther(transaction.gas*receipt.effectiveGasPrice),totalPrincipalWei:principal.toString(),balanceWei:balance.toString(),totalSupply:supply.toString(),nextTokenId:next.toString(),tokens};
writeFileSync('docs/native-mainnet-evidence.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence,null,2));
