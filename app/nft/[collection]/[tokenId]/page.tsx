import {NFTDetail} from '@/components/nft-detail';
export default async function Page({params}:{params:Promise<{collection:string;tokenId:string}>}){return <NFTDetail {...await params}/>;}
