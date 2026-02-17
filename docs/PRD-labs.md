# PRD: Lab Results Module — Phase 2

**Product:** Apotheca
**Module:** Labs
**Status:** Phase 2 — Partially Implemented (Sprint 7-8)
**Last Updated:** 2026-02-17

---

## 1. Overview

The Lab Results module currently supports PDF upload, AI-powered parsing (Claude Vision), biomarker extraction with functional/conventional range bars, and basic list/detail views. Phase 2 enhances the module with visual lab type differentiation, patient-centric filtering, archival workflows, biomarker trending over time, and practice-level analytics.

---

## 2. Target Users

| Persona | Description |
|---|---|
| **Functional Medicine Practitioner** | Primary user. Uploads lab PDFs, reviews parsed biomarkers, tracks patient trends over time, identifies population-level patterns. |
| **Practice Manager / Admin** | Views lab volume analytics, monitors parsing success rates, manages data retention. |

---

## 3. User Problems Addressed

1. **Visual scanning is slow** — All lab cards look identical (same icon, same color). Practitioners can't quickly distinguish a blood panel from a GI-MAP at a glance.
2. **No patient-centric view** — Can't filter the lab list by patient, making it hard to find a specific patient's reports.
3. **Data accumulation** — Labs persist indefinitely with no archival or retention workflow, cluttering the active list over time.
4. **No longitudinal tracking** — Can't see how a biomarker (e.g., TSH, Vitamin D) changes across multiple reports for the same patient.
5. **No practice insights** — No way to see population-level patterns (e.g., "70% of my patients have suboptimal Vitamin D").

---

## 4. Feature: Lab Type Icons & Color Coding ✅ COMPLETE

### 4.1 Problem
Every lab card shows the same generic flask icon. When a practitioner has 50+ reports, visual differentiation is critical for quick scanning.

### 4.2 Solution
Map each `test_type` to a unique Lucide icon and a subtle background color tint on the card's icon badge.

| Test Type | Icon | Color Tint |
|---|---|---|
| `blood_panel` | `Droplets` | Rose/Red |
| `stool_analysis` | `Bug` | Green/Teal |
| `saliva_hormone` | `FlaskConical` | Violet/Purple |
| `urine_hormone` | `FlaskConical` | Violet/Purple |
| `organic_acids` | `TestTubes` | Amber/Gold |
| `micronutrient` | `Pill` | Amber/Gold |
| `food_sensitivity` | `Wheat` | Orange |
| `genetic` | `Dna` | Indigo |
| `mycotoxin` | `Biohazard` | Red/Dark |
| `environmental` | `Leaf` | Green |
| `other` | `FileText` | Gray (default) |

### 4.3 Files Affected
- `src/components/labs/lab-report-card.tsx` — icon/color lookup map, apply to icon badge

### 4.4 Acceptance Criteria
- [x] Each test type renders a distinct icon
- [x] Icon badge has a color-tinted background matching the type
- [x] Fallback to generic `FileText` + gray for unknown types

---

## 5. Feature: Patient Filter & Search ✅ COMPLETE

### 5.1 Problem
The lab list has status and test type filters but no way to filter by patient. The `patients` data is already passed to `LabListClient` (used by the upload form) but not used for filtering.

### 5.2 Solution

**5.2a — Patient Dropdown Filter**
Add a patient dropdown alongside the existing status and test type filters. Server-side filtering via `patient_id` query param on `GET /api/labs`.

**5.2b — Text Search**
Add a search input that matches against test name, vendor label, and patient name. Server-side `ilike` query on the `lab_reports` table joined with `patients`.

### 5.3 Files Affected
- `src/components/labs/lab-list-client.tsx` — add patient filter dropdown, search input
- `src/app/api/labs/route.ts` — add `patient_id` and `search` query params to GET handler

### 5.4 Acceptance Criteria
- [x] Patient dropdown shows all practitioner's patients, "All Patients" default
- [x] Selecting a patient filters the list to only their reports
- [x] Text search filters by test name, vendor, or patient name (debounced, 300ms)
- [x] Filters compose (patient + status + type + search all work together)
- [ ] URL params preserved for shareability/bookmarking (optional, nice-to-have)

---

## 6. Feature: Lab Archival ✅ COMPLETE

### 6.1 Problem
Labs persist indefinitely. Over months/years, the active list becomes unmanageable. Practitioners need a way to declutter without permanently deleting data.

### 6.2 Solution

**6.2a — Archive Status**
Add `archived` as a new `LabReportStatus` (or a separate boolean column `is_archived`). Archived labs are hidden from the default list view but accessible via a filter toggle.

**6.2b — Archive/Unarchive Actions**
- Archive button on lab cards and detail page (for `complete` reports)
- "Show Archived" toggle or filter option on the lab list
- Unarchive action to restore to active view

**6.2c — Future: Auto-Archive Policy** (deferred)
Practitioner setting: auto-archive reports older than N months. Not in Phase 2 scope.

### 6.3 Schema Change
```sql
-- Option A: Boolean column (simpler)
ALTER TABLE lab_reports ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false;

-- Option B: Add 'archived' to LabReportStatus enum (more explicit)
-- Depends on current enum implementation
```

### 6.4 Files Affected
- Database migration (new column)
- `src/app/api/labs/route.ts` — filter out archived by default, add `include_archived` param
- `src/components/labs/lab-report-card.tsx` — archive button
- `src/components/labs/lab-report-detail.tsx` — archive button in action row
- `src/components/labs/lab-list-client.tsx` — "Show Archived" toggle

### 6.5 Acceptance Criteria
- [x] Archive button visible on complete lab cards
- [x] Archived labs hidden from default list view
- [x] "Show Archived" filter reveals archived labs (visually dimmed)
- [x] Unarchive action restores lab to active list
- [x] Archived labs still accessible via direct URL

---

## 7. Feature: Biomarker Timeline (Single Patient) ✅ COMPLETE

### 7.1 Problem
Practitioners upload multiple labs for the same patient over months. There's no way to see how a specific biomarker (e.g., TSH, Vitamin D, hs-CRP) trends over time. This is one of the most requested features in functional medicine software.

### 7.2 Solution

**7.2a — Patient Biomarker History API**
New endpoint: `GET /api/patients/[id]/biomarkers/timeline`
- Returns all biomarker results for a patient, grouped by `biomarker_code`
- Each group contains timestamped values from different lab reports
- Includes functional and conventional ranges for context

**7.2b — Timeline Visualization**
On the patient profile (new "Lab Trends" tab or section):
- Dropdown to select a biomarker (e.g., "TSH", "Free T4", "Vitamin D")
- Line chart showing values over time with:
  - Functional optimal range as a shaded green band
  - Conventional range as a lighter band
  - Data points linked to their source lab report
  - Click a point to jump to the lab report detail

**7.2c — Biomarker Range Bar Integration**
The existing `BiomarkerRangeBar` component already supports `previousValue` for trend indicators. Populate this field by querying the most recent previous result for the same biomarker/patient.

### 7.3 Technical Notes
- Chart library: consider `recharts` (React-native, already common in Next.js projects) or lightweight `@nivo/line`
- Query: `biomarker_results` joined with `lab_reports` filtered by `patient_id`, ordered by `collection_date`
- Index needed: `biomarker_results(lab_report_id)` + `lab_reports(patient_id, collection_date)`

### 7.4 Files Affected
- `src/app/api/patients/[id]/biomarkers/timeline/route.ts` — new API endpoint
- `src/components/patients/biomarker-timeline.tsx` — new chart component
- `src/components/patients/patient-profile.tsx` — add "Lab Trends" tab
- `src/components/labs/lab-report-detail.tsx` — populate `previousValue` from history

### 7.5 Acceptance Criteria
- [x] API returns biomarker history grouped by code for a given patient
- [x] Timeline chart renders with functional/conventional range bands (Recharts)
- [x] Biomarker selector shows all available biomarkers for the patient
- [x] Clicking a data point navigates to the source lab report
- [x] `previousValue` populated on biomarker range bars when history exists
- [x] Handles edge cases: single data point (no line, just dot), missing dates

---

## 8. Feature: Practice-Level Analytics Dashboard

### 8.1 Problem
Practitioners have no visibility into patterns across their patient population. Functional medicine practitioners particularly value seeing which biomarkers are most commonly out of range to inform protocol design and supplement stocking.

### 8.2 Solution

**8.2a — Analytics Dashboard Page** (`/labs/analytics` or `/dashboard/labs`)

**Section 1: Lab Volume**
- Total reports uploaded (all time, last 30 days, last 90 days)
- Reports by test type (bar chart or donut)
- Reports by vendor (bar chart)
- Parsing success rate (complete vs error)

**Section 2: Population Biomarker Flags**
- Table/heatmap: which biomarkers are most commonly out-of-range across all patients
- Sortable by: flag frequency, biomarker name, category
- Example: "Vitamin D — 68% suboptimal, 12% out-of-range, 20% optimal"
- Filter by test type or date range

**Section 3: Common Patterns** (future / AI-assisted)
- Correlations between biomarkers (e.g., "Patients with low Vitamin D also tend to have elevated hs-CRP")
- Protocol effectiveness tracking (deferred — requires protocol + outcome linking)

### 8.3 Technical Notes
- Aggregation queries on `biomarker_results` joined with `lab_reports`
- Consider server-side aggregation (Supabase RPC / SQL function) for performance
- Cache results (stale-while-revalidate) — analytics don't need real-time precision

### 8.4 Files Affected
- `src/app/(app)/labs/analytics/page.tsx` — new page
- `src/components/labs/analytics/` — new component directory
  - `lab-volume-chart.tsx`
  - `biomarker-flag-heatmap.tsx`
  - `analytics-summary-cards.tsx`
- `src/app/api/labs/analytics/route.ts` — aggregation API endpoint
- Sidebar navigation — add "Lab Analytics" link under Labs section

### 8.5 Acceptance Criteria
- [ ] Dashboard loads with summary cards (total reports, flagged biomarkers, success rate)
- [ ] Lab volume chart shows reports over time by type
- [ ] Biomarker flag table shows top 20 most-flagged biomarkers across all patients
- [ ] Date range filter (30d, 90d, 1y, all time)
- [ ] Page is server-rendered with client-side chart hydration

---

## 9. Feature: Enhanced Patient Profile Labs Section ✅ COMPLETE

### 9.1 Problem
Labs are currently buried under a "Documents" tab on the patient profile, mixed with other uploaded documents. There's no dedicated lab experience on the patient page.

### 9.2 Solution
- Add a dedicated **"Labs"** tab on the patient profile (separate from Documents)
- Show lab cards with the new type icons/colors
- Include a summary bar: "12 reports, 3 flagged biomarkers, last lab: Jan 15, 2026"
- Quick-access to Biomarker Timeline (Section 7) from this tab
- Upload shortcut: "Upload Lab for [Patient Name]" button (pre-selects patient)

### 9.3 Files Affected
- `src/components/patients/patient-profile.tsx` — add "Labs" tab
- `src/components/patients/patient-labs-tab.tsx` — new component

### 9.4 Acceptance Criteria
- [x] "Labs" tab appears on patient profile
- [x] Shows all lab reports for the patient with type-specific icons
- [x] Summary bar shows report count, flag count, last lab date
- [x] "Upload Lab" button pre-selects the current patient
- [x] Link to biomarker timeline view

---

## 10. Implementation Priority

| Priority | Feature | Effort | Impact | Status |
|---|---|---|---|---|
| **P0** | Lab Type Icons & Colors | Small (1-2 hrs) | High — immediate visual improvement | ✅ Done |
| **P0** | Patient Filter on Lab List | Small (1-2 hrs) | High — critical missing filter | ✅ Done |
| **P1** | Text Search | Small (2-3 hrs) | Medium — quality of life | ✅ Done |
| **P1** | Lab Archival | Medium (4-6 hrs) | Medium — data management | ✅ Done |
| **P1** | Patient Profile Labs Tab | Medium (3-4 hrs) | High — patient-centric workflow | ✅ Done |
| **P2** | Biomarker Timeline | Large (8-12 hrs) | Very High — signature feature | ✅ Done |
| **P3** | Practice Analytics Dashboard | Large (12-16 hrs) | High — differentiator | Planned |

---

## 11. Open Questions

1. **Chart library**: Use `recharts` (popular, large) or `@nivo/line` (smaller, D3-based) or `chart.js` via `react-chartjs-2`?
2. **Archive vs. soft delete**: Should archive be a separate concept from the existing delete, or replace it?
3. **Analytics access control**: Should analytics be available to all practitioners or gated behind a plan/tier?
4. **Biomarker code normalization**: Different labs may use different codes for the same biomarker (e.g., "VIT_D" vs "VITAMIN_D_25OH"). Need a normalization layer for accurate trending?
5. **Data retention / HIPAA**: What's the required retention period for lab data? Should there be an auto-purge after X years?
