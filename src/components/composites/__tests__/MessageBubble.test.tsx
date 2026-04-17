// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { MessageBubble } from '../MessageBubble'

describe('MessageBubble', () => {
  it('renders body, timestamp, and status', () => {
    renderWithTheme(
      <MessageBubble variant="sent" body="Hi there" timestamp="9:12am" status="read" />
    )
    expect(screen.getByText('Hi there')).toBeTruthy()
    expect(screen.getByText('9:12am')).toBeTruthy()
    expect(screen.getByText('read')).toBeTruthy()
  })

  it('composes a11y label with direction', () => {
    renderWithTheme(<MessageBubble variant="received" body="yo" timestamp="10:00" />)
    expect(screen.getAllByLabelText(/Received: yo/).length).toBeGreaterThan(0)
  })

  it('matches sent + received snapshots', () => {
    const { light: sent, dark: received } = renderBothThemes(
      <MessageBubble variant="sent" body="Snap" timestamp="now" />
    )
    expect(sent.container.firstChild).toMatchSnapshot('sent-light')
    expect(received.container.firstChild).toMatchSnapshot('sent-dark')
  })

  it('matches received snapshot', () => {
    const { light, dark } = renderBothThemes(
      <MessageBubble variant="received" body="hello" timestamp="now" />
    )
    expect(light.container.firstChild).toMatchSnapshot('received-light')
    expect(dark.container.firstChild).toMatchSnapshot('received-dark')
  })
})
