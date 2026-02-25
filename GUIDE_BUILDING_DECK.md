# How to Build Your Pitch Decks

You have the content scripts (`PITCH_DECK_INVESTORS.md` and `PITCH_DECK_ADVISORS.md`). Now you need to turn them into visual slides.

## Option A: The "Pro" Route (Figma) — *Recommended for Apothecare's Aesthetic*
Since Apothecare has a specific "Dark Mode / Premium Clinical" vibe, creating the deck in Figma allows you to reuse your actual UI assets directly.

1.  **Open Figma:** Create a new design file.
2.  **Set Frame Size:** Use `1920 x 1080` (Standard 16:9 Presentation).
3.  **Define Styles (Match your App):**
    *   **Background:** `#1a2e2a` (Your dark teal brand color).
    *   **Text (Headings):** Font family `Newsreader` (Serif). Color: `#f8fafb` (Off-white) or `#d4af37` (Gold).
    *   **Text (Body):** Font family `DM Sans` (Sans-serif). Color: `#a3bbb5` (Muted teal/grey).
4.  **Create Master Components:**
    *   Create a "Slide Master" frame with your Logo in the bottom right and a subtle "Page Number" in the bottom left.
5.  **Build Slide-by-Slide:**
    *   Copy the **Headline** from the markdown file.
    *   Paste the **Body** text.
    *   **For Visuals:** Take screenshots of your running localhost app (CMD+Shift+4 on Mac).
    *   *Tip:* Use verified "mockup" plugins in Figma (like "Artboard Studio Mockups") to put your screenshots inside a generic laptop frame for a polished look.

## Option B: The "Fast" Route (Pitch.com or beautiful.ai)
If you want it done in 30 minutes, use an AI slide builder.

1.  **Go to [Pitch.com](https://pitch.com) or [Gamma.app](https://gamma.app).**
2.  **Import:** Some allowing pasting markdown directly.
3.  **Theme:** Choose a "Dark / Medical" or "Elegant" template. Look for one with Serif headings to match your brand.
4.  **Customize:**
    *   Replace the stock photos with **actual screenshots** of Apothecare.
    *   *Crucial:* Don't use generic "doctor with stethoscope" stock photos. Use your **Real UI** (The Matrix View, The Chat).

## Option C: The "Classic" Route (Keynote/PowerPoint)
Reliable, exportable, and familiar.

1.  **Open Keynote:** Choose the "Editorial" or "Modern Type" theme (Dark mode version).
2.  **Edit Master Slide:**
    *   Change the background to your refined hex code: `#1a2e2a`.
    *   Change fonts to `Georgia` (if you don't have Newsreader installed) and `Arial/Helvetica` for body.
3.  **Content:**
    *   One idea per slide.
    *   Don't paste the "Speaker Notes" onto the slide! Put them in the presenter notes section.

---

## 📸 visual Checklist (What to Capture)

To make the deck real, you need these **3 Key Screenshots** from your app:

1.  **The "Matrix" Shot:** Go to a Visit page (`/visits/[id]`), click the "IFM Matrix" tab. Make sure it has colorful data populated. Screenshot the grid.
2.  **The "Deep Consult" Shot:** Go to the Chat (`/chat`). Ask a complex question. Screenshot the response showing the **Evidence Badges** (RCT, Meta-Analysis).
3.  **The "Scribe" Activity:** Go to a new visit. Show the dictation bar active (waveform visuals if possible) or the "Raw Notes" being transformed.

## 🚀 Final Polish

*   **Export:** Save as PDF for emailing.
*   **Presenting:** Use "Presenter View" so you can read the **Speaker Notes** I wrote for you while the audience sees the slides.
