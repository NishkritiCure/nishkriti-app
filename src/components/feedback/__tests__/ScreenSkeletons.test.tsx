// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithTheme } from '@/components/__tests__/testUtils'

import {
  ApprovalQueueSkeleton,
  HomeScreenSkeleton,
  PatientProfileSkeleton,
  PlanScreenSkeleton,
  ProgressScreenSkeleton,
  StatsScreenSkeleton,
} from '../ScreenSkeletons'

describe('Screen skeletons', () => {
  it('HomeScreenSkeleton renders', () => {
    renderWithTheme(<HomeScreenSkeleton testID="h" />)
    expect(screen.getAllByLabelText('Loading home').length).toBeGreaterThan(0)
  })

  it('PlanScreenSkeleton renders', () => {
    renderWithTheme(<PlanScreenSkeleton testID="p" />)
    expect(screen.getAllByLabelText('Loading plan').length).toBeGreaterThan(0)
  })

  it('ProgressScreenSkeleton renders', () => {
    renderWithTheme(<ProgressScreenSkeleton testID="pr" />)
    expect(screen.getAllByLabelText('Loading progress').length).toBeGreaterThan(0)
  })

  it('ApprovalQueueSkeleton renders', () => {
    renderWithTheme(<ApprovalQueueSkeleton testID="aq" />)
    expect(screen.getAllByLabelText('Loading approvals').length).toBeGreaterThan(0)
  })

  it('PatientProfileSkeleton renders', () => {
    renderWithTheme(<PatientProfileSkeleton testID="pp" />)
    expect(screen.getAllByLabelText('Loading patient profile').length).toBeGreaterThan(0)
  })

  it('StatsScreenSkeleton renders', () => {
    renderWithTheme(<StatsScreenSkeleton testID="ss" />)
    expect(screen.getAllByLabelText('Loading stats').length).toBeGreaterThan(0)
  })
})
