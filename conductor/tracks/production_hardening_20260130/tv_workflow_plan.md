# TV Series Workflow Implementation Plan

## Objective
Enable a full TV Series workflow in ArcWriter, allowing users to choose "Series Production" during onboarding. This will trigger TV-specific act structures (Cold Open, Acts 1-5, Tag) and prepare the system for episodic continuity within a Cinematic Universe.

## Key Changes

### 1. Backend: Logic Engine (`backend/app/services/logic_engine.py`)
- Update `generate_project_metadata` to accept a `format` parameter (`movie` or `tv_series`).
- Update the system prompt for `tv_series` to request a TV Act Structure (Cold Open, Acts 1-5, Tag) instead of 15 beats.
- Update `distill_notes` and `reverse_engineer_script` to pass the format if available.

### 2. Backend: Onboarding Router (`backend/app/routers/onboarding.py`)
- Update `PitchRequest` and `SetupRequest` models to include a `format` field.
- Ensure `initialize_project` and `finalize_onboarding` handle and save the `format` field to Firestore.
- In `finalize_onboarding`, ensure the "Project Bible" content reflects the episodic nature if `format == 'tv_series'`.

### 3. Frontend: Onboarding Wizard (`frontend/src/pages/OnboardingWizard.jsx`)
- Change the "TV Showrunner's Guide" button to **"Series Production"**.
- Update the trigger to:
    - Set `data.format = 'tv_series'`.
    - **Lock `data.mode = 'explorer'`**: This ensures the AI uses flexible episodic structures.
    - Transition directly to **Step 2 (Ingestion)**.
- Pass the `format` field in all API calls to the onboarding endpoints.

### 4. Frontend: Architect & Beat Sheet (`frontend/src/pages/Architect.jsx` & `frontend/src/components/BeatSheetForm.jsx`)
- Detect the `format` from `projectData`.
- If `format === 'tv_series'`, dynamically change the labels in `BeatSheetForm` to reflect TV Acts instead of movie beats.

### 5. Frontend: Dashboard (`frontend/src/pages/Dashboard.tsx`)
- (Optional but recommended) Add a visual indicator (badge) for TV Series projects.

## Verification Plan

### Manual Testing
1. **Onboarding**: Start a new project, select "Series Production".
2. **Analysis**: Enter a TV pilot pitch (e.g., "A 30-min sitcom about...").
3. **Validation**: Confirm the generated Blueprint has acts like "Cold Open" and "Act 1" instead of "Opening Image" and "Theme Stated".
4. **Finalization**: Confirm the project is saved with `format: 'tv_series'`.
5. **Architect View**: Open the Blueprint and verify the act labels are correct.

### Automated Testing
- Add a unit test in `backend/tests/test_logic_engine.py` to verify that `generate_project_metadata` returns the correct keys for `tv_series`.
