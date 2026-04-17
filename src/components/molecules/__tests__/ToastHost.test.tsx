// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithTheme } from '@/components/__tests__/testUtils'
import { Button } from '@/components/primitives'

import { ToastHost, useToast } from '../ToastHost'

function Trigger() {
  const { showToast } = useToast()
  return <Button label="Fire" onPress={() => showToast({ variant: 'success', title: 'Hello' })} />
}

describe('ToastHost', () => {
  it('renders a toast when showToast is called', () => {
    renderWithTheme(
      <ToastHost>
        <Trigger />
      </ToastHost>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Fire' }))
    expect(screen.getByText('Hello')).toBeTruthy()
  })

  it('mounts the host container', () => {
    renderWithTheme(
      <ToastHost>
        <Trigger />
      </ToastHost>
    )
    expect(screen.getAllByTestId('toast-host').length).toBeGreaterThan(0)
  })

  it('throws a helpful error outside the provider', () => {
    function Rogue() {
      useToast()
      return null
    }
    // Suppress React error output for this negative test.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {
      /* noop */
    })
    expect(() => renderWithTheme(<Rogue />)).toThrow(/ToastHost/)
    spy.mockRestore()
  })

  it('supports multiple enqueued toasts', () => {
    function MultiTrigger() {
      const { showToast } = useToast()
      return (
        <Button
          label="Fire both"
          onPress={() => {
            showToast({ variant: 'info', title: 'Alpha' })
            showToast({ variant: 'info', title: 'Beta' })
          }}
        />
      )
    }
    renderWithTheme(
      <ToastHost>
        <MultiTrigger />
      </ToastHost>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Fire both' }))
    expect(screen.getByText('Alpha')).toBeTruthy()
    expect(screen.getByText('Beta')).toBeTruthy()
  })
})

import { vi } from 'vitest'
