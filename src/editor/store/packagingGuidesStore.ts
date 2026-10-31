import { create } from 'zustand'

export interface PackagingGuidesState {
  showCreases: boolean
  showBleed: boolean
  showSafeMargin: boolean
  showMockup3d: boolean
  toggleCreases: () => void
  toggleBleed: () => void
  toggleSafeMargin: () => void
  setShowMockup3d: (open: boolean) => void
}

export const usePackagingGuidesStore = create<PackagingGuidesState>((set) => ({
  showCreases: false,
  showBleed: false,
  showSafeMargin: false,
  showMockup3d: false,
  toggleCreases: () => set((s) => ({ showCreases: !s.showCreases })),
  toggleBleed: () => set((s) => ({ showBleed: !s.showBleed })),
  toggleSafeMargin: () => set((s) => ({ showSafeMargin: !s.showSafeMargin })),
  setShowMockup3d: (open: boolean) => set({ showMockup3d: open }),
}))
