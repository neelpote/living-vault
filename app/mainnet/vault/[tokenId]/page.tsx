import { NativeVault } from '@/components/native-vault';
export default async function NativeVaultDetail({params}:{params:Promise<{tokenId:string}>}) {
  const {tokenId}=await params;
  return <NativeVault tokenId={tokenId}/>;
}
