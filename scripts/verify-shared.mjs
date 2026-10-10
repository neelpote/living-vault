import {readFileSync,writeFileSync} from 'node:fs';
import {encodeAbiParameters} from 'viem';
import solc from 'solc';
const mainnet=process.argv.includes('--mainnet');
const chainId=mainnet?143:10143;
const file=mainnet?'config/shared-mainnet.json':'config/shared-deployment.json';
const d=JSON.parse(readFileSync(file));
if(d.chainId!==chainId||!d.address)throw Error('No confirmed shared deployment on the requested network.');
const artifact=JSON.parse(readFileSync('artifacts/SharedLivingArt.json'));
const full=JSON.parse(readFileSync('artifacts/standard-input.json'));
// Import-callback parsing allocated AST IDs before dependencies. Preserve that
// order with source-path aliases; executable bytes must match before submission.
const initial={...full,sources:Object.fromEntries(Object.entries(full.sources).filter(([name])=>name.startsWith('contracts/'))),settings:{...full.settings,outputSelection:{'*':{'':['ast']}}}};
const parsed=JSON.parse(solc.compile(JSON.stringify(initial),{import:name=>({contents:full.sources[name].content})}));
if(parsed.errors?.some(e=>e.severity==='error'))throw Error('Original source parsing failed');
const order=Object.entries(parsed.sources).sort((a,b)=>a[1].ast.id-b[1].ast.id);
const mapping=Object.fromEntries(order.map(([name],i)=>[name,name.startsWith('contracts/')?name:`z/${String(i).padStart(3,'0')}/${name}`]));
const sources={};
for(const [name,unit] of order){
  let content=Buffer.from(full.sources[name].content);
  for(const node of unit.ast.nodes.filter(n=>n.nodeType==='ImportDirective').sort((a,b)=>Number(b.src.split(':')[0])-Number(a.src.split(':')[0]))){
    const [start,length]=node.src.split(':').map(Number);const fragment=content.subarray(start,start+length).toString();
    const changed=fragment.replace(JSON.stringify(node.file),JSON.stringify(mapping[node.absolutePath]));
    if(fragment===changed&&node.file!==mapping[node.absolutePath])throw Error('Cannot resolve import alias');
    content=Buffer.concat([content.subarray(0,start),Buffer.from(changed),content.subarray(start+length)]);
  }
  sources[mapping[name]]={content:content.toString()};
}
const verificationInput={...full,sources};const compiled=JSON.parse(solc.compile(JSON.stringify(verificationInput)));
if(compiled.errors?.some(e=>e.severity==='error'))throw Error('Verification input does not compile');
const result=compiled.contracts['contracts/SharedLivingArt.sol'].SharedLivingArt;
const stripMetadata=bytes=>bytes.slice(0,-(parseInt(bytes.slice(-4),16)+2)*2);
if(stripMetadata(result.evm.bytecode.object)!==stripMetadata(artifact.bytecode.slice(2))||stripMetadata(result.evm.deployedBytecode.object)!==stripMetadata(artifact.deployedBytecode.slice(2)))throw Error('Executable bytecode mismatch; refusing submission');
const payload={chainId,contractAddress:d.address,contractName:'contracts/SharedLivingArt.sol:SharedLivingArt',compilerVersion:'v'+artifact.compilerVersion.split('.Emscripten')[0],standardJsonInput:verificationInput,foundryMetadata:JSON.parse(result.metadata),constructorArgs:encodeAbiParameters(artifact.abi.find(a=>a.type==='constructor').inputs,[d.oracle]).slice(2)};
const response=await fetch('https://agents.devnads.com/v1/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(60000)});const body=await response.text();
console.log(`HTTP ${response.status}: ${body}`);d.verification={httpStatus:response.status,response:body,submittedAt:new Date().toISOString(),method:'AST-order-preserving import path aliases; executable bytes locally matched; metadata path hashes differ'};writeFileSync(file,JSON.stringify(d,null,2)+'\n');if(!response.ok||!JSON.parse(body).success)process.exitCode=1;
