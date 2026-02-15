# Implementation Plan - Production Hardening and Beta Polish

## Phase 1: Foundation & Infrastructure (COMPLETED)
- [x] Task: Stabilization of Cloud Deployments
    - [x] Sub-task: Implement "Lazy Initialization" in `main.py` to pass container health checks.
    - [x] Sub-task: Fix 404/422 routing errors in onboarding and script API endpoints.
- [x] Task: LLM Migration & Cost Optimization
    - [x] Sub-task: Migrate to `google-genai` SDK.
    - [x] Sub-task: Configure Gemini 2.5 Flash for fast tasks and 2.5 Pro for analysis.
- [x] Task: Developer Experience (Testing)
    - [x] Sub-task: Set default starting credits to 99,999 for debugging.
    - [x] Sub-task: Implement clear "Exit to Dashboard" navigation in Editor.

## Phase 2: Editor Overhaul & Smart Features (COMPLETED)
- [x] Task: Industry-Standard Formatting
    - [x] Sub-task: Implement 1.5" Left margin and 1" Top/Bottom/Right margins.
    - [x] Sub-task: Implement auto-resizing text blocks to prevent ghosting/overlapping.
- [x] Task: Smart Memory System
    - [x] Sub-task: Character Name autocomplete from Universe Cast.
    - [x] Sub-task: Location autocomplete from script history.
- [x] Task: UX Efficiency
    - [x] Sub-task: Keyboard shortcuts (Cmd/Ctrl + 1-5) for screenplay types.
    - [x] Sub-task: Fix formatting button activation on initial load.

## Phase 3: Narrative Intelligence (COMPLETED)
- [x] Task: Gatekeeper Audit
    - [x] Sub-task: Implement First 10 Pages scan (Theme, Motivation, Tone, Catalyst).
    - [x] Sub-task: Add Sidebar UI for "READ/PASS" verdict and pillar scoring.
- [x] Task: Continuity & Context
    - [x] Sub-task: Implement Universe-wide continuity scans (cross-project checks).
    - [x] Sub-task: Upgrade Draft Assist to read previous script context for tone matching.
- [x] Task: Literary Device Engine
    - [x] Sub-task: Integrate 10-point audit (Chekhov's Gun, Save the Cat, Subtext, etc.).

## Phase 4: Studio Management (COMPLETED)
- [x] Task: Thematic Archive System
    - [x] Sub-task: Implement "The Cutting Room Floor" (Soft Delete).
    - [x] Sub-task: Implement "Point of No Return" (Permanent Delete with name verification).
- [x] Task: Universe Expansion
    - [x] Sub-task: Add Universe selection/creation dropdown to the Wizard.
    - [x] Sub-task: Enable Project title editing directly from the Dashboard.

## Phase 5: Final Polish & Production Readiness (IN PROGRESS)
- [ ] Task: Production Readiness Checklist
    - [ ] Sub-task: Revert default credits to 99.
    - [ ] Sub-task: Review and clean up all `console.log` statements (Started).
    - [ ] Sub-task: Verify stable asset generation fallback (Imagen -> @002).
- [ ] Task: Final End-to-End Verification
    - [ ] Sub-task: Conduct full "Explorer" walk-through from pitch to scene.
    - [ ] Sub-task: Conduct full "Architect" walk-through from notes to beat sheet.
- [ ] Task: Documentation Finalization
    - [ ] Sub-task: Update User Manual / README for the 2026 features.