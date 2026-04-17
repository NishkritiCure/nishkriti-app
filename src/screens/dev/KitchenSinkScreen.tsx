/* eslint-disable react-native/no-raw-text */
import { useState } from 'react'
import { ScrollView, View } from 'react-native'

import {
  ApprovalQueueCard,
  Avatar,
  Badge,
  BannerAlert,
  BatchApproveSheet,
  Button,
  Card,
  ChartCard,
  Checkbox,
  CheckInStep,
  ConfirmSheet,
  Divider,
  DrillDownModal,
  ECGPulse,
  EmptyState,
  ErrorBoundary,
  ErrorState,
  ExerciseCard,
  FieldRow,
  HomeScreenSkeleton,
  IconButton,
  InfoSheet,
  Input,
  LoadingState,
  MealCard,
  MealSwapPicker,
  MessageBubble,
  MetricCard,
  NishkritiLogo,
  NSlider,
  OriginBadge,
  PatientProfileSkeleton,
  PatientRosterRow,
  PhaseCard,
  Pill,
  PlanScreenSkeleton,
  PriorityBadge,
  ProgressScreenSkeleton,
  ProgressTimelineRow,
  ReasoningBox,
  Screen,
  Section,
  SectionCap,
  Skeleton,
  SkeletonLines,
  Spacer,
  Stepper,
  StatusPill,
  SupplementRow,
  Switch,
  Tag,
  Text,
  ThemeToggle,
  Toast,
  ToastHost,
  useToast,
  WizardStepper,
} from '@/components'
import { createStyles, useTheme } from '@/theme'

const meal = {
  id: 'm1',
  name: 'Moong Dal Khichdi',
  macros: { calories: 410, carbs: 52, protein: 22, fat: 10, fiber: 8 },
  ingredients: [
    { name: 'Moong dal', quantity: '1/2 cup' },
    { name: 'Rice', quantity: '1/2 cup' },
  ],
  prepNote: 'Cook with cumin + ginger for 20 minutes.',
} as const

const exerciseItem = {
  id: 'e1',
  name: 'Zone 2 walk',
  cue: 'Nasal breathing, steady pace',
  setsReps: '1 × 30 min',
} as const

function ToastTrigger() {
  const { showToast } = useToast()
  return (
    <Button
      label="Fire toast"
      variant="secondary"
      onPress={() =>
        showToast({
          variant: 'success',
          title: 'Saved',
          description: 'Kitchen sink toast at your service.',
        })
      }
    />
  )
}

/**
 * Dev-only visual catalogue for every component in the Phase-C library.
 * Gated behind __DEV__ at the route level; never shipped in production
 * builds. Useful for:
 *   - Manual visual review during development
 *   - Automated snapshot baselines
 *   - Handoff review at phase merge
 */
export function KitchenSinkScreen() {
  const theme = useTheme()
  const styles = useStyles()
  const [checked, setChecked] = useState(false)
  const [switchOn, setSwitchOn] = useState(true)
  const [count, setCount] = useState(3)
  const [slider, setSlider] = useState(40)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [drillOpen, setDrillOpen] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)
  const [swapOpen, setSwapOpen] = useState(false)
  const [batchSelection, setBatchSelection] = useState<readonly string[]>(['a'])

  return (
    <ToastHost>
      <Screen scrollable>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text variant="displayS" color={theme.palette.ink}>
            Nishkriti Design System
          </Text>
          <Text variant="bodyM" color={theme.palette.ink2}>
            Dev-only component catalogue. Toggle the appearance to verify light and dark mode.
          </Text>
          <ThemeToggle />
          <Divider />

          <SectionCap label="Brand" />
          <View style={styles.row}>
            <NishkritiLogo size="sm" />
            <NishkritiLogo size="md" />
            <NishkritiLogo size="lg" />
            <NishkritiLogo size="xl" />
          </View>
          <ECGPulse />

          <SectionCap label="Primitives" />
          <Section title="Typography">
            <Text variant="displayL">Display L</Text>
            <Text variant="h1">Heading h1</Text>
            <Text variant="h2">Heading h2</Text>
            <Text variant="bodyM">Body copy lives here for reading comfort.</Text>
            <Text variant="labelM" color={theme.palette.teal} uppercase>
              Mono label
            </Text>
            <Text variant="caption" color={theme.palette.ink3}>
              Caption text for timestamps.
            </Text>
          </Section>
          <Section title="Buttons">
            <Button label="Primary" />
            <Button label="Secondary" variant="secondary" />
            <Button label="Ghost" variant="ghost" />
            <Button label="Danger" variant="danger" />
            <Button label="Loading" loading />
            <Button label="Disabled" disabled />
          </Section>
          <Section title="Avatars & IconButtons">
            <View style={styles.row}>
              <Avatar initials="AN" size="sm" />
              <Avatar initials="AK" size="md" />
              <Avatar initials="RS" size="lg" />
              <Avatar initials="PJ" size="xl" />
            </View>
            <View style={styles.row}>
              <IconButton icon={<Text>+</Text>} accessibilityLabel="Add" variant="ghost" />
              <IconButton icon={<Text>→</Text>} accessibilityLabel="Forward" variant="filled" />
              <IconButton icon={<Text>?</Text>} accessibilityLabel="Help" variant="tonal" />
            </View>
          </Section>
          <Section title="Badges & Tags">
            <View style={styles.row}>
              <Badge label="NEW" tone="teal" />
              <Badge label="HIGH" tone="rose" />
              <Badge label="INFO" tone="blue" />
              <PriorityBadge level="critical" />
              <PriorityBadge level="medium" />
              <OriginBadge origin="ai_agent" />
              <OriginBadge origin="rule_engine" />
              <OriginBadge origin="doctor_direct" />
            </View>
            <View style={styles.row}>
              <Tag label="Vegetarian" active />
              <Tag label="Gluten-free" />
              <Tag label="Spicy" onRemove={() => undefined} />
            </View>
          </Section>
          <Section title="Inputs">
            <Input label="Full name" placeholder="Anand K." />
            <Input label="Email" placeholder="name@example.com" helperText="Used for sign-in" />
            <Input label="Passcode" errorText="Must be 4 digits" />
            <Checkbox checked={checked} onChange={setChecked} label="I agree to the protocol" />
            <Switch
              value={switchOn}
              onValueChange={setSwitchOn}
              accessibilityLabel="Notifications"
            />
            <Stepper
              value={count}
              onChange={setCount}
              min={0}
              max={10}
              unit="servings"
              accessibilityLabel="Servings"
            />
          </Section>

          <SectionCap label="Molecules" />
          <Section title="Indicators">
            <View style={styles.row}>
              <Pill label="ON TARGET" tone="teal" />
              <Pill label="ADJUSTED" tone="amber" />
              <Pill label="FLAGGED" tone="rose" />
              <StatusPill level="ok" label="Good morning" />
              <StatusPill level="critical" label="Urgent" />
            </View>
          </Section>
          <Section title="FieldRow & MetricCard">
            <FieldRow label="Programme day" value="42" />
            <FieldRow label="Phase" value="Stabilise" />
            <View style={styles.row}>
              <MetricCard label="FBS" value={142} unit="mg/dL" delta="8" deltaPositive={false} />
              <MetricCard label="Weight" value={72.3} unit="kg" status="ok" />
            </View>
          </Section>
          <Section title="WizardStepper & NSlider">
            <WizardStepper
              currentStep={2}
              totalSteps={5}
              labels={['Basics', 'Vitals', 'Goals', 'Plan', 'Review']}
            />
            <NSlider
              min={0}
              max={100}
              value={slider}
              onValueChange={setSlider}
              unit="%"
              accessibilityLabel="Energy"
            />
          </Section>
          <Section title="Banners & toasts">
            <BannerAlert
              variant="warning"
              title="Heads up"
              description="Your plan will refresh after the next check-in."
              action={{ label: 'Retry', onPress: () => undefined }}
              onDismiss={() => undefined}
            />
            <ReasoningBox
              title="Why today is different"
              body="Sleep was low last night — we tapered the cardio load."
            />
            <ToastTrigger />
            <Toast
              variant="info"
              title="Standalone toast"
              description="Rendered without the host for a11y verification."
            />
          </Section>

          <SectionCap label="Layout" />
          <Card>
            <Text variant="h4">Card surface</Text>
            <Text variant="bodyS" color={theme.palette.ink2}>
              Cards compose with Section headers + Divider.
            </Text>
          </Card>
          <Card surface="card2">
            <Text variant="h4">Card surface 2</Text>
          </Card>
          <Card surface="card3">
            <Text variant="h4">Card surface 3</Text>
          </Card>
          <Spacer size={8} />
          <Divider />

          <SectionCap label="Feedback" />
          <Section title="Per-screen skeletons">
            <HomeScreenSkeleton />
            <PlanScreenSkeleton />
            <ProgressScreenSkeleton />
            <PatientProfileSkeleton />
            <Skeleton width="80%" height={24} />
            <SkeletonLines count={3} />
          </Section>
          <EmptyState
            title="Nothing to review"
            description="Your approval queue is empty for now."
            action={{ label: 'Refresh', onPress: () => undefined }}
          />
          <ErrorState
            title="Connection lost"
            description="Retry when you're back online."
            onRetry={() => undefined}
          />
          <LoadingState label="Fetching plan…" />
          <ErrorBoundary>
            <Card>
              <Text variant="bodyM">ErrorBoundary wraps this card — no crash here.</Text>
            </Card>
          </ErrorBoundary>

          <SectionCap label="Modals & sheets" />
          <View style={styles.row}>
            <Button label="Open Confirm" variant="secondary" onPress={() => setConfirmOpen(true)} />
            <Button label="Open Info" variant="secondary" onPress={() => setInfoOpen(true)} />
            <Button label="Open Drill" variant="secondary" onPress={() => setDrillOpen(true)} />
            <Button label="Open Batch" variant="secondary" onPress={() => setBatchOpen(true)} />
            <Button label="Open Swap" variant="secondary" onPress={() => setSwapOpen(true)} />
          </View>

          <SectionCap label="Composites" />
          <CheckInStep
            stepNumber={2}
            totalSteps={5}
            title="How's your energy?"
            subtitle="Be honest — this tunes today's plan."
            onBack={() => undefined}
            onNext={() => undefined}
          >
            <NSlider
              min={1}
              max={5}
              value={3}
              onValueChange={() => undefined}
              accessibilityLabel="Energy"
            />
          </CheckInStep>
          <MealCard slot="lunch" item={meal} />
          <ExerciseCard item={exerciseItem} done={false} onToggleDone={() => undefined} />
          <SupplementRow
            name="Metformin"
            dose="500mg"
            time="08:00"
            taken
            onToggle={() => undefined}
          />
          <PatientRosterRow
            avatarInitials="AS"
            name="Anu Shah"
            condition="Type 2 diabetes"
            daysInProgramme={42}
            statusPillLabel="On target"
            statusPillColor="teal"
            onPress={() => undefined}
          />
          <ApprovalQueueCard
            patient={{
              id: 'p1',
              name: 'Ravi K',
              condition: 'T2D',
              daysInProgramme: 28,
              avatarInitials: 'RK',
            }}
            todayVitals={{ fbs: 138, weight: 79 }}
            aiReasoningPreview="Morning FBS holding. Tapering carbs by 10g on dinner."
            generatedBy="rule_engine"
            fallbackBadge
            onPress={() => undefined}
          />
          <MessageBubble
            variant="received"
            body="Please log your morning FBS before breakfast."
            timestamp="8:02am"
          />
          <MessageBubble variant="sent" body="Done — 138 today." timestamp="8:12am" status="read" />
          <ProgressTimelineRow
            date="Apr 14"
            title="Phase 1 complete"
            description="Moved into Stabilise phase."
          />
          <ProgressTimelineRow
            date="Apr 16"
            title="First HIIT session"
            description="Kept HR under zone 4."
            isLast
          />
          <PhaseCard
            phaseName="Stabilise"
            phaseNumber={2}
            totalPhases={4}
            dayInPhase={6}
            totalDaysInPhase={30}
            description="Hold macros, add one Zone 2 walk."
          />
          <ChartCard title="FBS" summary="7-day avg 138 mg/dL">
            <Text variant="bodyS" color={theme.palette.ink2}>
              [Chart rendered by VictoryNative in the consuming screen]
            </Text>
          </ChartCard>
        </ScrollView>

        <ConfirmSheet
          visible={confirmOpen}
          title="Approve plan?"
          description="The patient will see it immediately."
          onConfirm={() => setConfirmOpen(false)}
          onCancel={() => setConfirmOpen(false)}
        />
        <InfoSheet
          visible={infoOpen}
          title="About Nishkriti"
          body="Dev-mode info sheet used for testing the sheet stack."
          onDismiss={() => setInfoOpen(false)}
        />
        <DrillDownModal
          visible={drillOpen}
          title="FBS history"
          onDismiss={() => setDrillOpen(false)}
        >
          <Text variant="bodyM">[Embedded chart or list goes here]</Text>
        </DrillDownModal>
        <BatchApproveSheet
          visible={batchOpen}
          items={[
            { id: 'a', label: 'Plan A — Ravi K' },
            { id: 'b', label: 'Plan B — Anu Shah' },
            { id: 'c', label: 'Plan C — Priya J' },
          ]}
          selectedIds={batchSelection}
          onToggle={(id) =>
            setBatchSelection((ids) =>
              ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
            )
          }
          onCancel={() => setBatchOpen(false)}
          onConfirm={() => setBatchOpen(false)}
        />
        <MealSwapPicker
          visible={swapOpen}
          options={[
            { id: '1', name: 'Rajma Chawal', calories: 420, subtitle: '35g protein' },
            { id: '2', name: 'Paneer Bowl', calories: 380, subtitle: '28g protein' },
          ]}
          currentId="1"
          onPick={() => setSwapOpen(false)}
          onCancel={() => setSwapOpen(false)}
        />
      </Screen>
    </ToastHost>
  )
}

const useStyles = createStyles((theme) => ({
  scroll: {
    padding: theme.spacing[16],
    gap: theme.spacing[16],
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[12],
    alignItems: 'center',
  },
}))
