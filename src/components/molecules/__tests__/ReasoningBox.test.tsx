// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { ReasoningBox } from '../ReasoningBox'

describe('ReasoningBox', () => {
  it('renders title and body', () => {
    renderWithTheme(
      <ReasoningBox title="Why today is different" body="Sleep was low last night." />
    )
    expect(screen.getByText('Why today is different')).toBeTruthy()
    expect(screen.getByText(/Sleep was low/)).toBeTruthy()
  })

  it('renders every accent without crashing', () => {
    const accents = ['teal', 'amber', 'rose', 'blue'] as const
    for (const accent of accents) {
      const { unmount } = renderWithTheme(<ReasoningBox body={`body-${accent}`} accent={accent} />)
      expect(screen.getByText(`body-${accent}`)).toBeTruthy()
      unmount()
    }
  })

  it('composes body into the accessibility label when no title', () => {
    renderWithTheme(<ReasoningBox body="bare" />)
    expect(screen.getByLabelText('bare')).toBeTruthy()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(
      <ReasoningBox title="Snap" body="body" accent="teal" />
    )
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
