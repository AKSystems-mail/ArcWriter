# pending_actions.md — Proposals Awaiting Human Review

Board proposals accumulate here. Nothing in this file has been executed. All items are proposed changes for the founder to Approve / Deny / Delay. Do not write to production.

---

## 2026-08-31 — proposals from board meeting #8 (fork day 9, deadline 09-06)

### HITL (need explicit approval — irreversible or >$50)
1. **[HITL #1] Pick a lane: revive vs. shelve ArcWriter.**
   - Approve = revive: generate fresh service-account key for arc-studio-box, deploy backend (`firebase deploy --only functions:api,hosting`), run 30-day revive test (live backend + win-back email to 9 external signups; shelve formally if zero engagement).
   - Deny = shelve: point arcwriter.us at ScoutBoard, archive repo, close queue.
   - Deadline: 09-06 (6 days). No decision = board defaults to shelve (reversible, $0).
2. **[HITL #2] Secrets scrub (does not wait on #1):** `git rm --cached backend/serviceAccountKey.json frontend/.env.production` + `git filter-repo` history rewrite on public repo. Irreversible → HITL. $0.

### Recommended (no approval needed, but not executed by the board)
3. Wire Stripe visibility (STRIPE_SECRET_KEY on this box, or Stripe CLI) — unblocks CFO.
4. Commit AUDIT_CHECKLIST.md (untracked revive roadmap / shelving doc) — own commit.
5. Housekeeping: delete `test_user_writer_room_001`; clear stale `subscription_status=active` on aksystems.mail + starrwulfe (both plan=free); add README status note.
6. [Gated on #1 Approve] Win-back email to 9 external signups.
7. [Gated on #1 Approve] Restart coverage lead magnet.

## 2026-09-02 — proposals from board meeting #9 (fork day 11, deadline 09-06 in 4 days)

HITL #1 (lane decision) and HITL #2 (secrets scrub) carry forward unchanged from 2026-08-31 — both $0, both still awaiting review.

### New this meeting
8. Delete orphaned ScoutBoard backend from arc-studio-box (analyzeResume, generateKit, suggestProfileFromResume, scoutChat, scoutFetchJob, requestScoutNow, sendFeedback — verify deleteAccount + ext-firestore-send-email first). Same functions are live on scoutboard-io; the arc-studio-box copies are duplicates from an earlier deployment. $0, reversible by redeploy.

## 2026-09-03 — proposals from board meeting (fork day 12, deadline 09-06 in 3 days)

HITL #1 (lane decision) and HITL #2 (secrets scrub) carry forward unchanged from 2026-08-31 — both $0, both still awaiting review. Re-verified today: `git ls-files` shows backend/serviceAccountKey.json + frontend/.env.production still tracked in the public repo.

### New this meeting
9. Commit or discard ~3 months of uncommitted local edits (backend/app/services/asset_studio.py, llm_service.py, backend/tests/test_asset_studio.py, GEMINI.md, frontend/dist + package-locks; AUDIT_CHECKLIST.md still untracked). Nothing committed since 06-06 — data-loss risk. $0, reversible (local commit).

## 2026-09-05 — board meeting (fork day 14; lane-decision deadline 09-06 is TOMORROW)

HITL #1 (lane decision) — **deadline expires end of day tomorrow, 09-06.** No decision by then = board default executes: shelve (point arcwriter.us at ScoutBoard, archive repo, close queue). Founder has never responded to any of the 14 daily asks. Approve (revive) still open: fresh service key + `firebase deploy` + 30-day revive test.
HITL #2 (secrets scrub) — carries forward; re-verified TODAY via `git ls-files`: backend/serviceAccountKey.json + frontend/.env.production still tracked; origin HEAD unchanged (4a7de22, Jun 6). GitHub secret_scanning disabled on repo.

### New this meeting
10. Correction: 09-04 queue said feedback collection is "empty" — it has 6 docs, but ALL are founder self-tests (user aksystems.mail@gmail.com, Mar 29–Apr 2 2026, incl. one resolved blank-editor bug). Zero real-user entries. Action (Low): decide whether widget is visible to real users once lane decision lands.
11. Re-verified (no new action): Stripe key still absent from env (CFO blind); users=10, leads=12 (Firestore counts); repo untouched since Jun 6 (GitHub API pushed_at + origin HEAD match).

## 2026-09-06 — board meeting (fork day 15; lane-decision deadline TODAY)

**Deadline status:** The 09-06 deadline set 08-30 has arrived. HITL #1 (lane decision) has never received a response across 15 daily meetings. Standing default = SHELVE, but per governance the board does NOT write to production — the default does not execute itself. It remains HITL #1, re-presented: reply "revive" (fresh service key + firebase deploy + 30-day test) or "shelve" (repoint arcwriter.us at ScoutBoard, archive repo, close queue) or "extend" (new deadline). All $0, all reversible.
HITL #2 (secrets scrub) — carries forward; re-verified TODAY via `git ls-files` (both files still tracked) + GitHub security_and_analysis API (secret scanning, push protection, dependabot all disabled). Public ~3 months now.

### New this meeting
12. Re-verified flat: users=10, leads=12, feedback=6, mail_queue=19 (live Firestore counts); repo pushed_at Jun 6 / origin HEAD 4a7de22 unchanged; no Stripe key in env; `api` function still absent from arc-studio-box; 7 ScoutBoard orphan callables re-listed.
13. Ops note (no action): host rebooted ~19:25 EDT 09-05 — uptime 13h37 at meeting time; daily cron and all checks healthy post-restart.
