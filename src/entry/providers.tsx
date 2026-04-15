import { QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { queryClient } from '@/queries/queryClient'
import { ThemeProvider } from '@/theme/ThemeContext'

function ErrorFallback(_props: FallbackProps): null {
  // Real fallback UI is built in phase-c (design system).
  return null
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ErrorBoundary FallbackComponent={ErrorFallback}>{children}</ErrorBoundary>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
