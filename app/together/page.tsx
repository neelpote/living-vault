import type { Metadata } from 'next';
import { SharedGallery } from '@/components/shared-gallery';
export const metadata: Metadata = {title:'Living Together | Living Vault',description:'Own a fragment, shape a shared composition and vote on artistic chapters powered by real F1 reports.'};
export default function TogetherPage() {return <SharedGallery/>;}
