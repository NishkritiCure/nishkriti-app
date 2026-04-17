import * as SecureStore from 'expo-secure-store'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type AuthStatus = 'bootstrapping' | 'unauthenticated' | 'authenticated'

interface AuthState {
  status: AuthStatus
  userId: string | null
  role: 'patient' | 'doctor' | null
  forcePasswordReset: boolean
  setBootstrapping: () => void
  setSession: (userId: string, role: 'patient' | 'doctor', force: boolean) => void
  clearSession: () => void
}

const secureStorage = {
  getItem: (name: string) => SecureStore.getItemAsync(name),
  setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      status: 'bootstrapping',
      userId: null,
      role: null,
      forcePasswordReset: false,
      setBootstrapping: () => set({ status: 'bootstrapping' }),
      setSession: (userId, role, force) =>
        set({
          status: 'authenticated',
          userId,
          role,
          forcePasswordReset: force,
        }),
      clearSession: () =>
        set({
          status: 'unauthenticated',
          userId: null,
          role: null,
          forcePasswordReset: false,
        }),
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        userId: state.userId,
        role: state.role,
      }),
    }
  )
)
