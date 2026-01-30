# Implementation Plan - Production Hardening and Beta Polish

## Phase 1: Critical Fixes & Cleanup
- [ ] Task: Fix "Blank Screen" Crash in Script Editor
    - [ ] Sub-task: Import `ChevronRight` in `ScriptEditor.jsx` (Completed).
    - [ ] Sub-task: Verify no other missing imports in key components.
- [ ] Task: Fix Firestore Index Errors
    - [ ] Sub-task: Add `COLLECTION_GROUP` index for `projects` (`owner_id` ASC) to `firestore.indexes.json` (Completed).
    - [ ] Sub-task: Deploy Firestore indexes (`firebase deploy --only firestore:indexes`).
- [ ] Task: Resolve Uncommitted Changes
    - [ ] Sub-task: Review and commit valid changes in `frontend/src`.
    - [ ] Sub-task: Clean up temporary files or logs in `backend/` and root.

## Phase 2: Editor Optimization
- [ ] Task: Optimize ScriptEditor Performance
    - [ ] Sub-task: Audit `ScriptEditor.jsx` for excessive re-renders.
    - [ ] Sub-task: Implement `useMemo` or `useCallback` for heavy handlers.
- [ ] Task: Verify Magic Wand Tool
    - [ ] Sub-task: Ensure the dropdown menu works correctly.
    - [ ] Sub-task: Verify AI suggestions are correctly inserted.

## Phase 3: Final Verification
- [ ] Task: Full End-to-End Test
    - [ ] Sub-task: Create a new user (Explorer Mode).
    - [ ] Sub-task: Complete Onboarding.
    - [ ] Sub-task: Generate a Beat Sheet.
    - [ ] Sub-task: Edit a Script.
- [ ] Task: Conductor - User Manual Verification 'Final Verification' (Protocol in workflow.md)
