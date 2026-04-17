import { Badge, type BadgeTone } from './Badge'

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info'

const TONE_MAP: Record<PriorityLevel, BadgeTone> = {
  critical: 'rose',
  high: 'amber',
  medium: 'blue',
  low: 'teal',
  info: 'neutral',
}

const LABEL_MAP: Record<PriorityLevel, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
}

export interface PriorityBadgeProps {
  readonly level: PriorityLevel
  readonly label?: string
  readonly accessibilityLabel?: string
  readonly testID?: string
}

export function PriorityBadge({ level, label, accessibilityLabel, testID }: PriorityBadgeProps) {
  const resolvedLabel = label ?? LABEL_MAP[level]
  return (
    <Badge
      label={resolvedLabel}
      tone={TONE_MAP[level]}
      accessibilityLabel={accessibilityLabel ?? `Priority: ${resolvedLabel}`}
      testID={testID}
    />
  )
}
