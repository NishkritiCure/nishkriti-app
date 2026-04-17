// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderBothThemes, renderWithTheme } from '@/components/__tests__/testUtils'

import { WizardStepper } from '../WizardStepper'

describe('WizardStepper', () => {
  it('renders with step counts', () => {
    renderWithTheme(<WizardStepper currentStep={2} totalSteps={5} />)
    expect(screen.getByText('1')).toBeTruthy()
    expect(screen.getByText('5')).toBeTruthy()
  })

  it('announces step progress accessibly', () => {
    renderWithTheme(<WizardStepper currentStep={2} totalSteps={4} labels={['A', 'B', 'C', 'D']} />)
    expect(screen.getByLabelText('Step 2 of 4: B')).toBeTruthy()
  })

  it('clamps out-of-range currentStep', () => {
    renderWithTheme(<WizardStepper currentStep={99} totalSteps={3} />)
    expect(screen.getByLabelText(/Step 3 of 3/)).toBeTruthy()
  })

  it('matches light + dark snapshots', () => {
    const { light, dark } = renderBothThemes(<WizardStepper currentStep={1} totalSteps={3} />)
    expect(light.container.firstChild).toMatchSnapshot('light')
    expect(dark.container.firstChild).toMatchSnapshot('dark')
  })
})
