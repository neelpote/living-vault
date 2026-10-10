import { VaultDetail } from '@/components/vault-detail';
export default async function Detail({ params }: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = await params; return <VaultDetail tokenId={tokenId}/>;
}
