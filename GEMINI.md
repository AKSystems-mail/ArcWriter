# GEMINI.md

## Project Status (Feb 22, 2026) - PRODUCTION READY PITCH SUITE
- **Step 8: Character Locking COMPLETE**: Implemented a 4-variant cinematic selection gallery with immediate "LOCKING ANCHOR..." visual feedback.
- **Step 9: Production Assets COMPLETE**: 
    - **Consistent Posters**: The AI now uses Locked Character Anchors as visual references for Official Poster rendering, ensuring cast consistency.
    - **Cinematic Teasers**: Integrated **Veo 2.0 (Stable GA)** motion engine for 5-second widescreen (16:9) clips.
    - **Async Motion Pipeline**: Overhauled video generation to use an Asynchronous workflow (Immediate ID + Client-side Polling) to eliminate 502 Bad Gateway timeouts.
- **Mobile Pitch Deck**: Overhauled the Blueprint page for mobile screens. It now functions as an "on-the-spot" presentation tool with real project assets, parsed story summaries, and playable teasers.
- **Phase 5: The Deliverable COMPLETE**: 
    - Built a high-fidelity PDF Export engine that compiles a 4-part pitch package (Poster, Story/Teaser QR, Cast Dossiers, Full Script).
    - Implemented "Glow" logic for the master export button (Arc-Orange trigger at 100% completion).
- **Cinematic Help System**: Initialized the "Manual as a Script" strategy. Features a downloadable PDF manual in screenplay format and a cinematic "Lost Plot" 404 experience.

## Technical Architecture
- **Motion Engine**: Veo 2.0 (Stable GA) via `google-genai` SDK.
- **Async Strategy**: Backend returns `operation_id` immediately; Frontend polls `/api/assets/teaser_status?operation_id=...&t=...` (cache-busting).
- **Visuals**: Posters (2:3 vertical); Teasers (16:9 landscape); Character Anchors (1:1 square).
- **PDF Core**: `reportlab` + `qrcode` for teaser linking.

## How to Run
1. **Backend**: `cd backend && uvicorn main:app --host 0.0.0.0 --port 5000`
2. **Frontend**: `cd frontend && npm run dev`
3. **Deployment**: `npx firebase-tools deploy`

## Git Baseline
- **Commit**: `ec368ec` (Stable Baseline)
- **Status**: Visuals Studio and Pitch Package are now fully operational.

## Next Steps
- Implement 'Page Break' visual lines in the Editor for the 40-line pagination standard.
- Audit and remove remaining development `console.log` statements.
- Revert credits from 99,999 to 99 for production readiness.
