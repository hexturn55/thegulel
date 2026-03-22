import { create } from 'zustand';

interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  priceUSD: number;
  priceINR: number;
  popular: boolean;
}

interface CoinState {
  packages: CoinPackage[];
  selectedPackage: CoinPackage | null;
  setPackages: (packages: CoinPackage[]) => void;
  selectPackage: (pkg: CoinPackage | null) => void;
}

export const useCoinStore = create<CoinState>((set) => ({
  packages: [],
  selectedPackage: null,
  setPackages: (packages) => set({ packages }),
  selectPackage: (pkg) => set({ selectedPackage: pkg }),
}));
