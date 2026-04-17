// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { Toast } from '../Toast'

describe('Toast', () => {
  it('renders title and description', () => {
    renderWithTheme(<Toast variant="success" title="Saved" description="All good" />)
    expect(screen.getByText('Saved')).toBeTruthy()
    expect(screen.getByText('All good')).toBeTruthy()
  })

  it('invokes the action callback', () => {
    const onPress = vi.fn()
    renderWithTheme(<Toast variant="info" title="Update" action={{ label: 'Retry', onPress }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onPress).toHaveBeenCalled()
  })

  it('announces as polite live region for screen readers', () => {
    renderWithTheme(<Toast variant="error" title="Broken" />)
    expect(screen.getByRole('alert', { name: /error/i })).toBeTruthy()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(<Toast variant="warning" title="Snap" />)
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
