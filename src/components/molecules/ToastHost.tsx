import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { View } from 'react-native'

import { createStyles } from '@/theme'

import { Toast, type ToastProps, type ToastVariant } from './Toast'

export interface ShowToastOptions {
  readonly variant: ToastVariant
  readonly title: string
  readonly description?: string
  readonly duration?: number
  readonly action?: ToastProps['action']
}

interface ToastContextValue {
  readonly showToast: (options: ShowToastOptions) => void
  readonly dismissAll: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

interface EnqueuedToast extends ShowToastOptions {
  readonly id: string
}

/**
 * Provider + host. Mount once near the root; any descendant can call
 * `useToast().showToast(...)` to enqueue a toast that renders in the
 * bottom-anchored stack. Toasts auto-dismiss after their duration.
 */
export function ToastHost({ children }: { readonly children: ReactNode }) {
  const [queue, setQueue] = useState<readonly EnqueuedToast[]>([])
  const styles = useStyles()

  const showToast = useCallback((options: ShowToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setQueue((q) => [...q, { ...options, id }])
  }, [])

  const dismissAll = useCallback(() => {
    setQueue([])
  }, [])

  const dismissById = useCallback((id: string) => {
    setQueue((q) => q.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, dismissAll }}>
      {children}
      <View pointerEvents="box-none" style={styles.host} testID="toast-host">
        {queue.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            title={t.title}
            {...(t.description !== undefined ? { description: t.description } : {})}
            {...(t.duration !== undefined ? { duration: t.duration } : {})}
            {...(t.action !== undefined ? { action: t.action } : {})}
            onDismiss={() => dismissById(t.id)}
            testID={`toast-${t.id}`}
          />
        ))}
      </View>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastHost')
  return ctx
}

const useStyles = createStyles((theme) => ({
  host: {
    position: 'absolute',
    left: theme.spacing[16],
    right: theme.spacing[16],
    bottom: theme.spacing[32],
    gap: theme.spacing[8],
  },
}))
