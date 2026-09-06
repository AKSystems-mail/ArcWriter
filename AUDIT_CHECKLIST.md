# ArcWriter Audit Fix Checklist

**Methodology (every item):**
1. Write the test FIRST. Run it, confirm it FAILS.
2. Apply the fix.
3. Test passes.
4. Run FULL suite (`pytest tests/`) — all green.
5. One commit: `fix: <item> (+test)`. Sideways? `git revert`, item stays open.

**Order:** data-loss first, cosmetics last. Items may be marked WON'T FIX explicitly.

---

## Phase 1 — Data loss / corruption

### [ ] 1. Restore-snapshot concurrency guard
- **Issue:** `restore_snapshot` overwrites `script/content` unconditionally. Two tabs → silent data loss.
- **Test:** `tests/test_restore_guard.py` — save content v2 after snapshot taken; restore must fail/reject when current content changed since snapshot (or merge-guard fires).
- **Fix:** store `content_updated_at` on the script doc; restore rejects with 409 if it's newer than the snapshot's creation unless `force: true`.

### [ ] 2. Blocks payload validation
- **Issue:** `save_snapshot` persists arbitrary JSON as blocks; malformed blob crashes editor on load.
- **Test:** `tests/test_blocks_validation.py` — POST block-less junk (`blocks: "hello"`, `[{"type": "Nope"}]`, missing id) → 422, nothing persisted; valid blocks pass.
- **Fix:** Pydantic model for blocks (`type` in allowed set, non-empty text) applied in `save_snapshot` and the main content-save endpoint.

## Phase 2 — Correctness

### [ ] 3. Snapshot cull race
- **Issue:** read-all-then-delete cull is O(all snapshots), non-transactional; concurrent saves can mis-delete.
- **Test:** `tests/test_snapshot_cull.py` — seed 55 fake snapshots; cull leaves exactly 50 newest, oldest deleted.
- **Fix:** single query `.order_by(created_at, DESCENDING).offset(50)` → delete those docs only.

### [ ] 4. First-10-pages slicing
- **Issue:** hook_scan uses `script_text[:30000]` chars — not 10 pages; verdicts computed on wrong sample.
- **Test:** `tests/test_page_slice.py` — 15-page text (split on form-feed/scene headings) → exactly pages 1–10 passed to analysis.
- **Fix:** split on `\f` if present else scene-heading regex; slice real pages 1–10.

## Phase 3 — Determinism upgrades

### [ ] 5. Reuse parser for manual imports
- **Issue:** PDF path has good heuristic classification; manual/text import doesn't reuse it.
- **Test:** `tests/test_text_import.py` — raw Fountain-ish text → blocks typed correctly (headings via `is_scene_heading`, dialogue by indent).
- **Fix:** extract shared classifier from `script_parser.py`; both paths call it.

### [ ] 6. Velocity curve honesty label
- **Issue:** `velocity_curve` is 10 LLM-invented integers presented as measurement.
- **Test:** `tests/test_velocity_label.py` — response includes `"measured": false` (or equivalent) on velocity data.
- **Fix:** add a field marking it as LLM-estimated; optionally compute page-has-new-character baseline deterministically alongside.

## Phase 4 — Hygiene (cosmetic)

### [ ] 7. Delete `logic_engine_OLD.py`
- **Test:** full suite still green + grep shows zero references repo-wide.
- **Fix:** delete. One commit.

### [ ] 8. Single LogicEngine instance
- **Test:** suite green; module import doesn't re-init per request (assert same instance identity in two calls).
- **Fix:** module-level instance in `logic_engine.py`; routers import it instead of constructing.

### [ ] 9. Replace stray `print()` with logger
- **Test:** grep-based check — no bare `print(` in `app/`.
- **Fix:** swap to `logger.error/warning` matching surrounding style.

---

## Explicitly deferred
- **PDF x-position magic numbers (140/240):** works for standard scripts; revisit only if a bad-parse report arrives.
- **CI pipeline:** shelved portfolio project — local pytest per cycle is enough.
