import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createPublicClient,createWalletClient,http,parseEther} from 'viem';
import {hardhat} from 'viem/chains';
const node=spawn('node',['node_modules/hardhat/dist/src/cli.js','node','--port','18550'],{stdio:'ignore'});
const transport=http('http://127.0.0.1:18550',{retryCount:0});
const client=createPublicClient({chain:hardhat,transport});
const wallet=createWalletClient({chain:hardhat,transport});
let checks=0;
const pass=s=>{checks++;console.log('PASS '+s);};
const artifact=name=>JSON.parse(readFileSync(`artifacts/${name}.json`));
let alice,bob;
async function deploy(name,args=[]){const a=artifact(name);const r=await client.waitForTransactionReceipt({hash:await wallet.deployContract({...a,args,account:alice})});assert.equal(r.status,'success');return {address:r.contractAddress,abi:a.abi};}
async function write(contract,functionName,args=[],value=0n,account=alice){const {request}=await client.simulateContract({...contract,functionName,args,value,account});const r=await client.waitForTransactionReceipt({hash:await wallet.writeContract(request)});assert.equal(r.status,'success');return r;}
async function rejects(label,fn){await assert.rejects(fn);pass(label);}
try{
  for(let i=0;i<100;i++){try{await client.getChainId();break;}catch{await new Promise(r=>setTimeout(r,100));}}
  assert.equal(await client.getChainId(),31337);[alice,bob]=await wallet.getAddresses();
  const v=await deploy('NativeLivingVault');const read=(functionName,args=[])=>client.readContract({...v,functionName,args});
  await rejects('zero mint',()=>write(v,'mint',[alice]));
  await rejects('minimum deposit enforced',()=>write(v,'mint',[alice],parseEther('0.009')));
  await rejects('zero recipient',()=>write(v,'mint',['0x0000000000000000000000000000000000000000'],parseEther('0.01')));
  await write(v,'mint',[alice],parseEther('0.1'));assert.equal(await read('ownerOf',[1n]),alice);assert.equal(await read('totalPrincipal'),parseEther('0.1'));assert.equal(await client.getBalance({address:v.address}),parseEther('0.1'));pass('native mint, enumeration and exact backed principal');
  const initial=await read('tokenURI',[1n]);await write(v,'topUp',[1n],parseEther('0.02'));assert.notEqual(await read('tokenURI',[1n]),initial);assert.equal((await read('vaultInfo',[1n]))[0],parseEther('0.12'));pass('MON top-up evolves authentic on-chain artwork');
  await rejects('zero top-up',()=>write(v,'topUp',[1n]));
  await rejects('unauthorized top-up',()=>write(v,'topUp',[1n],1n,bob));
  await rejects('unauthorized redemption',()=>write(v,'redeem',[1n],0n,bob));
  await write(v,'approve',[bob,1n]);await rejects('operator cannot redirect payout',()=>write(v,'redeemTo',[1n,bob],0n,bob));
  const before=await read('vaultInfo',[1n]);await write(v,'transferFrom',[alice,bob,1n]);assert.deepEqual(await read('vaultInfo',[1n]),before);await rejects('old owner cannot redeem',()=>write(v,'redeem',[1n]));
  await write(v,'approve',[alice,1n],0n,bob);const balance=await client.getBalance({address:bob});await write(v,'redeem',[1n]);assert.equal(await client.getBalance({address:bob}),balance+parseEther('0.12'));assert.equal(await read('totalSupply'),0n);assert.equal(await read('totalPrincipal'),0n);pass('operator redemption pays current owner and burns NFT');
  await rejects('burned metadata unavailable',()=>read('tokenURI',[1n]));
  await rejects('plain MON transfer rejected',()=>client.estimateGas({account:alice,to:v.address,value:1n}));
  const receiver=await deploy('NativeReceiver',[v.address]);await write(receiver,'configure',[false,true]);await write(receiver,'create',[],parseEther('0.01'));assert.equal(await client.readContract({...receiver,functionName:'reentered'}),false);pass('safe-mint callback cannot reenter custody');
  await write(receiver,'configure',[true,false]);await rejects('failed native payout reverts',()=>write(receiver,'redeem'));assert.equal((await read('ownerOf',[2n])).toLowerCase(),receiver.address.toLowerCase());assert.equal(await read('totalPrincipal'),parseEther('0.01'));pass('failed payout preserves NFT and principal');
  const bobBefore=await client.getBalance({address:bob});await write(receiver,'redirect',[bob]);assert.equal(await client.getBalance({address:bob}),bobBefore+parseEther('0.01'));pass('contract wallet can redirect its own rejected payout');
  await write(receiver,'configure',[false,true]);await write(receiver,'create',[],parseEther('0.01'));await write(receiver,'redeem');assert.equal(await client.readContract({...receiver,functionName:'reentered'}),false);assert.equal(await read('totalPrincipal'),0n);pass('native withdrawal callback cannot double redeem');
  let principal=0n;
  for(let i=0;i<8;i++){const amount=BigInt(i+1)*parseEther('0.01');await write(v,'mint',[alice],amount);principal+=amount;const id=await read('tokenOfOwnerByIndex',[alice,BigInt(i)]);await write(v,'topUp',[id],BigInt(i+1));principal+=BigInt(i+1);assert.equal(await read('totalPrincipal'),principal);assert.ok(await client.getBalance({address:v.address})>=principal);}
  pass('multi-vault solvency and wei-precision accounting');
  const id=await read('tokenOfOwnerByIndex',[alice,0n]);for(let i=0;i<10;i++)await write(v,'topUp',[id],1n);const info=await read('vaultInfo',[id]);assert.equal(info[2],8n);const metadata=JSON.parse(Buffer.from((await read('tokenURI',[id])).split(',')[1],'base64'));assert.equal(Buffer.from(metadata.image.split(',')[1],'base64').toString(),await read('previewSVG',[id,info[0],BigInt(info[1])]));pass('level cap, native metadata and exact preview');
  console.log(`${checks} native custody checks passed; isolated local EVM only.`);
}finally{node.kill('SIGTERM');}
