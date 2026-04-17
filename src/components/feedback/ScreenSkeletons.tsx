import { View } from 'react-native'

import { createStyles } from '@/theme'

import { Skeleton, SkeletonLines } from './Skeleton'

/**
 * Per-screen skeleton compositions listed in EB-C §4.2. Each one mimics
 * the layout of the real screen while it loads so the page doesn't jump
 * when data arrives.
 */

export function HomeScreenSkeleton({ testID }: { testID?: string }) {
  const styles = useStyles()
  return (
    <View style={styles.page} testID={testID} accessibilityLabel="Loading home">
      <Skeleton width={180} height={30} />
      <View style={styles.row}>
        <Skeleton width={120} height={80} radius={18} />
        <Skeleton width={120} height={80} radius={18} />
      </View>
      <SkeletonLines count={4} />
    </View>
  )
}

export function PlanScreenSkeleton({ testID }: { testID?: string }) {
  const styles = useStyles()
  return (
    <View style={styles.page} testID={testID} accessibilityLabel="Loading plan">
      <Skeleton width={220} height={32} />
      <Skeleton height={120} radius={18} />
      <Skeleton height={120} radius={18} />
      <Skeleton height={120} radius={18} />
    </View>
  )
}

export function ProgressScreenSkeleton({ testID }: { testID?: string }) {
  const styles = useStyles()
  return (
    <View style={styles.page} testID={testID} accessibilityLabel="Loading progress">
      <Skeleton width={180} height={30} />
      <Skeleton height={200} radius={18} />
      <View style={styles.row}>
        <Skeleton width={100} height={60} radius={12} />
        <Skeleton width={100} height={60} radius={12} />
        <Skeleton width={100} height={60} radius={12} />
      </View>
    </View>
  )
}

export function ApprovalQueueSkeleton({ testID }: { testID?: string }) {
  const styles = useStyles()
  return (
    <View style={styles.page} testID={testID} accessibilityLabel="Loading approvals">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} height={100} radius={18} />
      ))}
    </View>
  )
}

export function PatientProfileSkeleton({ testID }: { testID?: string }) {
  const styles = useStyles()
  return (
    <View style={styles.page} testID={testID} accessibilityLabel="Loading patient profile">
      <View style={styles.row}>
        <Skeleton width={64} height={64} radius={32} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton height={22} width="60%" />
          <Skeleton height={16} width="40%" />
        </View>
      </View>
      <Skeleton height={180} radius={18} />
      <SkeletonLines count={5} />
    </View>
  )
}

export function StatsScreenSkeleton({ testID }: { testID?: string }) {
  const styles = useStyles()
  return (
    <View style={styles.page} testID={testID} accessibilityLabel="Loading stats">
      <View style={styles.row}>
        <Skeleton width={110} height={70} radius={12} />
        <Skeleton width={110} height={70} radius={12} />
        <Skeleton width={110} height={70} radius={12} />
      </View>
      <Skeleton height={240} radius={18} />
      <SkeletonLines count={3} />
    </View>
  )
}

const useStyles = createStyles((theme) => ({
  page: {
    padding: theme.spacing[16],
    gap: theme.spacing[16],
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing[12],
    flexWrap: 'wrap',
  },
}))
