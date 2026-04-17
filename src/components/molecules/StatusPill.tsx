import { Pill, type PillTone } from './Pill'

export type StatusLevel = 'ok' | 'warn' | 'alert' | 'critical' | 'info'

const TONE_MAP: Record<StatusLevel, PillTone> = {
  ok: 'teal',
  warn: 'amber',
  alert: 'amber',
  critical: 'rose',
  info: 'blue',
}

export interface StatusPillProps {
  readonly level: StatusLevel
  readonly label: string
  readonly accessibilityLabel?: string
  readonly testID?: string
}

/**
 * Semantic wrapper around `Pill` that maps a status `level` to the
 * appropriate tone. Use for "On target" / "Alert" / "Critical" indicators
 * where colour carries meaning — the accessibility label must still name
 * the meaning explicitly so VoiceOver users understand.
 */
export function StatusPill({ level, label, accessibilityLabel, testID }: StatusPillProps) {
  return (
    <Pill
      label={label}
      tone={TONE_MAP[level]}
      accessibilityLabel={accessibilityLabel ?? `${label} (${level})`}
      testID={testID}
    />
  )
}
