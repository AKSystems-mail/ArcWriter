# GEMINI.md

## Project Status (March 10, 2026) - PRODUCTION HARDENED & VISUAL UPGRADE
- **Visual Engine Upgrade COMPLETE**: 
    - Switched to **Gemini 3.1 Flash Image Preview** for posters and character anchors.
    - Upgraded to **Veo 3.0 Standard** (`veo-3.0-generate-001`) for reliable, 8-second cinematic motion teasers with native audio.
    - Implemented **Visual DNA Mandates**: `LogicEngine` now requires physical and racial details in character descriptions to ensure 100% accurate AI rendering.
    - **Legal Safeguards**: Added strict negative constraints to prevent celebrity likenesses or real studio logos in generated assets.
- **Authentication & Security COMPLETE**:
    - Resolved Google Sign-In issues on the custom domain by migrating `authDomain` to `arcwriter.us`.
    - Fixed the "Dangerous Site" warning chain by finalizing domain authorization in Firebase and Cloud Console.
    - **Security Policy**: Updated `firebase.json` to `same-origin-allow-popups-to-escape-sandbox` to fix the OAuth popup blocking issue.
    - **Storage Rules**: Updated to allow direct client-side uploads to `/posters` and `/character_anchors` for authenticated users.
- **Instant Help System COMPLETE**:
    - Implemented in-memory caching for the Screenwriter's Guide PDF (near-zero latency download).
    - Added background pre-fetching for all help icons; screenplay-style help sections now appear instantly.
    - **Code Stability**: Renamed `ContextualHelp.tsx` to `.jsx` to resolve production bundling `ReferenceError`.
- **Insight Persistence COMPLETE**:
    -   Implemented state synchronization for all script analysis tools (Scene Diagnostic, Macro Structural Audit, Hook Scan).
    -   Results are now stored in Firestore under the `insights` field of the project document.
- **Fortress Protocol & Secure Sharing COMPLETE (Local)**:
    -   **Industry Title Page**: Professional Courier-font title pages with WGA registration and legal footers.
    -   **Dynamic Watermarking**: Anti-leak diagonal watermarks embedded in PDF exports and web viewer.
    -   **Interactive Pitch Deck**: Standalone mobile-optimized web viewer (`/pitch/:hash`) with cinematic hero assets and distraction-free script reader.
    -   **Anti-Copy Engine**: Frontend protection blocking right-click, text selection, and keyboard shortcuts.
    -   **Share Logic**: Random hash-based URLs with optional password protection and expiration dates.
- **UI/UX Polishing**:
    - **Login**: Added "Back to Landing" navigation and clickable logo.
    - **Dashboard**: Fixed "Active Assets" visibility with real-time `onSnapshot` listeners and resolved visual clipping on the header.
    - **Credits**: Standardized to **25 Starter Credits** across the entire stack.

## Technical Architecture
- **Motion Engine**: Veo 3.0 Standard (`veo-3.0-generate-001`) via `google-genai` SDK.
- **Image Engine**: Gemini 3.1 Flash Image Preview.
- **Async Strategy**: Backend returns `operation_id`; positional argument syntax implemented for `operations.get()`.
- **Auth**: Production-ready 1st-party domain setup (`arcwriter.us`).

## Documentation Maintenance
- **Screenwriter's Guide**: The file `backend/Screenwriter_Guide.md` serves as the single source of truth for the studio's help system. Whenever a new feature is added or a workflow is modified, this file **MUST** be updated.
- **Consistency**: Maintain the established screenplay format (INT./EXT. sluglines, character names, dialogue blocks) within the guide to ensure the automated PDF generator and contextual help system function correctly.

## How to Run
1. **Backend**: `cd backend && uvicorn main:app --host 0.0.0.0 --port 5000`
2. **Frontend**: `cd frontend && npm run build && npx firebase-tools deploy`

## Next Steps
- Implement 'Page Break' visual lines in the Editor for the 40-line pagination standard.
- Audit and remove remaining development `console.log` statements.
- Monitor Veo 3.0 quota usage for the "Studio Pass" (600 credits) tier.
