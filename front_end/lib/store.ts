import { create } from 'zustand'
import type { User, TenantConfig } from './types'

interface AuthState {
  user: User | null
  config: TenantConfig | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setConfig: (config: TenantConfig | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  config: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setConfig: (config) => set({ config }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, config: null, isAuthenticated: false }),
}))

// Sync state for notes management
interface NotesState {
  selectedNotes: Set<string>
  isSyncing: boolean
  syncError: string | null
  syncCooldown: number | null
  toggleNote: (chave: string) => void
  selectAll: (chaves: string[]) => void
  clearSelection: () => void
  setSyncing: (syncing: boolean) => void
  setSyncError: (error: string | null) => void
  setSyncCooldown: (seconds: number | null) => void
}

export const useNotesStore = create<NotesState>((set) => ({
  selectedNotes: new Set(),
  isSyncing: false,
  syncError: null,
  syncCooldown: null,
  toggleNote: (chave) =>
    set((state) => {
      const newSet = new Set(state.selectedNotes)
      if (newSet.has(chave)) {
        newSet.delete(chave)
      } else {
        newSet.add(chave)
      }
      return { selectedNotes: newSet }
    }),
  selectAll: (chaves) => set({ selectedNotes: new Set(chaves) }),
  clearSelection: () => set({ selectedNotes: new Set() }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setSyncError: (syncError) => set({ syncError }),
  setSyncCooldown: (syncCooldown) => set({ syncCooldown }),
}))
