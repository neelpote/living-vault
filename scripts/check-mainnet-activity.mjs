import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createPublicClient,http,decodeEventLog,decodeFunctionData,formatEther} from 'viem';
import {monad} from 'viem/chains';

const client=createPublicClient({chain:monad,transport:http('https://rpc.monad.xyz',{timeout:15000})});
assert.equal(await client.getChainId(),143);
const contracts=[
  ['F1LivingArt','config/f1-mainnet.json'],
  ['SharedLivingArt','config/shared-mainnet.json'],
  ['NativeLivingVault','config/native-mainnet.json']
].map(([name,path])=>({name,configuration:JSON.parse(readFileSync(path)),abi:JSON.parse(readFileSync(`public/deploy/${name}.json`)).abi}));
const addresses=contracts.map(c=>c.configuration.address);
const byAddress=new Map(contracts.map(c=>[c.configuration.address.toLowerCase(),c]));
const fromBlock=112172507n;
const toBlock=await client.getBlockNumber();
const transactions=new Map();
// Monad's public RPC permits at most 100 blocks per log request.
for(let start=fromBlock;start<=toBlock;start+=100n){
  const end=start+99n>toBlock?toBlock:start+99n;
  const logs=await client.getLogs({address:addresses,fromBlock:start,toBlock:end});
  for(const log of logs){
    assert.equal(log.removed,false);
    const contract=byAddress.get(log.address.toLowerCase());
    const event=decodeEventLog({abi:contract.abi,data:log.data,topics:log.topics,strict:true});
    const key=`${log.transactionHash}:${log.address.toLowerCase()}`;
    const entry=transactions.get(key)??{transactionHash:log.transactionHash,contract:contract.name,address:log.address,blockNumber:log.blockNumber.toString(),events:[]};
    entry.events.push({name:event.eventName,args:event.args,logIndex:log.logIndex,data:log.data,topics:log.topics});
    transactions.set(key,entry);
  }
  if((start-fromBlock)%1000n===0n)console.log(`Scanned through block ${end}`);
}
const verified=[];
for(const entry of transactions.values()){
  const [receipt,transaction,block]=await Promise.all([
    client.getTransactionReceipt({hash:entry.transactionHash}),
    client.getTransaction({hash:entry.transactionHash}),
    client.getBlock({blockNumber:BigInt(entry.blockNumber)})
  ]);
  assert.equal(receipt.status,'success');
  assert.equal(receipt.blockNumber.toString(),entry.blockNumber);
  const contract=byAddress.get(entry.address.toLowerCase());
  const deployment=!transaction.to;
  for(const event of entry.events){
    const log=receipt.logs.find(l=>l.logIndex===event.logIndex&&l.address.toLowerCase()===entry.address.toLowerCase());
    assert.ok(log);assert.equal(log.data,event.data);assert.deepEqual(log.topics,event.topics);
  }
  if(deployment)assert.equal(receipt.contractAddress.toLowerCase(),entry.address.toLowerCase());
  const direct=transaction.to?.toLowerCase()===entry.address.toLowerCase();
  const call=deployment?{functionName:'deployment',args:[]}:direct?decodeFunctionData({abi:contract.abi,data:transaction.input}):{functionName:'wallet/router call; see verified contract events',args:[]};
  verified.push({...entry,status:receipt.status,sender:transaction.from,transactionTo:transaction.to,action:call.functionName,arguments:call.args,valueMON:formatEther(transaction.value),timestamp:new Date(Number(block.timestamp)*1000).toISOString()});
}
verified.sort((a,b)=>Number(BigInt(a.blockNumber)-BigInt(b.blockNumber)));
const evidence={chainId:143,checkedAt:new Date().toISOString(),scope:'Read-only successful receipts and decoded events for all three mainnet contracts. No wallet signing. Only event-emitting transactions are included; rejected wallet requests and reverted transactions are not counted.',fromBlock:fromBlock.toString(),toBlock:toBlock.toString(),transactions:verified};
writeFileSync('docs/mainnet-transactions.json',JSON.stringify(evidence,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n');
console.log(JSON.stringify(evidence,(_,v)=>typeof v==='bigint'?v.toString():v,2));
