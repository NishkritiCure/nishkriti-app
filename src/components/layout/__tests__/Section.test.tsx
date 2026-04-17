// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'
import { Text } from '@/components/primitives'

import { Section } from '../Section'

describe('Section', () => {
  it('renders title and children', () => {
    renderWithTheme(
      <Section title="Today">
        <Text>Body</Text>
      </Section>
    )
    expect(screen.getByText('Today')).toBeTruthy()
    expect(screen.getByText('Body')).toBeTruthy()
  })

  it('renders subtitle when provided', () => {
    renderWithTheme(
      <Section title="Plan" subtitle="As of 9am">
        <Text>Body</Text>
      </Section>
    )
    expect(screen.getByText('As of 9am')).toBeTruthy()
  })

  it('mounts the action slot', () => {
    renderWithTheme(
      <Section title="Plan" action={<Text>See all</Text>}>
        <Text>Body</Text>
      </Section>
    )
    expect(screen.getByText('See all')).toBeTruthy()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(
      <Section title="Snap">
        <Text>body</Text>
      </Section>
    )
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
