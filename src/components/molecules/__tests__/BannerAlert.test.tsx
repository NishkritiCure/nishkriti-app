// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { BannerAlert } from '../BannerAlert'

describe('BannerAlert', () => {
  it('renders title and description', () => {
    renderWithTheme(<BannerAlert variant="info" title="Heads up" description="Sync in progress" />)
    expect(screen.getByText('Heads up')).toBeTruthy()
    expect(screen.getByText('Sync in progress')).toBeTruthy()
  })

  it('invokes the action callback', () => {
    const onPress = vi.fn()
    renderWithTheme(
      <BannerAlert variant="warning" title="Retry" action={{ label: 'Retry', onPress }} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onPress).toHaveBeenCalled()
  })

  it('invokes onDismiss when the × is pressed', () => {
    const onDismiss = vi.fn()
    renderWithTheme(<BannerAlert variant="error" title="Oops" onDismiss={onDismiss} testID="b" />)
    fireEvent.click(screen.getByLabelText('Dismiss Oops'))
    expect(onDismiss).toHaveBeenCalled()
  })

  it('matches light + dark snapshots per variant', () => {
    const { light, dark } = renderBothThemes(
      <BannerAlert variant="success" title="Snap" description="snap" />
    )
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
