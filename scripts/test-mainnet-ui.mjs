import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,cpSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createPublicClient,http,keccak256,toHex} from 'viem';
import {hardhat} from 'viem/chains';
import {chromium} from '@playwright/test';

// Mainnet UI is exercised against an isolated local EVM, never real funds.
const report=JSON.parse(readFileSync('config/f1-deployment.json')).constructorReport;
assert.equal(keccak256(toHex(report.canonical)),report.sourceHash);
const alice='0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const rpcURL='http://127.0.0.1:18549';
const chain=spawn('node',['node_modules/hardhat/dist/src/cli.js','node','--port','18549'],{stdio:'ignore'});
const client=createPublicClient({chain:hardhat,transport:http(rpcURL,{retryCount:0})});
const f1=JSON.parse(readFileSync('public/deploy/F1LivingArt.json'));
const shared=JSON.parse(readFileSync('public/deploy/SharedLivingArt.json'));
let directory,app,browser,page;
const checks=[];const pass=s=>{checks.push(s);console.log('PASS '+s);};
try{
  for(let i=0;i<100;i++){try{await client.getChainId();break;}catch{await new Promise(r=>setTimeout(r,100));}}
  directory=mkdtempSync(path.join(tmpdir(),'living-vault-mainnet-ui-'));
  for(const entry of ['app','components','lib','public','config','package.json','tsconfig.json','next.config.ts','next-env.d.ts'])cpSync(entry,path.join(directory,entry),{recursive:true});
  writeFileSync(path.join(directory,'config/f1-mainnet.json'),JSON.stringify({chainId:143,address:null,transactionHash:null}));
  writeFileSync(path.join(directory,'config/shared-mainnet.json'),JSON.stringify({chainId:143,address:null,oracle:null,transactionHash:null}));
  symlinkSync(path.resolve('node_modules'),path.join(directory,'node_modules'));
  app=spawn('node',[path.resolve('node_modules/next/dist/bin/next'),'dev','--webpack','--hostname','127.0.0.1','--port','3006'],{cwd:directory,stdio:'ignore'});
  for(let i=0;i<150;i++){try{if((await fetch('http://127.0.0.1:3006/mainnet')).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
  browser=await chromium.launch();const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await context.route('**/api/f1',r=>r.fulfill({json:report}));
  for(const endpoint of ['f1-deployment','shared-deployment'])await context.route(`**/api/${endpoint}`,r=>r.fulfill({json:{saved:false}}));
  let zeroBalance=true;
  await context.route(/https:\/\/(rpc\.monad\.xyz|testnet-rpc\.monad\.xyz|rpc-testnet\.monadinfra\.com)/,async route=>{
    const request=route.request().postDataJSON();const mainnet=route.request().url().includes('https://rpc.monad.xyz');
    const rpc=async p=>p.method==='eth_chainId'?{jsonrpc:'2.0',id:p.id,result:mainnet?'0x8f':'0x279f'}:mainnet&&zeroBalance&&p.method==='eth_getBalance'?{jsonrpc:'2.0',id:p.id,result:'0x0'}:await(await fetch(rpcURL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)})).json();
    await route.fulfill({json:Array.isArray(request)?await Promise.all(request.map(rpc)):await rpc(request),headers:{'access-control-allow-origin':'*'}});
  });
  const signed=[];
  await context.exposeBinding('localWalletRpc',async(_,payload)=>{
    if(payload.method==='eth_sendTransaction'){
      signed.push(structuredClone(payload.params[0]));delete payload.params[0].chainId;delete payload.params[0].nonce;
    }
    const r=await(await fetch(rpcURL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,id:1,jsonrpc:'2.0'})})).json();
    if(r.error)throw Error(r.error.message);return r.result;
  });
  await context.addInitScript(alice=>{
    const listeners=new Map();let chainId='0x279f';
    window.ethereum={isMetaMask:true,on:(e,f)=>listeners.set(e,[...(listeners.get(e)||[]),f]),removeListener:(e,f)=>listeners.set(e,(listeners.get(e)||[]).filter(g=>g!==f)),request:async({method,params=[]})=>{
      if(method==='eth_requestAccounts'){localStorage.setItem('authorized','true');return [alice];}
      if(method==='eth_accounts')return localStorage.getItem('authorized')?[alice]:[];
      if(method==='eth_chainId')return chainId;
      if(method==='wallet_switchEthereumChain'){if(window.__rejectSwitch)throw Error('User rejected network switch');chainId=params[0].chainId;for(const f of listeners.get('chainChanged')||[])f(chainId);return null;}
      if(method==='wallet_getCapabilities')return {};
      return window.localWalletRpc({method,params});
    }};
  },alice);
  page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(45000);
  await page.goto('http://127.0.0.1:3006/mainnet',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Connect wallet',exact:true}).first().click();await page.getByRole('button',{name:'MetaMask',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Deploy F1 oracle & collection'}).isDisabled(),true);assert.equal(signed.length,0);pass('wrong-network deployment disabled without any signing request');
  await page.getByRole('button',{name:'Switch network',exact:true}).click();
  await page.getByRole('button',{name:'Deploy F1 oracle & collection'}).click();
  await page.getByText('Not enough MON on Monad Mainnet for the maximum deployment fee.',{exact:true}).waitFor();assert.equal(signed.length,0);pass('unfunded mainnet account blocked before wallet signature');zeroBalance=false;
  await page.getByRole('button',{name:'Deploy F1 oracle & collection'}).click();await page.locator('.f1-canvas img').waitFor();
  const deployed=await page.evaluate(()=>JSON.parse(localStorage.getItem('living-vault-f1-mainnet')));
  assert.equal(deployed.chainId,143);assert.equal(await client.readContract({address:deployed.address,abi:f1.abi,functionName:'sourceHash'}),report.sourceHash);assert.equal(await client.readContract({address:deployed.address,abi:f1.abi,functionName:'reporter'}),alice);
  assert.equal(await page.evaluate(()=>localStorage.getItem('living-vault-f1')),null);pass('mainnet F1 deployment validates real report and uses separate storage');
  await page.getByRole('button',{name:"Mint this team's artwork"}).click();await page.getByText('Minted No. 1',{exact:false}).first().waitFor();assert.equal(await client.readContract({address:deployed.address,abi:f1.abi,functionName:'ownerOf',args:[1n]}),alice);pass('mainnet F1 mint refreshes confirmed ownership');
  assert.ok((await page.locator('.tx-panel a').first().getAttribute('href')).startsWith('https://monadvision.com/tx/'));pass('mainnet receipts link to the mainnet explorer');
  await page.getByRole('link',{name:'View NFT',exact:false}).click();await page.waitForURL('**/mainnet/nft/f1/1');await page.locator('.nft-original').waitFor();assert.ok(await page.locator('.native-controls').getByText('No. 1',{exact:true}).isVisible());await page.getByRole('link',{name:'Back to collection',exact:false}).click();await page.locator('.f1-canvas img').waitFor();pass('minted NFT opens a chain-backed in-app viewer instead of unsupported explorer token URL');
  await page.getByRole('link',{name:'Shared collection',exact:true}).click();
  // A new document starts the test wallet on Testnet again; switch explicitly.
  const switchButton=page.getByRole('button',{name:'Switch network',exact:true});if(await switchButton.isVisible())await switchButton.click();
  await page.getByRole('button',{name:'Deploy shared collection'}).click();await page.locator('.shared-canvas>img').waitFor();
  const collection=await page.evaluate(()=>JSON.parse(localStorage.getItem('living-vault-shared-mainnet')));
  assert.equal(collection.chainId,143);assert.equal(collection.oracle.toLowerCase(),deployed.address.toLowerCase());assert.equal((await client.readContract({address:collection.address,abi:shared.abi,functionName:'oracle'})).toLowerCase(),deployed.address.toLowerCase());pass('mainnet shared collection links to the new mainnet oracle, never Testnet');
  await page.getByRole('button',{name:'Claim this fragment'}).click();await page.getByRole('button',{name:'Save expression'}).waitFor();assert.equal(await client.readContract({address:collection.address,abi:shared.abi,functionName:'ownerOf',args:[1n]}),alice);
  await page.getByRole('button',{name:'Bold',exact:true}).click();await page.getByRole('button',{name:'Save expression'}).click();await page.locator('.tx-panel').filter({has:page.getByText('Change your fragment expression',{exact:true})}).getByText('Confirmed · artwork refreshed',{exact:true}).waitFor();assert.equal(await client.readContract({address:collection.address,abi:shared.abi,functionName:'expression',args:[1n]}),2);pass('mainnet fragment claim and expression update refresh confirmed art');
  assert.equal(signed.length,5);assert.ok(signed.every(t=>t.gas&&t.maxFeePerGas&&t.maxPriorityFeePerGas&&(!t.value||BigInt(t.value)===0n)));pass('all writes have explicit gas/fee caps and no native-value payment');
  await page.evaluate(()=>window.__rejectSwitch=true);await page.getByRole('button',{name:'Testnet',exact:true}).click();await page.getByRole('dialog',{name:'Network change'}).waitFor();assert.ok(page.url().endsWith('/mainnet/together'));await page.getByRole('button',{name:'Close dialog'}).click();await page.evaluate(()=>window.__rejectSwitch=false);pass('rejected navbar network switch preserves current mainnet edition');
  await page.getByRole('button',{name:'Testnet',exact:true}).click();await page.waitForURL('**/together');await page.waitForFunction(()=>[...document.querySelectorAll('.network-switch button')].find(b=>b.textContent==='Testnet')?.getAttribute('aria-pressed')==='true');assert.equal(await page.getByRole('button',{name:'Testnet',exact:true}).getAttribute('aria-pressed'),'true');await page.getByRole('button',{name:'Mainnet',exact:true}).click();await page.waitForURL('**/mainnet/together');await page.waitForFunction(()=>[...document.querySelectorAll('.network-switch button')].find(b=>b.textContent==='Mainnet')?.getAttribute('aria-pressed')==='true');await page.locator('.shared-canvas>img').waitFor();assert.equal(await page.getByRole('button',{name:'Mainnet',exact:true}).getAttribute('aria-pressed'),'true');assert.equal(signed.length,5);pass('navbar changes wallet network and matching collection route without a transaction');
  mkdirSync('test-results',{recursive:true});for(const width of [1440,390,320]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`test-results/mainnet-ui-${width}.png`,fullPage:true});}assert.deepEqual(errors,[]);pass('responsive mainnet artwork and no page errors');
  writeFileSync('test-results/mainnet-ui-report.json',JSON.stringify({checks,scope:'Mainnet UI on isolated local EVM only. No actual mainnet transaction.',sourceHash:report.sourceHash},null,2));
}catch(error){if(page){console.error((await page.locator('body').innerText()).slice(0,3500));mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/mainnet-ui-failure.png',fullPage:true});}throw error;}
finally{await browser?.close();app?.kill('SIGTERM');chain.kill('SIGTERM');if(directory)rmSync(directory,{recursive:true,force:true});}
