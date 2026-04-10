# Nishkriti App — Manual Testing Checklist

**Last updated**: 2026-04-11
**Platform**: iPad (Expo Go / Dev Client)
**Backend**: Supabase (zuibhdugulquupjuvxaq)

---

## Prerequisites

Before testing, ensure:
- [ ] `.env` has `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Metro bundler is running (`npx expo start`)
- [ ] iPad simulator or physical iPad is connected
- [ ] At least one doctor account exists in `doctors` table
- [ ] You know the doctor email + password

---

## PHASE 1: App Launch & Auth

### T1.1 — Cold Launch
1. Kill the app completely
2. Reopen the app
3. **Expected**: Brief loading spinner (max 10 seconds), then Splash screen
4. **FAIL if**: Black screen, "Connecting..." stuck forever, crash

### T1.2 — Splash Screen
1. Observe the Splash screen
2. **Expected**: Nishkriti logo animates in, pulsing rings, two buttons visible
3. Verify: "I'm a patient" button (teal) and "I'm a doctor" button (outlined)
4. **FAIL if**: Buttons missing, logo doesn't appear, screen is blank

### T1.3 — Doctor Login
1. Tap "I'm a doctor"
2. **Expected**: DoctorLoginScreen with email + password fields
3. Enter valid doctor email + password
4. Tap "Sign In"
5. **Expected**: Brief loading, then Doctor tabs appear (Roster tab active)
6. **FAIL if**: Login hangs, error with valid credentials, stays on login screen

### T1.4 — Doctor Login — Invalid Credentials
1. From Splash, tap "I'm a doctor"
2. Enter wrong email or password
3. Tap "Sign In"
4. **Expected**: Alert with error message (e.g., "Invalid login credentials")
5. **FAIL if**: Crash, silent failure, no error shown

### T1.5 — Doctor Login — Empty Fields
1. From DoctorLoginScreen, tap "Sign In" with empty fields
2. **Expected**: Alert "Please enter your email and password"
3. **FAIL if**: Crash or silent failure

### T1.6 — Doctor Logout
1. While logged in as doctor, go to Roster tab
2. Tap "Sign Out" button (red text, top right)
3. Tap "Sign Out" in the confirmation alert
4. **Expected**: Returns to Splash screen
5. **FAIL if**: Stays on doctor screen, crash

---

## PHASE 2: Doctor — Create Patient

### T2.1 — Navigate to Create Patient
1. On Roster tab, tap the "+" FAB (bottom right)
2. **Expected**: CreatePatientScreen with "New Patient" header
3. **FAIL if**: FAB doesn't respond, wrong screen opens

### T2.2 — Fill Required Fields Only
1. Enter: Name = "Test Patient One"
2. Tap date field, select DOB = 1 Jan 1990, tap Confirm
3. Leave sex as Male (default)
4. Leave height/weight empty
5. Select condition: Diabetes T2
6. Enter Baseline FBS: 180
7. Tap "Create Patient"
8. **Expected**: Loading spinner, then Alert showing UHID (NK-XXXX) and password
9. **Write down the UHID and password** — you'll need them for patient login
10. **FAIL if**: Crash, error alert, no UHID generated

### T2.3 — Verify Alert Options
1. After patient creation Alert appears
2. Verify two buttons: "Back to Roster" and "Create Plan"
3. Tap "Back to Roster"
4. **Expected**: Returns to Roster, new patient visible in list
5. **FAIL if**: Patient not in list, navigation broken

### T2.4 — Create Patient with All Fields
1. Tap FAB again
2. Fill ALL fields: name, DOB, sex=Female, height=165cm, weight=72kg
3. Condition: PCOS
4. Diet: Vegetarian
5. FBS: 95, HbA1c: 5.8
6. Waist: 82cm, Hip: 96cm
7. Tap "Create Patient"
8. **Expected**: Success with UHID + password
9. Tap "Create Plan"
10. **Expected**: Navigate to TreatmentPlanEditorScreen for this patient

### T2.5 — Validation — Missing Required Fields
1. Tap FAB, leave name empty, tap "Create Patient"
2. **Expected**: Alert "Please enter the patient name"
3. Fill name, leave DOB empty, tap "Create Patient"
4. **Expected**: Alert "Please select date of birth"
5. Fill DOB, leave FBS empty, tap "Create Patient"
6. **Expected**: Alert "Please enter baseline FBS"

### T2.6 — Long-press Patient for Credentials
1. On Roster, long-press any patient row
2. **Expected**: Alert showing UHID and password
3. **FAIL if**: No response, crash

---

## PHASE 3: Doctor — Treatment Plan Editor

### T3.1 — Create New Plan
1. From Roster, tap a patient who has no plan
2. On PatientProfileScreen, tap "Create treatment plan"
3. **Expected**: TreatmentPlanEditorScreen with "Create Plan" header, "New" pill
4. Verify: Patient header shows correct name, condition, BMI
5. Verify: Auto-calculated BMR/TDEE banner shows values

### T3.2 — Diet Type Multi-Select
1. In Diet Type section, tap "Low Carb" — should be selected (highlighted)
2. Tap "Keto" — BOTH should now be selected
3. Tap "Low Carb" again — should deselect, only "Keto" remains
4. **Expected**: Multiple diet types can be selected simultaneously
5. **FAIL if**: Only one can be selected at a time, crash on multi-select

### T3.3 — Macro Steppers
1. Set Calories to 0 using the "-" button
2. **Expected**: Value shows 0, no NaN or negative
3. Clear the calorie text field (delete all digits)
4. **Expected**: Value becomes 0, not NaN
5. Set Carbs to 0, Protein to 0, Fat to 0
6. **Expected**: "From macros: 0 cal" shown, no NaN

### T3.4 — Exercise Frequency (Structured)
1. Scroll to Exercise section
2. Verify 3 steppers: "per day", "per week", "per month"
3. Set: 0 per day, 5 per week, 0 per month
4. **Expected**: Summary text below shows "5x/week"
5. Set: 1 per day, 3 per week, 0 per month
6. **Expected**: Summary shows "1x/day, 3x/week"

### T3.5 — Phase Presets
1. Scroll to Phases section
2. In Phase 1, find "DIET FOCUS" label
3. Tap "Low Carb, High Protein" preset chip
4. **Expected**: Text input below fills with "Low Carb, High Protein"
5. Tap "Anti-Inflammatory" preset
6. **Expected**: Text becomes "Low Carb, High Protein, Anti-Inflammatory"
7. Edit the text manually to add custom text
8. **Expected**: Text is freely editable

### T3.6 — Medications
1. Scroll to Medications section
2. Tap "+ Add medication"
3. **Expected**: New medication card appears with fields for name, dose, unit, frequency, timing
4. Enter: Name=Metformin, Dose=500, Unit=mg, Freq=2, Period=per day, Timing=with meals
5. **Expected**: Summary line shows "Metformin 500 mg — 2x per day — with meals"

### T3.7 — Save Plan
1. Fill out a reasonable plan (diet, macros, exercise, at least 1 phase)
2. Tap "Create Treatment Plan"
3. **Expected**: Success alert "Plan Created for [Patient Name]"
4. Tap OK
5. **Expected**: Returns to previous screen

### T3.8 — Edit Existing Plan
1. Go back to the same patient
2. Open their profile → tap "Edit treatment plan"
3. **Expected**: TreatmentPlanEditorScreen with "Edit Plan" header, "Active" pill
4. Verify: All previously saved values are loaded correctly
5. Change one value (e.g., calorie target)
6. Tap "Update Treatment Plan"
7. **Expected**: Success alert "Plan Updated"

---

## PHASE 4: Doctor — Patient Profile

### T4.1 — View Patient Profile
1. From Roster, tap any patient
2. **Expected**: PatientProfileScreen loads with header, biomarkers, protocol
3. Verify: Patient name, age, sex, condition shown correctly
4. Verify: Status pill shows "On track" (teal) or "Critical" (rose)

### T4.2 — Expandable Sections
1. **Latest check-in**: should be expanded by default
2. Tap the header — should collapse
3. Tap again — should expand with animation
4. **Baseline**: should be collapsed by default, tap to expand
5. **Recent check-ins**: tap to expand, verify last 7 check-ins shown
6. Tap individual check-in row — should expand detail (waist, adherence, message)

### T4.3 — Protocol Section
1. Scroll to "Treatment plan" section
2. **If plan exists**: Verify diet type, calories, macros, exercise, phase, medications, supplements all show real data (NOT hardcoded values)
3. **If no plan**: Should show "No treatment plan created yet" + "Create Plan" button
4. Verify "Last updated" date is shown

### T4.4 — Rules Fired Section
1. Scroll to "Rules fired" section
2. **If patient has a daily plan**: Shows "Rules fired · Today's plan" or "Rules fired · Plan for [date]"
3. **If rules exist**: Each rule shows colored dot + rule ID pill + message
4. **If no rules**: Shows "No rules triggered"
5. **If no plan at all**: Shows "No plan generated yet"
6. **FAIL if**: Shows hardcoded "DR003" or "FBS > 180" text

### T4.5 — Doctor Flag Banner
1. If a plan has `doctor_flag_raised = true`:
2. **Expected**: Orange/red banner above rules with warning icon + real flag reason
3. **FAIL if**: No banner when flag exists, or hardcoded flag text

### T4.6 — Navigation Back
1. Tap "← Roster" back button
2. **Expected**: Returns to previous screen (Roster, Dashboard, etc.)

---

## PHASE 5: Doctor — Tabs & Stats

### T5.1 — Roster Stat Chips
1. On Roster tab, tap "Flags" stat chip
2. **Expected**: Modal opens showing flagged plans with patient names
3. Tap a patient in the modal
4. **Expected**: Modal closes, navigates to PatientProfile
5. Close modal (tap X or backdrop)
6. Tap "Unreviewed" chip — modal shows unreviewed (non-flagged) plans
7. Tap "Check-ins" chip — modal shows today's check-ins with FBS values

### T5.2 — Flags Tab
1. Switch to Flags tab (second tab)
2. **Expected**: Dashboard with date, 4 stat cards, patient list
3. Tap each stat card — verify modal opens with correct data
4. Tap patient row — navigates to PatientProfile

### T5.3 — Proto Tab
1. Switch to Proto tab (third tab)
2. **Expected**: Patients grouped by "Needs plan" (gray dot) and "Active plans" (green dot)
3. Verify summary pills: "X with active plans" / "Y without plans"
4. Tap patient without plan — navigates to TreatmentPlanEditor (create mode)
5. Tap patient with plan — navigates to TreatmentPlanEditor (edit mode)
6. Verify: Active plans show diet type, phase, "Updated X days ago"

### T5.4 — Stats Tab
1. Switch to Stats tab (fourth tab)
2. **Expected**: Analytics dashboard with overview, FBS distribution, phases, flags, weight
3. Verify: Numbers are real (not 0 or NaN for all)
4. Tap "Active patients" card — modal lists all patients
5. Tap "Avg 7-Day FBS" — modal shows each patient's FBS sorted worst-first
6. Tap "Check-in adherence" — modal shows who checked in and who didn't
7. Tap FBS distribution cards (Target, Amber, High, Critical) — modal shows patients in each band
8. Verify: Weight progress shows "Avg ↓ X kg from baseline" or "No data"

### T5.5 — Mutually Exclusive Counts
1. Note the "Flags" count and "Unreviewed" count on Roster tab
2. Switch to Flags tab — note the same counts
3. **Expected**: Flags + Unreviewed should NOT overlap (same plan shouldn't appear in both)
4. Open Flags modal — note which plans are listed
5. Open Unreviewed modal — verify NONE of the flagged plans appear here

---

## PHASE 6: Patient Login & Home

### T6.1 — Patient Login
1. Log out from doctor account
2. On Splash, tap "I'm a patient"
3. Enter the UHID from T2.2 (e.g., NK-0001) and password
4. Tap "Sign In"
5. **Expected**: Patient tabs appear with HomeScreen active
6. **FAIL if**: Login fails, shows doctor screen, shows demo data

### T6.2 — Patient Login — Wrong Password
1. Enter correct UHID but wrong password
2. **Expected**: Error alert
3. **FAIL if**: Silent failure or crash

### T6.3 — Home Screen — Data Loading
1. After login, observe HomeScreen
2. **Expected**: Shows real patient name (NOT "Rahul Mehta" or any demo data)
3. Verify greeting: "Good morning, [First Name]."
4. Verify day count and date are correct
5. **FAIL if**: Shows "Patient" as name, shows 0 for all metrics, shows demo data

### T6.4 — Home Screen — No Check-in Yet
1. If patient hasn't checked in today:
2. **Expected**: Teal CTA banner "Log today's check-in" visible
3. Verify: No plan cards show "Complete check-in first" or similar
4. Metrics show baseline values or "—"

### T6.5 — Home Screen — Logout
1. Tap "Sign Out" on HomeScreen
2. Confirm in alert
3. **Expected**: Returns to Splash screen

---

## PHASE 7: Patient — Check-In Flow

### T7.1 — Start Check-In
1. Logged in as patient, on HomeScreen
2. Tap "Log today's check-in" banner
3. **Expected**: CheckInScreen modal opens with Step 0 (FBS)

### T7.2 — Step 0: FBS
1. Drag slider to set FBS (e.g., 145)
2. Verify: Large number updates in real-time
3. Verify: Feedback text shows appropriate message for the value
4. Verify: Slider track color changes (teal < 100, amber 101-180, red > 180)
5. Tap "Continue"

### T7.3 — Step 1: Weight
1. **Expected**: Weight slider visible
2. Set weight (e.g., 78.5)
3. Verify: Shows one decimal place
4. Tap "Continue"

### T7.4 — Step 2: Energy
1. **Expected**: 5 energy level buttons
2. Tap "Good" (level 4)
3. Verify: Selected button is highlighted
4. Tap "Continue"

### T7.5 — Step 3: Requests
1. **Expected**: 6 toggle chips
2. Tap "Vegetarian today" — should highlight
3. Tap "Home workout" — should also highlight (multi-select)
4. Tap "Vegetarian today" again — should deselect
5. Tap "Continue"

### T7.6 — Step 4: Message
1. **Expected**: Text area for optional message
2. Type: "Feeling good today"
3. Tap "Generate today's plan"

### T7.7 — Submit Check-In
1. After tapping final button:
2. **Expected**: Brief loading, then navigates to Diet Plan tab
3. **FAIL if**: Error alert, stuck on check-in screen
4. Go back to HomeScreen
5. **Expected**: Green banner "Check-in logged today" replaces the CTA

### T7.8 — Verify Check-In in Supabase
1. Open Supabase dashboard → `daily_check_ins` table
2. **Expected**: New row with today's date, patient ID, FBS=145, weight=78.5, energy=4
3. **FAIL if**: No row, wrong values, wrong patient ID

---

## PHASE 8: Patient — Plan Screens

### T8.1 — Diet Plan Screen
1. After check-in, navigate to Plan tab
2. **Expected**: Diet plan loads from Supabase (not "No plan yet")
3. Verify: Diet type shown in header
4. Verify: Macro bar shows carbs/protein/fat percentages
5. Verify: Meals are listed (at least breakfast, lunch, dinner)
6. Verify: Reasoning box shows engine explanation
7. **FAIL if**: Shows "No plan yet" after check-in, shows NaN percentages

### T8.2 — Diet Plan — No Check-In
1. If you test with a patient who hasn't checked in:
2. **Expected**: "No plan yet. Complete your morning check-in..."
3. **FAIL if**: Crash, blank screen

### T8.3 — Workout Screen
1. From HomeScreen, tap Workout card
2. **Expected**: Workout plan with exercises, duration, intensity
3. Mark an exercise as done (tap checkbox)
4. **Expected**: Checkbox fills, progress bar updates
5. Navigate away and come back
6. **Expected**: Done exercises are still marked (persisted via AsyncStorage)

### T8.4 — Progress Screen
1. Navigate to Progress tab
2. **Expected**: Charts and metrics load (may be empty for new patient)
3. If check-ins exist: FBS trend chart shows data points
4. Verify: Day count, BMI, weight delta shown
5. **FAIL if**: NaN values, crash on empty data

### T8.5 — Supplements Screen
1. Navigate to Supps tab
2. **Expected**: Supplement list (may be empty if doctor hasn't prescribed)
3. If supplements exist: Toggle one as "taken"
4. **Expected**: Moves from "Still to take" to "Taken today"
5. Toggle back to untaken
6. **Expected**: Moves back to "Still to take"

### T8.6 — Notify Doctor Screen
1. Navigate to Notify tab
2. Select urgency: "Question"
3. Type message: "Is my FBS improving?"
4. Tap "Send to team"
5. **Expected**: Confirmation alert, form clears
6. Select "Urgent" urgency
7. **Expected**: Emergency warning banner appears (red)

---

## PHASE 9: Cross-Flow Verification

### T9.1 — Doctor Sees Patient's Check-In
1. Log in as doctor
2. Go to Roster tab
3. Find the patient who just checked in
4. **Expected**: Patient row shows latest FBS value (e.g., "FBS 145") with "today" label
5. Tap patient → PatientProfileScreen
6. **Expected**: Latest check-in section shows today's FBS, weight, energy

### T9.2 — Doctor Sees Generated Plan
1. On PatientProfileScreen, scroll to "Rules fired" section
2. **Expected**: Shows rules from the engine (e.g., DR001, DR002 if FBS was elevated)
3. Verify: Plan date says "Today's plan"
4. **FAIL if**: Shows "No plan generated yet" when patient just checked in

### T9.3 — Doctor Edits Protocol, Patient Sees Changes
1. As doctor, open patient's profile → tap "Edit treatment plan"
2. Change diet type (e.g., add "Keto")
3. Change calorie target to 1200
4. Save
5. **Expected**: Back on profile, protocol section shows new values
6. Log in as that patient
7. Do a new check-in (or wait for next day)
8. **Expected**: Generated plan should use the new protocol targets

### T9.4 — Stats Reflect Real Data
1. As doctor, go to Stats tab
2. **Expected**: "Active patients" count matches Roster patient count
3. **Expected**: FBS distribution shows the patient who checked in
4. **Expected**: Check-in adherence % reflects today's check-ins
5. Tap any stat card → modal opens with correct patient list

---

## PHASE 10: Edge Cases & Error Handling

### T10.1 — Empty Database
1. If no patients exist:
2. Roster: "No patients yet. Tap + to create your first patient"
3. Flags tab: "No patients yet"
4. Proto tab: "No patients yet"
5. Stats tab: All counts show 0 or "—", no NaN, no crash

### T10.2 — Network Offline
1. Turn off WiFi/cellular on iPad
2. Open app
3. **Expected**: Loading spinner, then eventually shows login screen (10s timeout)
4. **FAIL if**: Infinite spinner, crash, white screen

### T10.3 — Double Check-In Same Day
1. As patient, complete a check-in
2. Go back to HomeScreen
3. Try to do another check-in (if CTA still shows)
4. **Expected**: New check-in overwrites the old one for today
5. **FAIL if**: Duplicate rows in database, crash

### T10.4 — Patient Without Plan Opens Diet Screen
1. Create a new patient (no protocol, no check-in)
2. Log in as that patient
3. Go to Diet Plan tab
4. **Expected**: "No plan yet. Complete your morning check-in..."
5. Go to Workout tab
6. **Expected**: "Complete your check-in first."

### T10.5 — Touch Targets
1. On any screen, try tapping small elements:
2. Exercise checkboxes (should be easy to tap — 44px hitSlop)
3. Supplement toggles (should respond to tap in the surrounding area)
4. **FAIL if**: Need to tap precisely on a tiny 20px target

---

## PHASE 11: Data Integrity Checks

### T11.1 — Verify No Demo Data
1. Search every screen for "Rahul Mehta", "Priya Sharma", "Ananya Mishra", "Vikram Kapoor"
2. **Expected**: None of these names appear anywhere
3. **FAIL if**: Any demo/mock patient name appears

### T11.2 — Verify No Hardcoded Protocol Values
1. On PatientProfileScreen, check the protocol section
2. **Expected**: Values come from Supabase, not hardcoded "60g", "70g", "> 180 mg/dL"
3. Change protocol in TreatmentPlanEditor → return to profile
4. **Expected**: Profile reflects the new values immediately

### T11.3 — Verify Console is Clean
1. Open React Native debugger console
2. Navigate through the app
3. **Expected**: No console.log output in production mode (all guarded by __DEV__)
4. **FAIL if**: Patient names, UHIDs, or health data appear in console

---

## Quick Reference — Test Accounts

| Role | Login Method | Credentials |
|------|-------------|-------------|
| Doctor | Email + Password | (your doctor account) |
| Patient | UHID + Password | Created in T2.2 (NK-XXXX + generated password) |

## Quick Reference — Key Supabase Tables

| Table | Check for |
|-------|-----------|
| `patient_profiles` | New patient rows after creation |
| `daily_check_ins` | Check-in rows after patient submits |
| `daily_plans` | Plan rows after check-in (with rules_fired JSONB) |
| `protocols` | Protocol rows after doctor creates plan |
| `doctors` | Doctor account linkage |

---

**Total test cases: 60+**
**Estimated time: 2-3 hours for full pass**
