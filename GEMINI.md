# GEMINI.md

## Project Status (Feb 16, 2026)
- **Visual Aesthetic**: Migrated to a frontend-led asset pipeline. Backend returns Base64; Frontend handles Storage upload and Firestore sync. Resolved SSL/Timeout issues.
- **Onboarding**: Integrated "Blueprint Summary" step for manual verification of AI-distilled Story DNA before project creation.
- **Editor**: Fully functional block-based engine with industry-standard margins and seamless navigation.
- **Logic Engine**: Upgraded to **Gemini 2.0 Flash**. Implemented a "Triple-Fail-Safe" initialization path (Vertex AI -> API Key Fallback) to ensure 100% uptime.

## How to Run
1. **Backend**: `cd backend && uvicorn main:app --host 0.0.0.0 --port 5000`
2. **Frontend**: `cd frontend && npm run dev`
3. **Deployment**: `npx firebase-tools deploy`

## Next Steps
- **Image Model Upgrade**: Upgrade from `imagegeneration@002` to `imagen-3.0-generate-001` (or latest) once Vertex AI permissions are finalized to resolve garbled text issues.
- Audit and remove remaining development `console.log` statements.
- Revert credits from 99,999 to 99 for production readiness.
- Implement 'Page Break' visual lines in the Editor when blocks exceed the 11" vertical limit.