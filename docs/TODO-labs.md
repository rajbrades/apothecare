# Lab Results Module — TODO

**Reference:** [PRD-labs.md](PRD-labs.md)
**Last Updated:** 2026-02-16

---

## P0 — Do Now

### Lab Type Icons & Colors
- [ ] Create `TEST_TYPE_CONFIG` lookup map in `lab-report-card.tsx` (icon + color per test type)
- [ ] Replace generic flask icon with type-specific Lucide icon (`Droplets`, `Bug`, `Dna`, etc.)
- [ ] Apply color tint to icon badge background
- [ ] Verify all 11 test types have an icon, fallback to `FileText` + gray

### Patient Filter on Lab List
- [ ] Add patient dropdown filter to `lab-list-client.tsx` (data already available via `patients` prop)
- [ ] Add `patient_id` query param support to `GET /api/labs` route
- [ ] Wire up filter to trigger re-fetch alongside status and test type filters
- [ ] Test: selecting a patient shows only their labs, "All Patients" shows all

---

## P1 — Do Next

### Text Search
- [ ] Add search input to `lab-list-client.tsx` (debounced 300ms)
- [ ] Add `search` query param to `GET /api/labs` — `ilike` on test_name, lab_vendor, patient name
- [ ] Search composes with patient, status, and type filters

### Lab Archival
- [ ] Add `is_archived` boolean column to `lab_reports` table (migration)
- [ ] Update `GET /api/labs` to exclude archived by default, add `include_archived` param
- [ ] Add archive/unarchive button to `lab-report-card.tsx`
- [ ] Add archive button to `lab-report-detail.tsx` action row (for complete reports)
- [ ] Add "Show Archived" toggle to `lab-list-client.tsx` filter bar
- [ ] Archived labs visually dimmed in list view

### Patient Profile — Dedicated Labs Tab
- [ ] Add "Labs" tab to `patient-profile.tsx` (separate from Documents)
- [ ] Create `patient-labs-tab.tsx` component
- [ ] Show lab cards with type icons/colors
- [ ] Summary bar: report count, flag count, last lab date
- [ ] "Upload Lab" button pre-selects current patient
- [ ] Link to biomarker timeline (when available)

---

## P2 — Plan & Build

### Biomarker Timeline (Single Patient)
- [ ] Create `GET /api/patients/[id]/biomarkers/timeline` endpoint
  - [ ] Query `biomarker_results` joined with `lab_reports` filtered by patient
  - [ ] Group by `biomarker_code`, order by `collection_date`
  - [ ] Return functional/conventional ranges for each
- [ ] Choose chart library (recharts vs @nivo/line vs chart.js)
- [ ] Create `biomarker-timeline.tsx` chart component
  - [ ] Line chart with data points over time
  - [ ] Functional range as green shaded band
  - [ ] Conventional range as lighter band
  - [ ] Click data point to navigate to source lab report
- [ ] Add "Lab Trends" tab/section to patient profile
- [ ] Add biomarker selector dropdown (shows all available for that patient)
- [ ] Populate `previousValue` on `BiomarkerRangeBar` from historical data
- [ ] Handle edge cases: single data point, missing collection dates
- [ ] Add DB index: `biomarker_results(lab_report_id)` + `lab_reports(patient_id, collection_date)`

---

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

## Completed (this sprint)

- [x] GI-MAP subcategory parsing (bacterial_pathogens, h_pylori, commensal_bacteria, etc.)
- [x] Qualitative result display (Detected/Not Detected with Normal/Abnormal badges)
- [x] GI-MAP clinical section ordering (matches PDF layout)
- [x] Scientific notation formatting (275000000 → 2.75 x 10^8)
- [x] Re-parse button for completed reports
- [x] Human-readable GI-MAP section titles
