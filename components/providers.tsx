'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import saved from '@/config/deployment.json';
import { monadTestnet, type Deployment } from '@/lib/chain';

// Direct account requests avoid an extra wallet_requestPermissions prompt on connection.
const config = createConfig({ chains: [monadTestnet], connectors: [injected({ target: 'metaMask', shimDisconnect: false }), injected({ shimDisconnect: false })], multiInjectedProviderDiscovery: true,
  transports: { [monadTestnet.id]: http('https://testnet-rpc.monad.xyz') }, ssr: true });
const DeploymentContext = createContext<{ deployment: Deployment; save: (d: Deployment) => void }>({ deployment: saved as Deployment, save: () => {} });
export const useDeployment = () => useContext(DeploymentContext);
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, retry: 2, refetchOnWindowFocus: false } } }));
  const [deployment, setDeployment] = useState<Deployment>(saved as Deployment);
  useEffect(() => {
    if (saved.livingVault && saved.mockUSDC) return;
    try { const local = JSON.parse(localStorage.getItem('living-vault-deployment') || 'null'); if (local?.chainId === 10143) setDeployment(local); } catch { /* Ignore invalid browser cache. */ }
  }, []);
  function save(d: Deployment) { localStorage.setItem('living-vault-deployment', JSON.stringify(d)); setDeployment(d); queryClient.invalidateQueries(); }
  return <WagmiProvider config={config}><QueryClientProvider client={queryClient}><DeploymentContext.Provider value={{ deployment, save }}>{children}</DeploymentContext.Provider></QueryClientProvider></WagmiProvider>;
}
