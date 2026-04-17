import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'

/**
 * Tracks the user's "Reduce Motion" accessibility preference.
 *
 * Components use this to collapse continuous animations (logo pulse, ECG line,
 * shimmer, sheet entrance easings) into static or fade-only variants when the
 * user has signalled they cannot tolerate motion. Honouring this is an
 * accessibility exit criterion for Phase C — not optional.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    let mounted = true
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduced(enabled)
      })
      .catch(() => {
        // Some test environments don't implement the check — treat as off.
      })

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced)
    return () => {
      mounted = false
      sub.remove()
    }
  }, [])

  return reduced
}
