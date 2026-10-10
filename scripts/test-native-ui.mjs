import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,mkdtempSync,cpSync,symlinkSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createPublicClient,http,parseEther} from 'viem';
import {hardhat} from 'viem/chains';
import {chromium} from '@playwright/test';
const rpcURL='http://127.0.0.1:18551';
const node=spawn('node',['node_modules/hardhat/dist/src/cli.js','node','--port','18551'],{stdio:'ignore'});
const client=createPublicClient({chain:hardhat,transport:http(rpcURL,{retryCount:0})});
const alice='0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',bob='0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const artifact=JSON.parse(readFileSync('public/deploy/NativeLivingVault.json'));
let directory,app,browser;let checks=0;const pass=s=>{checks++;console.log('PASS '+s);};
try{
  for(let i=0;i<100;i++){try{await client.getChainId();break;}catch{await new Promise(r=>setTimeout(r,100));}}
  directory=mkdtempSync(path.join(tmpdir(),'living-vault-native-ui-'));
  for(const entry of ['app','components','lib','public','config','package.json','tsconfig.json','next.config.ts','next-env.d.ts'])cpSync(entry,path.join(directory,entry),{recursive:true});
  writeFileSync(path.join(directory,'config/native-mainnet.json'),JSON.stringify({chainId:143,address:null,transactionHash:null,blockNumber:null}));
  symlinkSync(path.resolve('node_modules'),path.join(directory,'node_modules'));
  app=spawn('node',[path.resolve('node_modules/next/dist/bin/next'),'dev','--webpack','--hostname','127.0.0.1','--port','3007'],{cwd:directory,stdio:'ignore'});
  for(let i=0;i<150;i++){try{if((await fetch('http://127.0.0.1:3007/mainnet/vault')).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
  browser=await chromium.launch();const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await context.route('**/api/native-deployment',route=>route.fulfill({json:{saved:false}}));
  let fakeBalance=null;let fakeDelegation=false;
  await context.route('https://rpc.monad.xyz/**',async route=>{
    const request=route.request().postDataJSON();
    const rpc=async p=>p.method==='eth_chainId'?{jsonrpc:'2.0',id:p.id,result:'0x8f'}:fakeDelegation&&p.method==='eth_getCode'&&p.params[0].toLowerCase()===alice.toLowerCase()?{jsonrpc:'2.0',id:p.id,result:'0xef010063c0c19a282a1b52b07dd5a65b58948a07dae32b'}:fakeBalance!==null&&p.method==='eth_getBalance'?{jsonrpc:'2.0',id:p.id,result:fakeBalance}:await(await fetch(rpcURL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)})).json();
    await route.fulfill({json:Array.isArray(request)?await Promise.all(request.map(rpc)):await rpc(request),headers:{'access-control-allow-origin':'*'}});
  });
  const signed=[];await context.exposeBinding('localWalletRpc',async(_,payload)=>{
    if(payload.method==='eth_sendTransaction'){signed.push(structuredClone(payload.params[0]));delete payload.params[0].chainId;delete payload.params[0].nonce;}
    const result=await(await fetch(rpcURL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,id:1,jsonrpc:'2.0'})})).json();if(result.error)throw Error(result.error.message);return result.result;
  });
  await context.addInitScript(alice=>{
    const listeners=new Map();let chainId=localStorage.getItem('wallet-chain')||'0x279f';
    window.ethereum={isMetaMask:true,on:(e,f)=>listeners.set(e,[...(listeners.get(e)||[]),f]),removeListener:(e,f)=>listeners.set(e,(listeners.get(e)||[]).filter(g=>g!==f)),request:async({method,params=[]})=>{
      if(method==='eth_requestAccounts'){localStorage.setItem('authorized','true');return [alice];}if(method==='eth_accounts')return localStorage.getItem('authorized')?[alice]:[];
      if(method==='eth_chainId')return chainId;if(method==='wallet_switchEthereumChain'){chainId=params[0].chainId;localStorage.setItem('wallet-chain',chainId);for(const f of listeners.get('chainChanged')||[])f(chainId);return null;}
      if(method==='wallet_getCapabilities')return {};return window.localWalletRpc({method,params});
    }};
  },alice);
  const page=await context.newPage();page.setDefaultTimeout(45000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:3007/mainnet/vault',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Connect wallet',exact:true}).first().click();await page.getByRole('button',{name:'MetaMask',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Deploy MON vault',exact:true}).isDisabled(),true);assert.equal(signed.length,0);pass('wrong-network native deployment cannot sign');
  await page.getByRole('button',{name:'Switch network',exact:true}).click();fakeBalance='0x0';await page.getByRole('button',{name:'Deploy MON vault',exact:true}).click();await page.getByText('Not enough MON for the maximum deployment fee.',{exact:true}).waitFor();assert.equal(signed.length,0);pass('unfunded native deployment blocked before signing');fakeBalance=null;
  await page.getByRole('button',{name:'Deploy MON vault',exact:true}).click();await page.getByRole('button',{name:'Deposit MON & mint',exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('.native-controls .button.full')?.disabled);
  const deployed=await page.evaluate(()=>JSON.parse(localStorage.getItem('living-vault-native-mainnet')));assert.equal((await client.getCode({address:deployed.address})).toLowerCase(),artifact.deployedBytecode.toLowerCase());pass('deployment has exact expected runtime and separate native configuration');
  await page.locator('#native-amount').fill('0.001');assert.equal(await page.getByRole('button',{name:'Deposit MON & mint',exact:true}).isDisabled(),true);await page.locator('#native-amount').fill('0.02');
  fakeBalance='0x'+parseEther('0.020000000000000001').toString(16);await page.getByRole('button',{name:'Deposit MON & mint',exact:true}).click();await page.getByText('Not enough MON on Monad Mainnet for the deposit plus maximum network fee.',{exact:true}).waitFor();assert.equal(signed.length,1);pass('deposit plus full network fee checked before signing');fakeBalance=null;
  fakeDelegation=true;fakeBalance='0x'+parseEther('2.48').toString(16);await page.getByRole('button',{name:'Deposit MON & mint',exact:true}).click();await page.getByText('This wallet is a delegated smart account.',{exact:false}).waitFor();assert.equal(signed.length,1);pass('delegated smart-account reserve rejects native deposit before signing');fakeDelegation=false;fakeBalance=null;
  await page.getByRole('button',{name:'Deposit MON & mint',exact:true}).click();await page.waitForURL('**/mainnet/vault/1');await page.locator('.native-layout img').waitFor();assert.equal((await client.readContract({address:deployed.address,abi:artifact.abi,functionName:'vaultInfo',args:[1n]}))[0],parseEther('0.02'));assert.equal(BigInt(signed[1].value),parseEther('0.02'));pass('MON mint sends exact native value, no token approval');
  const before=await page.locator('.native-layout img').getAttribute('src');await page.locator('#native-amount').fill('0.01');await page.getByRole('button',{name:'Deposit MON & evolve',exact:true}).click();await page.getByText('Confirmed · artwork refreshed',{exact:true}).waitFor();assert.notEqual(await page.locator('.native-layout img').getAttribute('src'),before);assert.equal((await client.readContract({address:deployed.address,abi:artifact.abi,functionName:'vaultInfo',args:[1n]}))[0],parseEther('0.03'));pass('confirmed MON top-up refreshes balance and evolved on-chain art');
  mkdirSync('test-results',{recursive:true});for(const width of [1440,390,320]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`test-results/native-vault-${width}.png`,fullPage:true});}pass('native vault layout fits desktop and mobile');
  await page.getByRole('button',{name:'Redeem MON',exact:true}).click();await page.getByRole('button',{name:'Burn NFT & return MON',exact:true}).click();await page.getByText('Principal returned. Artwork burned.',{exact:true}).waitFor();assert.equal(await client.readContract({address:deployed.address,abi:artifact.abi,functionName:'totalPrincipal'}),0n);assert.equal(await client.readContract({address:deployed.address,abi:artifact.abi,functionName:'totalSupply'}),0n);pass('confirmed redemption burns NFT, returns principal and clears owned collection');
  await page.getByRole('link',{name:'Create another vault',exact:false}).click();await page.getByRole('button',{name:'Deposit MON & mint',exact:true}).click();await page.waitForURL('**/mainnet/vault/2');await page.getByRole('button',{name:'Transfer',exact:true}).click();await page.locator('#native-recipient').fill(bob);await page.getByRole('button',{name:'Transfer vault',exact:false}).click();await page.waitForFunction(()=>!document.querySelector('#native-amount'));assert.equal((await client.readContract({address:deployed.address,abi:artifact.abi,functionName:'ownerOf',args:[2n]})).toLowerCase(),bob.toLowerCase());pass('transfer moves custody rights and removes old-owner controls');
  assert.ok(signed.every(t=>t.gas&&t.maxFeePerGas&&t.maxPriorityFeePerGas));assert.equal(signed.length,6);assert.deepEqual(errors,[]);pass('every transaction has explicit fees and no hydration or page errors');
  writeFileSync('test-results/native-ui-report.json',JSON.stringify({checks,scope:'Isolated local EVM and simulated chain143 wallet. No public transactions.'},null,2));
}finally{await browser?.close();app?.kill('SIGTERM');node.kill('SIGTERM');if(directory)rmSync(directory,{recursive:true,force:true});}
