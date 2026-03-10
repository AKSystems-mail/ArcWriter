# Copilot Instructions for ArcWriter

## Overview
Arc is an AI-powered SaaS platform for film development. It guides screenwriters through narrative structure (via Gemini 1.5 Pro logic engine) and generates cinematic media assets (posters, teasers, character anchors via Veo 3.0). The system combines a React frontend with a Python/FastAPI backend, using Firestore for data persistence and Google's Genkit/AI Platform for LLM operations.

## Quick Commands

### Frontend (React + Vite + Tailwind)
```bash
cd frontend
npm install                    # Install dependencies
npm run dev                    # Start dev server (http://localhost:5173)
npm run build                  # Build for production
npm run lint                   # Run ESLint
```

### Backend (Python + FastAPI)
```bash
cd backend
pip install -r requirements.txt # Install dependencies
uvicorn main:app --host 0.0.0.0 --port 5000  # Start server
```

### Deployment
```bash
# Test locally before deploying
npx firebase-tools deploy      # Deploy to Firebase (frontend + backend functions)
```

### Current Testing Status
No automated test suite exists. All testing is manual. After code changes:
- Frontend: Preview locally on port 5173 for UI/routing behavior
- Backend: Test API endpoints with curl or REST client before Firebase deployment

## Architecture

### High-Level Data Flow
1. **User Authentication**: Firebase Auth (Google + Email/Password)
2. **Project Creation**: User goes through Onboarding Wizard → selects Explorer (mood-first) or Architect (structure-first) mode
3. **Story DNA**: Logline/pitch is analyzed by backend LLM to generate 15 narrative beats
4. **Script Editing**: Real-time Firestore sync via `onSnapshot` listeners
5. **Asset Generation**: Backend requests to Veo 3.0 return operation IDs; frontend polls for results asynchronously
6. **PDF Export**: `reportlab` + `qrcode` compile a 4-part pitch package

### Directory Structure
```
frontend/
  src/
    pages/          # Route components: Dashboard, Architect, ScriptEditorPage, etc.
    components/     # Reusable UI: ScriptEditor, VisualsStudio, PitchDeckGallery, etc.
    utils/          # Utilities: formatUtils.js for screenplay formatting
    firebase.js     # Firebase config & exports
    App.jsx         # Main router & TrafficController
    index.css       # Tailwind + custom Arc theme

backend/
  main.py           # FastAPI app with lazy ServiceRegistry
  app/
    routers/        # FastAPI route groups: onboarding, script, pitchdeck, users, billing, manual, public, bible
    services/       # Business logic: logic_engine, asset_studio, pdf_service, rag_service, stripe_service, etc.
    utils/          # Helpers: firebase_auth_utils, storage_utils
    models/         # Pydantic models (if used)
    prompts/        # LLM system prompts
```

### Key Services (Lazy Loaded)
All services are instantiated on-demand via `ServiceRegistry` in main.py:

- **LogicEngine**: Game theory stress-testing of story beats; outputs Logic Score
- **AssetStudio**: Generates character anchors (1:1), posters (2:3), teasers (16:9, 8s). Returns operation IDs for async polling
- **PDFService**: Compiles pitch deck using reportlab; embeds QR codes linking to teasers
- **RagService**: Firestore vector search for "Universe" (Project Bible) context retrieval
- **StripeService**: Subscription management (credits, plan upgrades)
- **UserService**: User profile & credit balance queries

## Core Conventions

### Firestore Schema Patterns
- **Collections**: `users/`, `projects/`, `universes/` (top-level)
- **Subcollections**: `projects/{projectId}/scenes`, `universes/{universeId}/characters`
- **Auth**: Always verify `owner_id == auth.uid` before returning user data
- **Real-time Sync**: Frontend uses `onSnapshot` listeners for live updates; backend never pushes (REST only)

### Frontend Styling
- **CSS Framework**: Tailwind CSS
- **Theme**: Arc-specific colors (e.g., `arc-teal`, `arc-orange`, `obsidian-black`) defined in `index.css`
- **Icons**: Lucide React (e.g., `ChevronRight`, `Save`, `Target`)
- **No CSS-in-JS**: Use class-based Tailwind exclusively

### Backend API Conventions
- **Routes**: Grouped by domain (e.g., `/api/script/*`, `/api/assets/*`, `/api/onboarding/*`)
- **Auth Headers**: Expect `Authorization: Bearer <Firebase ID Token>` for protected routes
- **Async Operations**: Long-running tasks (video, poster generation) return `{"operation_id": "..."}` immediately; client polls `/api/assets/teaser_status?operation_id=...&t=...` (t=timestamp for cache-busting)
- **CORS**: Configured for localhost:5173, Firebase hosting domains, and arcwriter.us

### Screenplay Format & Pagination
- **Editor Page Breaks**: Standard 40-line pagination
- **Screenplay Syntax**: INT./EXT. sluglines, character names (CAPS), dialogue blocks
- **Screenwriter's Guide**: Located at `backend/Screenwriter_Guide.md` — single source of truth for help system. Update this whenever features change.

### Important Imports & Patterns

**Frontend:**
```javascript
// Firestore real-time sync (critical for live updates)
import { onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';

// Routing & navigation
import { useNavigate, useLocation } from 'react-router-dom';

// Utility for screenplay formatting
import { formatLine } from '../utils/formatUtils';
```

**Backend:**
```python
# Always use lazy loading pattern via ServiceRegistry
services.logic_engine.analyze_beats(...)
services.asset_studio.generate_poster(...)

# Firebase auth verification
from app.utils.firebase_auth_utils import verify_token, verify_project_ownership, get_current_user
```

## Critical Fixes & Known Issues

### Authenticated Session Crash (Fixed Mar 5, 2026)
- **Issue**: Returning users (with existing projects) would see blank site + React crash on Dashboard
- **Root Cause**: Missing `onSnapshot` import in `frontend/src/pages/Dashboard.tsx`
- **Resolution**: Ensure all Firestore real-time listeners import `onSnapshot` explicitly
- **Prevention**: Always import `onSnapshot` when using real-time listeners in new components

### Async Teaser Generation (Fixed Feb 22, 2026)
- **Issue**: 502 Bad Gateway timeouts on video generation
- **Solution**: Moved to immediate operation ID + client-side polling pattern
- **Implementation**: Backend returns `operation_id` instantly; frontend polls `/api/assets/teaser_status?operation_id=...&t=...` every 2-3s until `status == "completed"`

### Platform-Specific Node Build Errors
- **Issue**: Rollup binary errors on macOS
- **Solution**: Clean reinstall: `rm -rf frontend/node_modules && npm install`
- **Prevention**: Use `npm ci` in CI/CD for reproducible builds

## Deployment Pipeline

1. **Code Review & Testing**: Commit and push to GitHub
2. **Local Preview**: Run `npm run dev` (frontend) and `uvicorn` (backend) on ports 5173 & 5000
3. **Manual Sanity Checks**: Test key flows (auth, project creation, asset generation, PDF export)
4. **Firebase Deploy**: `npx firebase-tools deploy` (only after manual approval)

**Baseline Commit**: `ec368ec` (stable, all features working)

## Next Steps & Cleanup Tasks
- Implement page break visual lines in Script Editor (40-line standard)
- Audit and remove development `console.log` statements
- Revert test credits from 99,999 to 99 for production readiness

## Documentation
- **GEMINI.md**: Project status & feature timeline
- **README.md**: Public overview of Arc platform
- **ARCWITER_WORKFLOW.md**: Detailed workflow (ACT 0–5, all user-facing flows)
- **Screenwriter_Guide.md**: Help system source of truth (screenplay format; update when features change)
