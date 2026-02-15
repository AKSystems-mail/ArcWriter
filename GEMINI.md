# GEMINI.md

## Project Status (Feb 14, 2026)
- **Visual Aesthetic**: Fixed 502/SSL errors in image generation. Now using a 'Direct Buffer' upload method for Art Department assets.
- **Onboarding**: Renamed loading text to 'Analyzing Narrative Core...' and implemented 'Smart Clearing' for Cinematic Universes.
- **Editor**: Implemented 'Option B' (Hardened Block Engine).
    - **Visuals**: Invisible transitions between script blocks for a unified page feel.
    - **Formatting**: Professional standard margins (1.5" Left, 1" Top/Bottom/Right).
    - **UX**: Seamless block merging on backspace and auto-porting of existing PDFs into the editor.
- **Logic Engine**: Now using Gemini 2.5 Pro for project distillation to ensure 100% beat sheet accuracy.

## How to Run
1. **Backend**: `cd backend && uvicorn main:app --host 0.0.0.0 --port 5000`
2. **Frontend**: `cd frontend && npm run dev`
3. **Deployment**: `npx firebase-tools deploy`

## Next Steps
- Audit and remove remaining development `console.log` statements.
- Revert credits from 99,999 to 99 for production readiness.
- Implement 'Page Break' visual lines in the Editor when blocks exceed the 11" vertical limit.