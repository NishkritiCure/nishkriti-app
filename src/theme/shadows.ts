import type { ViewStyle } from 'react-native'

/**
 * Elevation tokens per APP-DESIGN-REFERENCE §5.2.
 *
 * iOS uses the shadowX props; Android uses `elevation`. Both are provided so
 * a single style block renders correctly on either platform.
 */
export const shadows = {
  none: {} satisfies ViewStyle,
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  } satisfies ViewStyle,
  phone: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 40 },
    shadowOpacity: 0.7,
    shadowRadius: 80,
    elevation: 24,
  } satisfies ViewStyle,
} as const

export type ShadowKey = keyof typeof shadows
