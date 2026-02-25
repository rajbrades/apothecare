# Apothecare — Business Plan & Strategy

**Version:** 1.0  
**Date:** February 14, 2026

---

## 1. Executive Summary

Apothecare is an AI-native Clinical Decision Support System (CDSS) built specifically for functional and integrative medicine practitioners. Unlike generic AI scribes, Apothecare is deeply grounded in functional medicine frameworks (IFM, A4M) and peer-reviewed literature. It automates the most complex parts of the functional medicine workflow: matrix mapping, protocol generation, and deep clinical analysis, freeing practitioners to focus on patient care.

## 2. Market Opportunity

### The Problem
Functional medicine encounters are complex, requiring the synthesis of patient history, advanced labs (DUTCH, OAT, GI-MAP), and lifestyle factors.
*   **Documentation Burden:** Comprehensive SOAP notes and IFM Matrix mapping take hours.
*   **Information Overload:** Practitioners struggle to keep up with the latest research and supplement protocols.
*   **Generic Tools Fail:** Standard AI scribes (Heidi, Ambience) lack the specific knowledge base of functional medicine (e.g., they don't understand "OAT markers for fungal overgrowth").

### The Solution: Apothecare
*   **AI Scribe + CDSS:** Automates documentation *and* provides clinical intelligence.
*   **Evidence-Based:** All capabilities are grounded in cited research (RCTs, Meta-analyses, Guidelines).
*   **Functional First:** Native support for the IFM Matrix, functional lab ranges, and root-cause analysis.

---

## 3. Product & Features

### Core Pillars
1.  **AI Scribe & Documentation:**
    *   Ambient listening (Whisper) → Structured SOAP Note.
    *   Automated extraction of history, meds, and supplements from prior records.
2.  **Clinical Intelligence (The "Brain"):**
    *   **IFM Matrix Mapping:** auto-maps findings to the 7 physiological nodes.
    *   **Deep Consult:** On-demand second opinions using Claude Opus, citing specific medical literature.
3.  **Protocol Engine:**
    *   Auto-generates lifestyle, dietary, and supplement recommendations.
    *   **Supplement Intelligence:** Checks for drug-herb interactions and contraindications.
    *   **Patient Education Studio (NotebookLM-style):**
        *   Auto-generates personalized multimedia content to explain the protocol.
        *   **Audio Overviews:** AI-generated podcast-style summaries explaining the "Why" and "How" of the protocol.
        *   **Visual Guides:** Slides (PPTX/PDF) breaking down lifestyle changes and supplement schedules.
        *   **Curated Video Library:** Embeds relevant educational videos for specific conditions/interventions.

### **New: Brand-Specific Formularies** (Key Differentiator)
Apothecare allows practitioners to define **Supplement Brand Preferences**.
*   **Custom Formularies:** Practitioners can select preferred professional brands (e.g., *Apex Energetics*, *Orthomolecular*, *Designs for Health*, *Pure Encapsulations*).
*   **Smart Auto-Suggest:** When generating protocols, the AI prioritizes products from the practitioner's trusted brands.
*   **Precise Dosing:** Recommendations include brand-specific SKUs, forms, and dosing instructions.
*   **Fullscript Integration (Planner):** Seamless one-click cart creation for patient ordering.

---

## 4. Monetization Strategy

Apothecare employs a dual-revenue model: SaaS subscriptions and affiliate/marketplace revenue.

### A. SaaS Subscription
*   **Free Tier:**
    *   2 "Deep Consult" queries/day.
    *   Basic Scribe usage.
    *   "Land and expand" user acquisition strategy.
*   **Pro Tier ($89/month):**
    *   Unlimited "Deep Consult" (Opus).
    *   Unlimited AI Scribe & Visit Generation.
    *   Advanced Lab Interpretation (OCR + Vision).
    *   Brand Preference configuration.
*   **Premium Add-on: Deep Research (Pricing TBD):**
    *   Autonomous, deep-dive literature reviews using advanced reasoning models (e.g., OpenAI o3-mini or similar).
    *   Generates comprehensive research reports with full citations for complex clinical questions.
*   **Premium Add-on: Patient Education Suite (Pricing TBD):**
    *   Personalized audio/video generation for patient protocols.

### B. Marketplace & Affiliate (High Growth Potential)
The **Supplement Brand Preference** feature opens a massive secondary revenue stream.
*   **Fullscript / Dispensary Integration:**
    *   Earn a percentage of transaction volume (take rate) when protocols are converted to orders.
    *   Functional medicine practitioners heavily rely on extensive supplement protocols (often $200-$500/month per patient).
*   **Sponsored Educational Content:**
    *   Partner with professional brands to provide "suggested protocols" based on their clinical trials, clearly marked as sponsored but clinically relevant.

---

## 5. Target Audience

*   **Primary:** Functional Medicine MDs, DOs, NPs, PAs.
*   **Secondary:** Naturopathic Doctors (NDs), Chiropractors (DCs), Nutritionists.
*   **Settings:** Private practices (cash-based), small integrative clinics.

---

## 6. Competitive Advantage (The "Moat")

| Feature | Generic Scribes (Heidi, Nabla) | Generic LLMs (ChatGPT) | **Apothecare** |
| :--- | :---: | :---: | :---: |
| **Ambient Scribe** | ✅ | ❌ | ✅ |
| **IFM Matrix Mapping** | ❌ | ❌ | ✅ |
| **Cited Evidence** | ❌ | ⚠️ (Hallucinates) | ✅ (RAG System) |
| **Brand Preferences** | ❌ | ❌ | ✅ |
| **Lab Interpretation** | ❌ | ✅ (Basic) | ✅ (Functional Ranges) |

---

---

## 8. Strategic Partnerships (The "Institute Moat")

### The "Curriculum Compliance" Strategy
Partner with major functional medicine institutes (A4M, IFM) to become the **official digital runtime** for their education.
*   **Problem:** Graduates struggle to implement complex protocols in practice ("The Monday Morning Gap").
*   **Solution:** Apothecare operationalizes their curriculum. When a doctor sees a patient, Apothecare surfaces *their* specific protocols.
*   **Institute Mode:** Premium feature where the AI strictly follows one institute's guidelines (e.g., "A4M Mode" vs "IFM Mode").
*   **Revenue Share:** Institutes receive royalties on subscriptions attributed to their alumni network.

---

## 9. Roadmap & Milestones

*   **Phase 1: Foundation (Current)**
    *   ✅ Scribe & SOAP Generation
    *   ✅ IFM Matrix Mapping
    *   ✅ Deep Consult (Chat)
*   **Phase 2: Growth & Revenue (Next)**
    *   🛠 **Implement Brand Preference Engine**
    *   🛠 Fullscript API Integration
    *   🛠 **Institute Partner Pilot:** Launch with one major institute (target A4M first).
    *   🛠 PDF Export & Patient Sharing
    *   🛠 **Practice Analytics**: Clinical dashboards showing protocol effectiveness.
*   **Phase 3: Scale**
    *   EHR Integrations (Cerner/Epic via FHIR - optional)
    *   Multi-practitioner clinic support

