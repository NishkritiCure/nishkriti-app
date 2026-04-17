// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithTheme } from '@/components/__tests__/testUtils'

import { InfoSheet } from '../InfoSheet'

describe('InfoSheet', () => {
  it('renders title and body', () => {
    renderWithTheme(<InfoSheet visible title="About" body="Hi" onDismiss={vi.fn()} />)
    expect(screen.getByText('About')).toBeTruthy()
    expect(screen.getByText('Hi')).toBeTruthy()
  })

  it('invokes onDismiss via button', () => {
    const onDismiss = vi.fn()
    renderWithTheme(<InfoSheet visible title="?" body="body" onDismiss={onDismiss} />)
    const buttons = screen.getAllByRole('button', { name: 'Got it' })
    fireEvent.click(buttons[buttons.length - 1]!)
    expect(onDismiss).toHaveBeenCalled()
  })

  it('hides when visible=false', () => {
    renderWithTheme(<InfoSheet visible={false} title="Hidden" body="Gone" onDismiss={vi.fn()} />)
    expect(screen.queryByText('Hidden')).toBeNull()
  })

  it('matches snapshot', () => {
    const { container } = renderWithTheme(
      <InfoSheet visible title="Snap" body="snap" onDismiss={vi.fn()} />
    )
    expect(container.firstChild).toMatchSnapshot()
  })
})
