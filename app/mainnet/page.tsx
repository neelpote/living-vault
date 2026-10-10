import type { Metadata } from 'next';
import { Exhibition } from '@/components/art';
import { Collection } from '@/components/collection';
import { LandingStory, LandingQuestions } from '@/components/landing-story';
export const metadata: Metadata = {title: 'Mainnet Exhibition | Living Vault', description: 'Living artwork, native MON vaults, real F1 results and shared collections on Monad Mainnet.'};
export default function MainnetPage() { return <div className="home-page"><Exhibition mainnet/><LandingStory mainnet/><Collection mainnet/><LandingQuestions mainnet/></div>; }
