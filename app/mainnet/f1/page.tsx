import type { Metadata } from 'next';
import { F1Gallery } from '@/components/f1-gallery';
export const metadata: Metadata = {title: 'Mainnet F1 Edition | Living Vault', description: 'Real F1 results and on-chain art on Monad Mainnet.'};
export default function MainnetF1Page() { return <F1Gallery mainnet/>; }
