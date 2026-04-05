import { create } from "zustand";

export interface Package {
  _id?: string;
  id?: string;
  name: string;
  code?: string;
  category?: string;
  shortDescription?: string;
  fullDescription?: string;
  image?: string;
  brochure?: string;
  price?: {
    original?: number;
    offer?: number;
    discount?: number;
    gst?: number;
    final?: number;
  };
  tests?: {
    category: string;
    tests: string[];
  }[];
  testCount?: number;
  ageRange?: {
    min: number;
    max: number;
  };
  gender?: string;
  recommendedFor?: string[];
  details?: {
    whoShouldBook?: string;
    preparation?: string;
    howItWorks?: {
      title: string;
      description: string;
    }[];
  };
  instructions?: {
    before?: string;
    collection?: string;
    after?: string;
  };
  lab?: {
    _id?: string;
    name: string;
    logo?: string;
    address?: string;
  };
  status?: string;
}

interface PackageStore {
  packages: Package[];
  selectedPackage: Package | null;
  setPackages: (packages: Package[]) => void;
  selectPackage: (pkg: Package) => void;
  addPackage: (pkg: Package) => void;
  updatePackage: (id: string, pkg: Partial<Package>) => void;
  removePackage: (id: string) => void;
}

export const usePackageStore = create<PackageStore>((set) => ({
  packages: [],
  selectedPackage: null,
  setPackages: (packages) => set({ packages }),
  selectPackage: (pkg) => set({ selectedPackage: pkg }),
  addPackage: (pkg) => set((state) => ({ packages: [...state.packages, pkg] })),
  updatePackage: (id, pkg) =>
    set((state) => ({
      packages: state.packages.map((p) =>
        (p._id || p.id) === id ? { ...p, ...pkg } : p,
      ),
    })),
  removePackage: (id) =>
    set((state) => ({
      packages: state.packages.filter((p) => (p._id || p.id) !== id),
    })),
}));
