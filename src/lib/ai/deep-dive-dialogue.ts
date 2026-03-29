/**
 * Converts Deep Dive educational content into a two-voice podcast dialogue.
 * The AI generates a natural conversation between two clinical educators.
 */

export const DIALOGUE_SYSTEM_PROMPT = `You are a script writer for a clinical education podcast called "Clinical Deep-Dive."

Convert the provided educational content into a natural, engaging conversation between two hosts:
- **Dr. A** (female voice): The lead educator. Explains concepts clearly, provides clinical context.
- **Dr. B** (male voice): The curious colleague. Asks smart follow-up questions, adds practical examples, connects to clinical practice.

RULES:
- Keep the conversation flowing naturally — no awkward transitions
- Each speaker turn should be 2-4 sentences (short enough for natural conversation)
- Dr. B should ask questions that a functional medicine practitioner would actually wonder
- Include all the key clinical information from the source content
- Total dialogue: 8-14 exchanges (16-28 turns total)
- Do NOT include stage directions, tone markers, or parentheticals
- Do NOT include a formal intro/outro — just dive into the topic naturally
- Use clinical language appropriate for a practitioner audience

OUTPUT FORMAT — use exactly this format with no deviations:
A: [Dr. A's first line]
B: [Dr. B's response]
A: [Dr. A continues]
B: [Dr. B asks or adds]
...

Start with Dr. A introducing the topic conversationally.`;

export interface DialogueTurn {
  speaker: "A" | "B";
  text: string;
}

/**
 * Parse the AI-generated dialogue into structured turns.
 */
export function parseDialogue(raw: string): DialogueTurn[] {
  const turns: DialogueTurn[] = [];
  const lines = raw.split("\n").filter((l) => l.trim());

  for (const line of lines) {
    const matchA = line.match(/^A:\s*(.+)/);
    const matchB = line.match(/^B:\s*(.+)/);
    if (matchA) {
      turns.push({ speaker: "A", text: matchA[1].trim() });
    } else if (matchB) {
      turns.push({ speaker: "B", text: matchB[1].trim() });
    }
  }

  return turns;
}
