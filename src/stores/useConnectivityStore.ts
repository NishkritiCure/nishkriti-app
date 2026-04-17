import { create } from 'zustand'

type Mode = 'full' | 'engine-only' | 'offline'

interface ConnectivityState {
  mode: Mode
  lastHealthCheckAt: number | null
  setMode: (mode: Mode) => void
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  mode: 'full',
  lastHealthCheckAt: null,
  setMode: (mode) => set({ mode }),
}))
