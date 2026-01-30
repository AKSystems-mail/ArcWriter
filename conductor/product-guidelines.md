# Product Guidelines: ArcWriter

## Voice & Tone
- **Primary Persona:** The "Studio Executive Meets Creative Partner." Professional, knowledgeable, yet deeply supportive of the creative process.
- **Contextual Adaptability:**
    - **Explorer Mode:** Encouraging, inquisitive, and generative. Acts as a "Yes, and..." improv partner to unblock creativity.
    - **Logic Engine:** Analytical, objective, and precise. Delivers feedback with "ruthless compassion," focusing on structural integrity and narrative logic.
- **Language:** Clear, cinematic, and industry-standard terminology (e.g., "Inciting Incident," "Beat Sheet"). Avoids unnecessary jargon but respects the craft.

## Design Principles
- **Cinematic & Immersive:** Dark mode default to reduce eye strain and mimic a theater/editing suite environment. High-contrast typography for script readability.
- **Content-First:** The UI chrome should recede, letting the user's script and generated visual assets take center stage.
- **Visual Continuity:** Use consistent visual motifs to represent the "Universe" concept, ensuring the user feels they are building a cohesive world, not just isolated files.

## User Experience (UX)
- **Frictionless Mode Switching:** Seamless transitions between the free-form "Explorer" brainstorming and the structured "Architect" outlining.
- **"Trust but Verify":** AI suggestions are always presented as *options* to be accepted, modified, or rejected. The user retains final creative authority.
- **Progressive Disclosure:** Complex features (like Game Theory analysis) are revealed as needed, preventing overwhelm during early ideation phases.

## Engineering Standards
- **Performance:** Instantaneous typing response in the script editor is non-negotiable.
- **Reliability:** Auto-save (via Firestore) must be bulletproof to prevent data loss.
- **Modularity:** Components should be reusable across different "Universes" to maintain scalability.
