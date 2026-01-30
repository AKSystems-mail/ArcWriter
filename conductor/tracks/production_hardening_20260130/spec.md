# Specification: Production Hardening and Beta Polish

## 1. Overview
This track focuses on stabilizing the application for production release. The primary goals are to resolve uncommitted changes, fix critical UI bugs (like the "blank screen" crash), ensure correct Firestore indexing, and optimize the Script Editor's performance.

## 2. Goals
- **Stability:** Eliminate crash-causing bugs (ReferenceErrors, null pointer exceptions).
- **Data Integrity:** Ensure all Firestore queries are properly indexed and performant.
- **Clean Code:** Commit or stash all pending changes and remove unused imports/variables.
- **Performance:** Optimize the Script Editor for instant typing response.

## 3. Scope
- **Frontend:**
    - Fix missing imports (e.g., `ChevronRight`).
    - Audit console logs for other errors.
    - Optimize re-renders in `ScriptEditor`.
- **Backend/Infrastructure:**
    - Update `firestore.indexes.json` with required composite/collection-group indexes.
    - Verify Cloud Functions deployment status.
- **QA:**
    - Verify "Onboarding" -> "Editor" flow.
    - Verify "Magic Wand" functionality.

## 4. Out of Scope
- New feature development (e.g., new AI modes).
- Major UI redesigns.
