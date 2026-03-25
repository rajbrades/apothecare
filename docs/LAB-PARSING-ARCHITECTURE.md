# Lab Parsing & Document Extraction Architecture

**Last updated:** March 25, 2026

This document describes how lab report parsing and document extraction work. These are critical features — read this before modifying any of the files listed below.

---

## CRITICAL RULE: No Fire-and-Forget on Vercel

**Vercel serverless functions freeze/kill after the HTTP response is sent.** This means:

- `after()` callbacks are **unreliable** — they get killed mid-execution
- Fire-and-forget patterns (`someAsyncFn().catch(...)` without `await`) **do not work**
- ALL AI processing (parsing, extraction, transcription) **MUST be `await`ed before responding**

If you add a new background processing step, it MUST be synchronous (awaited). The client handles the wait with a spinner/polling UI.

---

## Lab Report Parsing Pipeline

### Flow
```
User uploads PDF on /labs page
  → POST /api/labs (maxDuration: 300s)
    → Upload PDF to Supabase Storage
    → Create lab_reports row (status: "uploading")
    → SYNCHRONOUSLY call parseLabReport()
      → Try TEXT path first (fast, ~15-30s):
        - Extract text from PDF using unpdf
        - If text > 200 chars → send to Sonnet as text completion
      → Fall back to VISION path (slow, ~60-90s):
        - Send PDF as base64 document to Sonnet, then Opus
      → Parse JSON response (with truncation repair)
      → Normalize biomarkers against reference ranges
      → Batch insert biomarker_results (25 per batch)
      → Update lab_reports status to "complete"
    → Return 201 with final lab report
```

### Key Files
| File | Purpose |
|------|---------|
| `src/app/api/labs/route.ts` | POST handler — upload + synchronous parse |
| `src/app/api/labs/[id]/reparse/route.ts` | Re-parse endpoint — same synchronous pattern |
| `src/lib/ai/lab-parsing.ts` | Core parsing logic — text/vision strategy, Claude API calls, JSON extraction |
| `src/lib/ai/lab-parsing-prompts.ts` | System prompt for Claude (handles LabCorp, Quest, DUTCH, GI-MAP, etc.) |
| `src/lib/labs/normalize-biomarkers.ts` | Biomarker normalization — reference range matching, flag calculation, DB insert |
| `src/lib/storage/lab-reports.ts` | Storage path helpers for lab PDFs |

### Performance Notes
- **Text-based PDFs** (LabCorp, Quest): ~15-30 seconds via Sonnet text completion
- **Scanned/image PDFs**: ~60-90 seconds via Sonnet/Opus vision
- **max_tokens: 16384** — required for large panels (60+ biomarkers). 8192 was too small and caused truncated JSON.
- **JSON repair**: If Claude's response is truncated, the parser attempts to close unclosed brackets and salvage partial data
- **Batch inserts**: Biomarkers are inserted in batches of 25 to avoid payload issues

### Common Failure Modes
1. **JSON truncation**: Claude hits token limit → response is cut off mid-JSON → parser repairs it
2. **FK violation**: lab_report row doesn't exist when biomarkers are inserted → pre-insert verification check added
3. **Timeout**: maxDuration must be 300s (5 min) — set in both the route file AND verified on Vercel
4. **Vision not needed**: Most lab PDFs have selectable text — vision is expensive and slow, text extraction is preferred

---

## Document Extraction Pipeline

### Flow
```
User uploads document on patient Documents tab
  → POST /api/patients/[id]/documents (maxDuration: 300s)
    → Upload to Supabase Storage
    → Create patient_documents row (status: "uploaded")
    → SYNCHRONOUSLY call extractDocumentContent()
      → Download from storage
      → Send to Claude for content extraction
      → Update document with extracted text + summary
    → Return 201 with final document
```

### Key Files
| File | Purpose |
|------|---------|
| `src/app/api/patients/[id]/documents/route.ts` | POST handler — upload + synchronous extraction |
| `src/app/api/patients/[id]/documents/[docId]/retry/route.ts` | Retry failed extraction |
| `src/app/api/patients/[id]/documents/[docId]/parse-as-lab/route.ts` | Convert document to lab report |
| `src/lib/ai/document-extraction.ts` | Core extraction logic |

### "Parse as Lab" Flow
Documents uploaded via the Documents tab get **text extraction only** (not biomarker parsing). To get biomarkers:
1. Upload as document → extraction runs
2. Click overflow menu (⋮) → "Parse as Lab" → creates a lab_reports row and runs full biomarker parsing

Or upload directly from the `/labs` page to skip the intermediate step.

---

## Audio Transcription Pipeline

### Flow
```
User records encounter on visit page
  → Recording saved to browser memory (MediaRecorder)
  → Auto-saved to Supabase Storage (audio/{visitId}/{timestamp}.webm)
  → User clicks "Process with AI Scribe"
    → POST /api/visits/[id]/transcribe (maxDuration: 300s)
      → Download audio from Supabase Storage (bypasses 4.5MB body limit)
      → Send to OpenAI Whisper
      → Return transcript
    → POST /api/visits/[id]/scribe (maxDuration: 300s)
      → Send transcript to Claude for section assignment
      → Return structured sections
    → Populate editor sections
    → Delete audio from storage (cleanup)
```

### Why Storage-First?
Vercel has a **4.5MB request body limit**. A 20-minute WebM recording is ~5MB. Audio is uploaded to Supabase Storage client-side first, then the transcribe endpoint downloads it from storage — avoiding the body limit entirely.

### Key Files
| File | Purpose |
|------|---------|
| `src/hooks/use-audio-recorder.ts` | Recording hook with auto-save to storage |
| `src/hooks/use-editor-dictation.ts` | Transcription + scribe orchestration |
| `src/app/api/visits/[id]/transcribe/route.ts` | Whisper transcription (reads from storage) |
| `src/app/api/visits/[id]/scribe/route.ts` | Claude section assignment |
| `src/components/visits/visit-workspace.tsx` | Encounter recorder UI |

---

## Vercel Configuration Checklist

All AI processing routes MUST have:
```typescript
export const runtime = "nodejs";
export const maxDuration = 300; // 5 min
```

Routes that need this:
- `/api/labs` (POST)
- `/api/labs/[id]/reparse` (POST)
- `/api/patients/[id]/documents` (POST)
- `/api/patients/[id]/documents/[docId]/retry` (POST)
- `/api/patients/[id]/documents/[docId]/parse-as-lab` (POST)
- `/api/visits/[id]/transcribe` (POST)
- `/api/visits/[id]/scribe` (POST)
- `/api/visits/[id]/generate` (POST)
- `/api/account/export` (POST)
- `/api/admin/evidence/ingest` (POST)
- `/api/admin/rag/ingest` (POST)

**NEVER use `after()` or fire-and-forget for AI processing on Vercel.**
