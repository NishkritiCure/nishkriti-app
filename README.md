# Nishkriti — Clinical Health Platform

**निष्कृति** *(nish-kriti)* — Root cause extraction and reversal

A full-stack iOS/iPadOS health app for Dr. Nishit's clinical practice.  
Manages patient protocols, adaptive daily plans, and physician oversight.

---

## Quick Start

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your iPhone, or press `i` for the iOS simulator.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Expo SDK 51 / React Native 0.74 |
| Navigation | React Navigation v6 (Stack + Bottom Tabs) |
| State | Zustand |
| Fonts | Lora (display) · DM Sans (UI) · DM Mono (data) |
| Charts | react-native-svg |
| Animations | React Native Animated API |

---

## Project Structure

```
nishkriti/
├── App.tsx                      # Entry point — fonts, nav mount
├── src/
│   ├── theme/index.ts           # Colors, Typography, Spacing, Radii
│   ├── types/index.ts           # Full TypeScript interfaces
│   ├── utils/index.ts           # BMI, BMR, TDEE, macros, date helpers
│   │
│   ├── data/
│   │   ├── dietLibrary.ts       # 40+ Indian foods with grams + measures
│   │   └── exerciseLibrary.ts   # 25+ exercises, no barbells
│   │
│   ├── engine/
│   │   ├── adaptiveEngine.ts    # Plan generator — evaluates rules, builds meals
│   │   └── rules/
│   │       └── diabetesRules.ts # 14 rules, 4 phases, Nishkriti targets
│   │
│   ├── store/
│   │   └── useAppStore.ts       # Zustand store with demo data
│   │
│   ├── components/
│   │   ├── NishkritiLogo.tsx    # Animated N mark with ECG pulse
│   │   ├── MealCard.tsx         # Expandable — shows grams + measures
│   │   ├── ExerciseCard.tsx     # Sets/reps/tempo/form cues
│   │   ├── MetricCard.tsx       # Metric display
│   │   ├── PhaseCard.tsx        # Phase progress bar
│   │   ├── ReasoningBox.tsx     # "Why today is different" box
│   │   ├── NSlider.tsx          # Custom slider (no native deps)
│   │   ├── SectionCap.tsx       # Section header with line
│   │   └── Pill.tsx             # Status pill (teal/amber/rose/dim/em)
│   │
│   ├── navigation/
│   │   ├── RootNavigator.tsx    # Splash → Patient | Doctor
│   │   ├── PatientNavigator.tsx # Tab (Home/Plan/Progress/Supps/Notify) + Stack
│   │   └── DoctorNavigator.tsx  # Tab (Patients/Flags/Protocols/Analytics) + Stack
│   │
│   └── screens/
│       ├── SplashScreen.tsx               # Animated logo + mode selection
│       ├── patient/
│       │   ├── HomeScreen.tsx             # Dashboard with metrics + CTA
│       │   ├── CheckInScreen.tsx          # 5-step morning check-in
│       │   ├── DietPlanScreen.tsx         # Adaptive diet with quantities
│       │   ├── WorkoutScreen.tsx          # Exercise cards, tempo, walks
│       │   ├── ProgressScreen.tsx         # SVG charts, milestones
│       │   ├── SupplementsScreen.tsx      # Daily supplement tracker
│       │   ├── NotifyDoctorScreen.tsx     # Urgency + vitals auto-attach
│       │   └── WaitingScreen.tsx          # Onboarding waiting state
│       └── doctor/
│           ├── RosterScreen.tsx           # Patient list + flag cards
│           ├── PatientProfileScreen.tsx   # Biomarkers + rules fired + protocol
│           ├── ProtocolEditorScreen.tsx   # Edit diet type, thresholds, techniques
│           └── DashboardScreen.tsx        # Overview + patient table
```

---

## Clinical Protocol — Nishkriti Targets

| Biomarker | Nishkriti Target | Lab Normal |
|-----------|-----------------|------------|
| FBS | 70–100 mg/dL | 70–126 mg/dL |
| HbA1c reversal | < 5.7% | < 6.5% |
| TSH optimal | 0.5–2.0 mIU/L | 0.5–4.5 mIU/L |

**Diet philosophy:** Low carb as default → anti-inflammatory always → high protein non-negotiable → gut health/probiotics → calorie deficit as lever

**Workout rule (hard-coded):** No barbells. Machines + bodyweight + resistance bands. Tempo-based intensity (3–1–2). Post-meal walks mandatory.

### Adaptive Engine — Diabetes Rules

| Rule | Trigger | Action |
|------|---------|--------|
| DR001 | FBS 101–130 for 3 days | Watch, no change |
| DR002 | FBS 131–180 for 2 days | −20g carbs, no fruit, no carbs after 6:30pm |
| DR003 | FBS 181–250 | Strict low-carb, no carbs after 3pm, flag doctor |
| DR004 | FBS > 250 | Critical flag, suspend plan, doctor immediate |
| DR005 | FBS < 70 | +20g carbs, suspend exercise, critical flag |
| DR009 | Weight plateau 14 days | Introduce carb cycling or fat-only day |
| DR011 | Energy ≤ 2 for 3 days | +15g carbs, reduce workout intensity |

---

## Demo Data

The app loads with a fully populated demo patient (Rahul Mehta, T2 Diabetes, Day 31).  
The doctor view has 5 demo patients across conditions.

To add your own patient: edit `src/store/useAppStore.ts` → `DEMO_PATIENT`.

---

## Next Steps (Backend)

When ready for production, swap the Zustand mock store for:

- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (OTP via SMS for patients)
- **Storage:** Supabase Storage (progress photos)
- **Push notifications:** Expo Notifications
- **Schema:** See `supabase/` folder for migration files

---

## Brand

- **Primary:** Teal `#3EDBA5` · Forest `#0D1F1A`
- **Display font:** Lora Italic
- **Data font:** DM Mono
- **UI font:** DM Sans
- **Logo:** Animated N mark with ECG pulse (see `NishkritiLogo.tsx`)

---

*Nishkriti Clinical Platform · Confidential · 2026*

---

## Connecting to Supabase (Production)

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor
3. Copy your project URL and anon key
4. `cp .env.example .env` and fill in the values
5. Enable **Authentication → Email** (or SMS OTP for patients)
6. Enable **Storage** → create bucket `progress-photos` (public: false)

The schema includes:
- Row-level security so patients only see their own data
- Doctor can see all assigned patients
- Automatic progress sync trigger on each check-in
- Rolling 7-day FBS average view
- Full audit log for every plan generated

