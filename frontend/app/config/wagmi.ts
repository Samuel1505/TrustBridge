import { cookieStorage, createStorage, http } from 'wagmi';
import { celoAlfajores } from 'wagmi/chains';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { QueryClient } from '@tanstack/react-query';

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'YOUR_PROJECT_ID';

if (!projectId) {
  throw new Error('Project ID is not defined');
}

export const queryClient = new QueryClient();

// Define Celo Alfajores testnet
const networks = [celoAlfajores];

// Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
  transports: {
    [celoAlfajores.id]: http(),
  },
});

export const config = wagmiAdapter.wagmiConfig;

// Create AppKit instance
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork: celoAlfajores,
  metadata: {
    name: 'TrustBridge',
    description: 'Verified Donations on Blockchain',
    url: 'https://trustbridge.app',
    icons: ['https://trustbridge.app/icon.png'],
  },
  features: {
    analytics: true,
  },
});