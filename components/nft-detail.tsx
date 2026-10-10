'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {isAddress,parseAbi,type Address} from 'viem';
import {ArrowUpRight,Download,RefreshCw} from 'lucide-react';
import {decodeMetadata,mainnetClient,publicClient,mainnetExplorer,explorer,shortAddress} from '@/lib/chain';
import {friendlyError} from '@/lib/hooks';
import f1Mainnet from '@/config/f1-mainnet.json';
import f1Testnet from '@/config/f1-deployment.json';
import sharedMainnet from '@/config/shared-mainnet.json';
import sharedTestnet from '@/config/shared-deployment.json';
const abi=parseAbi(['function ownerOf(uint256) view returns (address)','function tokenURI(uint256) view returns (string)']);
export function NFTDetail({collection,tokenId,mainnet=false}:{collection:string;tokenId:string;mainnet?:boolean}){
  const supported=collection==='f1'||collection==='together';
  const configured=collection==='f1'?(mainnet?f1Mainnet:f1Testnet):(mainnet?sharedMainnet:sharedTestnet);
  const [contract,setContract]=useState<Address|null>(supported?configured.address as Address|null:null);
  useEffect(()=>{if(!supported||configured.address)return;try{const saved=JSON.parse(localStorage.getItem(`living-vault-${collection==='f1'?'f1':'shared'}${mainnet?'-mainnet':''}`)||'null');if(saved?.chainId===(mainnet?143:10143)&&isAddress(saved.address))setContract(saved.address);}catch{}},[collection,mainnet]);
  const id=/^[1-9]\d{0,76}$/.test(tokenId)&&BigInt(tokenId)<2n**256n?BigInt(tokenId):undefined;
  const client=mainnet?mainnetClient:publicClient;const explorerURL=mainnet?mainnetExplorer:explorer;
  const back=collection==='f1'?(mainnet?'/mainnet/f1':'/f1'):(mainnet?'/mainnet/together':'/together');
  const nft=useQuery({queryKey:['nft-detail',mainnet?143:10143,contract,tokenId],enabled:supported&&!!contract&&id!==undefined,refetchInterval:15000,queryFn:async()=>{
    const [owner,uri]=await Promise.all([client.readContract({address:contract!,abi,functionName:'ownerOf',args:[id!]}),client.readContract({address:contract!,abi,functionName:'tokenURI',args:[id!]})]);return {owner,uri,...decodeMetadata(uri)};
  }});
  return <section className="native-page"><Link href={back} className="back-link">Back to collection<ArrowUpRight size={16}/></Link><header className="page-title"><span className="eyebrow">{mainnet?'MONAD MAINNET / 143':'MONAD TESTNET / 10143'}</span><h1>{nft.data?.name??`NFT No. ${tokenId}`}</h1></header>
    {!supported||id===undefined?<p role="alert" className="error">Invalid NFT collection or token number.</p>:!contract?<p>This collection has not been deployed.</p>:nft.isError?<p role="alert" className="error">{friendlyError(nft.error)} The NFT could not be read; no substitute artwork is shown.</p>:!nft.data?<p>Reading NFT ownership and artwork from the contract...</p>:<div className="native-layout"><img className="nft-original" src={nft.data.image} alt={nft.data.name}/><div className="native-controls"><span className="eyebrow">ORIGINAL ON-CHAIN ARTWORK</span><h2>No. {tokenId}</h2><p>Current owner: <a href={`${explorerURL}/address/${nft.data.owner}`} target="_blank" rel="noreferrer">{shortAddress(nft.data.owner)}<ArrowUpRight size={14}/></a></p><dl className="docs-specs">{nft.data.attributes.map((attribute,i)=><div key={i}><dt>{attribute.trait_type}</dt><dd>{String(attribute.value)}</dd></div>)}</dl><p className="fine-print">Artwork and ownership are read directly from this collection. Explorer NFT indexing can lag independently of mint confirmation.</p><a className="text-link" href={`${explorerURL}/address/${contract}`} target="_blank" rel="noreferrer">Collection contract<ArrowUpRight size={16}/></a><a className="text-link" href={nft.data.image} download={`${collection}-${tokenId}.svg`}><Download size={16}/>Original SVG</a></div></div>}
    <button className="text-button" disabled={!contract||nft.isFetching} onClick={()=>void nft.refetch()}><RefreshCw size={16}/>Refresh ownership & artwork</button>
  </section>;
}
