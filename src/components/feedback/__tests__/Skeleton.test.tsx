// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { Skeleton, SkeletonLines } from '../Skeleton'

describe('Skeleton', () => {
  it('renders with default dimensions', () => {
    renderWithTheme(<Skeleton />)
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeTruthy()
  })

  it('accepts width and height props', () => {
    renderWithTheme(<Skeleton width={200} height={32} />)
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0)
  })

  it('accepts a custom accessibility label', () => {
    renderWithTheme(<Skeleton accessibilityLabel="Loading plan" />)
    expect(screen.getByRole('progressbar', { name: 'Loading plan' })).toBeTruthy()
  })

  it('SkeletonLines renders the requested number of rows', () => {
    renderWithTheme(<SkeletonLines count={3} testID="lines" />)
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThanOrEqual(3)
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(<Skeleton width={120} height={20} />)
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
