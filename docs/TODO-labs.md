# Lab Results Module — TODO

**Reference:** [PRD-labs.md](PRD-labs.md)
**Last Updated:** 2026-02-20

---

## P0 — Do Now ✅ COMPLETE

### Lab Type Icons & Colors ✅
- [x] Create `TEST_TYPE_CONFIG` lookup map in `lab-report-card.tsx` (icon + color per test type)
- [x] Replace generic flask icon with type-specific Lucide icon (`Droplets`, `Bug`, `Dna`, etc.)
- [x] Apply color tint to icon badge background
- [x] Verify all 11 test types have an icon, fallback to `FileText` + gray

### Patient Filter on Lab List ✅
- [x] Add patient dropdown filter to `lab-list-client.tsx` (data already available via `patients` prop)
- [x] Add `patient_id` query param support to `GET /api/labs` route
- [x] Wire up filter to trigger re-fetch alongside status and test type filters
- [x] Test: selecting a patient shows only their labs, "All Patients" shows all

---

## P1 — Do Next ✅ COMPLETE

### Text Search ✅
- [x] Add search input to `lab-list-client.tsx` (debounced 300ms)
- [x] Add `search` query param to `GET /api/labs` — `ilike` on test_name, lab_vendor, patient name
- [x] Search composes with patient, status, and type filters

### Lab Archival ✅
- [x] Add `is_archived` boolean column to `lab_reports` table (migration 007)
- [x] Update `GET /api/labs` to exclude archived by default, add `include_archived` param
- [x] Add archive/unarchive button to `lab-report-card.tsx`
- [x] Add archive button to `lab-report-detail.tsx` action row (for complete reports)
- [x] Add "Show Archived" toggle to `lab-list-client.tsx` filter bar
- [x] Archived labs visually dimmed in list view

### Patient Profile — Dedicated Labs Tab ✅ → Merged into Documents
- [x] Add "Labs" tab to `patient-profile.tsx` (separate from Documents)
- [x] Create `patient-labs-tab.tsx` component
- [x] Show lab cards with type icons/colors
- [x] Summary bar: report count, flag count, last lab date
- [x] "Upload Lab" button pre-selects current patient
- [x] Link to biomarker timeline
- **Note (Feb 20):** Labs tab removed and merged into Documents tab with category grouping (Lab Reports, Clinical Records, Imaging, Referrals, Administrative, Other). Biomarker Trends moved to Documents sub-toggle ("All Files / Trends"). This reduced the tab bar from 7 → 6 tabs.

---

## P2 — Plan & Build ✅ COMPLETE

### Biomarker Timeline (Single Patient) ✅
- [x] Create `GET /api/patients/[id]/biomarkers/timeline` endpoint
  - [x] Query `biomarker_results` joined with `lab_reports` filtered by patient
  - [x] Group by `biomarker_code`, order by `collection_date`
  - [x] Return functional/conventional ranges for each
- [x] Choose chart library — Recharts
- [x] Create `biomarker-timeline.tsx` chart component
  - [x] Line chart with data points over time
  - [x] Functional range as green shaded band
  - [x] Conventional range as lighter band
  - [x] Click data point to navigate to source lab report
- [x] Add "Lab Trends" tab/section to patient profile
- [x] Add biomarker selector dropdown (shows all available for that patient)
- [x] Populate `previousValue` on `BiomarkerRangeBar` from historical data
- [x] Handle edge cases: single data point, missing collection dates
- [ ] Add DB index: `biomarker_results(lab_report_id)` + `lab_reports(patient_id, collection_date)` — deferred to production optimization

---

## P2.5 — Patient Context & Navigation ✅ COMPLETE (Feb 23)

### Searchable Patient Combobox ✅
- [x] Create `src/components/ui/patient-search-combobox.tsx` — controlled input, 300ms debounce → `GET /api/patients?search={term}&limit=15`
- [x] Div-based popover (no Radix), matches `source-filter-popover.tsx` pattern
- [x] Replace HTML `<select>` in `lab-list-client.tsx` with `PatientSearchCombobox`

### Assign Patient to Lab ✅
- [x] Extend PATCH `/api/labs/[id]` — accept `patient_id: uuid | null`, verify ownership, sync `biomarker_results.patient_id`
- [x] Extend `patchLabSchema` in `src/lib/validations/lab.ts`
- [x] Create `src/components/labs/assign-patient-button.tsx` (UserPlus/UserCheck icon + combobox popover)
- [x] Wire into `lab-report-card.tsx` hover actions + `lab-report-detail.tsx` action row
- [x] Optimistic update in `lab-list-client.tsx` via `handleAssign` callback

### Browse-by-Patient Mode ✅
- [x] Create `GET /api/labs/patients-summary` — patient-level lab counts + last lab date
- [x] Add `unlinked: boolean` to `labListSchema`; `GET /api/labs?unlinked=true` filters `patient_id IS NULL`
- [x] `[List] [By Patient]` toggle in `lab-list-client.tsx`
- [x] Patient cards with lab count + date; "Unlinked Labs (N)" card
- [x] Card click → sets `patientFilter`, switches to list mode

### Contextual Back-Link ✅
- [x] `lab-report-detail.tsx` accepts `fromPatient?: { id, name }` prop — breadcrumb shows "Patient Name → Lab Name" with back-link
- [x] `src/app/(app)/labs/[id]/page.tsx` reads `?from=patient&patientId&patientName` and passes to detail component
- [x] `document-list.tsx` links to lab detail with `?from=patient` params

### Lab Detail Slide-Over Drawer ✅
- [x] Create `src/components/labs/lab-detail-sheet.tsx` — 500px right panel, backdrop + Escape close, body scroll lock
- [x] Shows: flagged biomarkers (flag badges + "View Trend" button), all results by category
- [x] `document-list.tsx` — `onLabClick` prop; lab rows clickable with Eye icon button
- [x] `patient-profile.tsx` — `selectedLabId` state, `<LabDetailSheet>` at root

### Push Lab to Patient Timeline ✅
- [x] Create `POST /api/labs/[id]/push-to-record` — builds `lab_result` timeline event; upserts on `source_table="lab_reports"` + `source_id` (idempotent)
- [x] Push button on `lab-report-detail.tsx` (complete + has patient)

### Trends Deep-Link from Drawer ✅
- [x] `LabDetailSheet` — `onOpenTrends?: (biomarkerCode?) => void` prop + TrendingUp button per flagged biomarker
- [x] `BiomarkerTimeline` — `initialBiomarkerCode?: string` prop; secondary useEffect syncs selection after list loads
- [x] `patient-profile.tsx` — Trends top-level tab; `onOpenTrends` closes drawer + sets code + switches tab
- [x] `patients/[id]/page.tsx` — `"trends"` added to `validTabs`

## P3 — Future

### Practice-Level Analytics Dashboard
- [ ] Create `/labs/analytics` page
- [ ] Add sidebar navigation link
- [ ] **Lab Volume section:**
  - [ ] Summary cards (total reports, last 30d, success rate)
  - [ ] Reports by test type chart
  - [ ] Reports by vendor chart
- [ ] **Population Biomarker Flags section:**
  - [ ] Aggregation API: `GET /api/labs/analytics`
  - [ ] Table/heatmap of most-flagged biomarkers across all patients
  - [ ] Sortable by flag frequency
  - [ ] Date range filter (30d, 90d, 1y, all)
- [ ] **Common Patterns** (AI-assisted, future):
  - [ ] Biomarker correlation analysis
  - [ ] Protocol effectiveness tracking (requires protocol linking)

### Data Retention & HIPAA
- [ ] Define data retention policy
- [ ] Auto-archive setting (practitioner-configurable, N months)
- [ ] Consider soft-delete with 30-day trash for permanent deletion

### Biomarker Code Normalization
- [ ] Build normalization layer for biomarker codes across vendors
- [ ] Map vendor-specific codes to canonical codes (e.g., VIT_D → VITAMIN_D_25OH)
- [ ] Required for accurate cross-vendor trending

---

## Completed

### Sprint 6 (GI-MAP)
- [x] GI-MAP subcategory parsing (bacterial_pathogens, h_pylori, commensal_bacteria, etc.)
- [x] Qualitative result display (Detected/Not Detected with Normal/Abnormal badges)
- [x] GI-MAP clinical section ordering (matches PDF layout)
- [x] Scientific notation formatting (275000000 → 2.75 x 10^8)
- [x] Re-parse button for completed reports
- [x] Human-readable GI-MAP section titles

### Sprint 7 (Lab UX)
- [x] Lab type icons & color coding (11 test types mapped)
- [x] Lab search (test name, vendor, patient name — debounced)
- [x] Patient filter on lab list
- [x] Lab archival (archive/unarchive/show archived toggle)
- [x] Patient profile dedicated Labs tab with summary bar (later merged into Documents tab — see P1 note)
- [x] Smart lab titles from AI-extracted test names
- [x] Lab report deletion with cascade cleanup

### Sprint 8 (Biomarker Timeline)
- [x] Biomarker timeline API + Recharts visualization
- [x] previousValue trend indicators on range bars
- [x] Patient "Lab Trends" tab with biomarker selector (originally Documents sub-toggle; promoted to top-level Trends tab in Sprint 11)
