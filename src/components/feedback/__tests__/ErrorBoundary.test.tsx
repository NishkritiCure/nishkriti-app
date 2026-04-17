// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithTheme } from '@/components/__tests__/testUtils'
import { Text } from '@/components/primitives'

import { ErrorBoundary } from '../ErrorBoundary'

function Boom(): React.ReactElement {
  throw new Error('kaboom')
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    renderWithTheme(
      <ErrorBoundary>
        <Text>Healthy</Text>
      </ErrorBoundary>
    )
    expect(screen.getByText('Healthy')).toBeTruthy()
  })

  it('shows the default ErrorState on render error', () => {
    // Suppress expected React error log.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {
      /* noop */
    })
    renderWithTheme(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.getByText(/Something went wrong/i)).toBeTruthy()
    spy.mockRestore()
  })

  it('invokes onError when a child throws', () => {
    const onError = vi.fn()
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {
      /* noop */
    })
    renderWithTheme(
      <ErrorBoundary onError={onError}>
        <Boom />
      </ErrorBoundary>
    )
    expect(onError).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('renders the custom fallback when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {
      /* noop */
    })
    renderWithTheme(
      <ErrorBoundary
        fallback={(error, reset) => <Text onPress={reset}>{`caught: ${error.message}`}</Text>}
      >
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.getByText('caught: kaboom')).toBeTruthy()
    spy.mockRestore()
  })

  it('resets via the fallback callback', () => {
    let throwOnNextRender = true
    function Recoverable(): React.ReactElement {
      if (throwOnNextRender) throw new Error('once')
      return <Text>recovered</Text>
    }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {
      /* noop */
    })
    renderWithTheme(
      <ErrorBoundary
        fallback={(_, reset) => (
          <Text
            accessibilityRole="button"
            accessibilityLabel="retry"
            onPress={() => {
              throwOnNextRender = false
              reset()
            }}
          >
            retry
          </Text>
        )}
      >
        <Recoverable />
      </ErrorBoundary>
    )
    fireEvent.click(screen.getByLabelText('retry'))
    expect(screen.getByText('recovered')).toBeTruthy()
    spy.mockRestore()
  })
})
