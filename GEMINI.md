# GEMINI.md

## Project Status (March 5, 2026) - STABILITY & WORKFLOW HARDENING
- **CRITICAL FIX: Authenticated Session Crash**: Resolved a "blank site" issue where returning users (who were already authenticated and had existing projects) would trigger a React crash on the Dashboard.
    - **Root Cause**: Missing `onSnapshot` import in `frontend/src/pages/Dashboard.tsx`.
    - **Fix**: Corrected Firestore imports and verified build stability.
- **Production Buffer Pipeline**: Implemented a new deployment strategy. 
    1. Push to GitHub for version control.
    2. Local Preview on port 5173 for manual sanity checks.
    3. Firebase Deploy only after manual approval.
- **Environment Stabilization**: Cleaned and reinstalled frontend `node_modules` to resolve platform-specific Rollup binary errors on macOS.

## Project Status (Feb 22, 2026) - PRODUCTION READY PITCH SUITE
- **Step 8: Character Locking COMPLETE**: Implemented a 4-variant cinematic selection gallery with immediate "LOCKING ANCHOR..." visual feedback.
- **Step 9: Production Assets COMPLETE**: 
    - **Consistent Posters**: The AI now uses Locked Character Anchors as visual references for Official Poster rendering, ensuring cast consistency.
    - **Cinematic Teasers**: Integrated **Veo 3.0 Fast (Stable GA)** motion engine for 8-second widescreen (16:9) clips with native synchronized audio.
    - **Async Motion Pipeline**: Overhauled video generation to use an Asynchronous workflow (Immediate ID + Client-side Polling) to eliminate 502 Bad Gateway timeouts.
- **Mobile Pitch Deck**: Overhauled the Blueprint page for mobile screens. It now functions as an "on-the-spot" presentation tool with real project assets, parsed story summaries, and playable teasers.
- **Phase 5: The Deliverable COMPLETE**: 
    - Built a high-fidelity PDF Export engine that compiles a 4-part pitch package (Poster, Story/Teaser QR, Cast Dossiers, Full Script).
    - Implemented "Glow" logic for the master export button (Arc-Orange trigger at 100% completion).
- **Cinematic Help System**: Initialized the "Manual as a Script" strategy. Features a downloadable PDF manual in screenplay format and a cinematic "Lost Plot" 404 experience.

## Technical Architecture
- **Motion Engine**: Veo 3.0 Fast (Stable GA) via `google-genai` SDK.
- **Async Strategy**: Backend returns `operation_id` immediately; Frontend polls `/api/assets/teaser_status?operation_id=...&t=...` (cache-busting).
- **Visuals**: Posters (2:3 vertical); Teasers (16:9 landscape; 8s duration); Character Anchors (1:1 square).
- **PDF Core**: `reportlab` + `qrcode` for teaser linking.

## Incident Report: Motion Rendering Upgrade (March 10, 2026)
### Issues Encountered
1.  **Model Name 404**: Attempting to use `veo-3.1-fast-generate-001` resulted in a `NOT_FOUND` error. The model is currently unavailable or unsupported via the `v1beta` API version used by the current project configuration.
2.  **Unsupported `generate_audio` Parameter**: Explicitly setting `generate_audio=True` in `GenerateVideosConfig` triggered a 500 error ("generate_audio parameter is not supported in Gemini API").
3.  **Polling Crash (`AttributeError`)**: The backend `get_operation_status` previously used an `OperationNameWrapper` which caused an `AttributeError` during status checks, leading to silent failures and "hanging" renders.
4.  **UI State Deadlock**: The frontend polling logic in `VisualsStudio.jsx` did not recognize terminal error states (`status: 'error'`), causing the UI to stay in "Rendering..." mode indefinitely even after a backend failure.

### Troubleshooting & Resolutions
- **Model Choice**: Stabilized on `veo-3.0-fast-generate-001`. It supports 8-second renders and multimodal audio.
- **Audio Strategy**: Replaced the explicit parameter with **Prompt Engineering**. A genre-aware "Audio Footer" (e.g., `Audio: Dark ambient synth-wave...`) is appended to the video prompt to trigger native audio generation.
- **Polling Fix**: Updated `backend/app/services/asset_studio.py` to pass raw `operation_id` strings directly to `client.operations.get(name=operation_id)`.
- **Error Handling**: 
    - **Backend**: `get_operation_status` now always returns `done: True` even on errors, ensuring the frontend stops polling.
    - **Frontend**: `pollTeaserStatus` now clears intervals and alerts the user upon detecting `status: 'error'`.
- **Logs**: Added specific `Initializing Teaser` and `Teaser Operation Created` info logs in `main.py` for end-to-end visibility.

## Documentation Maintenance
- **Screenwriter's Guide**: The file `backend/Screenwriter_Guide.md` serves as the single source of truth for the studio's help system. Whenever a new feature is added or a workflow is modified, this file **MUST** be updated.
- **Consistency**: Maintain the established screenplay format (INT./EXT. sluglines, character names, dialogue blocks) within the guide to ensure the automated PDF generator and contextual help system function correctly.

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
