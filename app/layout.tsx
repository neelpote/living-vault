import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { Shell } from '@/components/shell';
import './globals.css';
export const metadata: Metadata = { title: 'Living Vault | Art in a constant state of becoming', description: 'Evolving generative art, held entirely on Monad Testnet. Deposit, evolve, collect.' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Providers><Shell>{children}</Shell></Providers></body></html>;
}
