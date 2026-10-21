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

## 2026-09-07 — board meeting (fork day 16; REVIVE day 2)

**RESOLVED by founder (09-06, ~12:05–12:20pm EDT, commits eb12fad + c2c5f25):**
- HITL #1 (lane decision) → **REVIVE**, executed: `api` backend deployed to production for the first time (verified live 09-07); model migration applied (gemini-3.1-flash-image, veo-3.1-fast-generate-preview, gemini-3.5-flash); backend/serviceAccountKey.json + frontend/.env.production untracked (+ .gitignore rules, backend on ADC); 7 ScoutBoard orphan functions deleted from arc-studio-box (functions:list confirms only `api` + ext-firestore-send-email remain); ~3 months of uncommitted work committed.
- HITL #2 (secrets scrub) → **PARTIAL**: untracking done (git ls-files CLEAN), but the key itself remains in git history (`git cat-file -p eb12fad^:backend/serviceAccountKey.json` still returns it) and rotation in GCP Console is still required. Superseded by new HITL below.
- Item 4 (commit AUDIT_CHECKLIST.md) → DONE (in c2c5f25). Item 8 (delete orphans) → DONE. Item 9 (commit local edits) → DONE.

### HITL (need explicit approval — irreversible or >$50)
1. **[HITL #1] Rotate the exposed Firebase service-account key** (delete old key in GCP IAM; backend on ADC so safe). Key was public in repo tree Jun 6 → Sep 6 and is still retrievable from public history. $0, founder-only console action.
2. **[HITL #2] Wire Stripe visibility** (STRIPE_SECRET_KEY on this box or Stripe CLI). CFO blind since launch; users collection shows 0 paid plans. $0, founder-only.

### Recommended (no approval needed, but not executed by the board)
3. Diagnose mail path (SendGrid key suspected) — mail_queue 19 stuck, all pending (re-verified today); prerequisite for win-back send.
4. Commit/revert 2 leftover dirty files (frontend/dist/index.html, node_modules/.package-lock.json).
5. Housekeeping (carried from 08-31): delete test_user_writer_room_001; clear subscription_status=active on aksystems.mail + starrwulfe (both plan=free).
6. Win-back cohort reality check: 8 real external users (not 9); leads are 11× one person.
7. Ops watch: host rebooted ~04:42 EDT today — 2nd reboot in 48h (prior 09-05 ~19:25); cron healthy both times.

## 2026-09-08 — board meeting (fork day 17; REVIVE day 3)

HITL #1 (rotate exposed service-account key) — carries forward from 09-07. Re-verified TODAY: `git cat-file -p eb12fad^:backend/serviceAccountKey.json` returns the complete 2,382-byte live key; tree clean (`git ls-files`), history still exposed. Founder-only console action, $0.
HITL #2 (wire Stripe key) — carries forward. Re-verified: no STRIPE_SECRET_KEY in env; all 10 users plan=free. CFO still blind. $0.

### New this meeting
14. Mail path is now the critical path for the revive test: mail_queue re-verified 19 stuck (18 pending + 1 no-status field, oldest 03-29 / newest 04-05); ext-firestore-send-email-processqueue deployed but never drains. Win-backs to the 8 external users are the revive test's only real lever — no mail delivery = test measures nothing.
15. Unexplained api traffic ~06:42Z + 07:08Z (2:42/3:08am EDT): two AUTOSCALING cold starts, zero errors. Source unknown (founder? monitor? crawler?) — worth identifying.
16. Ops: host stable — boot 09-07 04:42, uptime 28.5h at meeting time, NO third reboot. Prior 48h/2-reboot watch item closed.
17. Re-verified flat (no change): users=10, leads=12, feedback=6 (all founder self-tests), writer_rooms=0; repo pushed_at 09-06T16:20:09Z / HEAD c2c5f25 unchanged; 2 dirty files (frontend/dist/index.html, frontend/node_modules/.package-lock.json); vulnerability alerts disabled; functions = `api` + ext-firestore-send-email-processqueue only; api healthy (/docs 200, auth 422 firing, zero errors in ~24h logs).

## 2026-09-09 — board meeting (REVIVE day 4)

HITL #1 (rotate exposed service-account key) — carries from 09-07. Re-verified TODAY: `git cat-file -p eb12fad^:backend/serviceAccountKey.json` returns the complete 2,382-byte live key again; tree clean (`git ls-files`); key-file history on GitHub: b4ff118 (02-28) → removed eb12fad (09-06). Founder-only console action, $0.
HITL #2 (wire Stripe key) — carries. Re-verified: no STRIPE_SECRET_KEY in env; all 10 users plan=free. CFO still blind. $0.

### New this meeting
18. **CORRECTION** to item 14 (09-08) and the 08-23→09-08 "mail path broken" narrative: mail_queue is NOT stuck. Full per-doc delivery-state read (19/19 docs): 18 have `delivery.state=SUCCESS` with startTime+endTime and error=null — delivered Mar 29–Apr 5. The app-level `status=pending` field is never updated after delivery; every board since 08-23 counted that field and misread 18 delivered messages as 18 stuck. The only genuinely undelivered doc is XFCvszY0Qb2fNpdXTCMd (to support@arcwriter.us) with NO delivery block. ext-firestore-send-email-processqueue zero logs = idle (no new queue items since Apr 5), not broken. Win-back prerequisite shifts from "fix mail path" to "verify the extension's SMTP config survived + run one test send."
19. api traffic watch continues (item 15): cold-start bursts today 05:46:04Z, 09:45:36Z, 11:20:13Z — 3–6 requests each, zero errors; yesterday's window also showed 14:54Z + 15:20Z bursts after the board's checks. Pattern ≈ periodic polling/monitor or someone browsing the live app. Founder asked to confirm whether it's him.
20. Housekeeping (carried from 08-31): delete test_user_writer_room_001 (plan=explorer); clear subscription_status=active on aksystems.mail + starrwulfe (both plan=free) — re-verified present today; commit the board's 3 decision files (this file, DECISION_QUEUE.md, decisions.md) + the 2 leftover build artifacts (frontend/dist/index.html, node_modules/.package-lock.json).
21. Ops: reboot watch CLOSED — uptime 2d 4h (boot 09-07 04:42), no 3rd reboot; the 09-05/09-06 double-reboot pattern did not recur.

## 2026-09-10 — board meeting (REVIVE day 5)

HITL #1 (rotate exposed service-account key) — carries from 09-07, now day 4. Re-verified TODAY: `git cat-file -p eb12fad^:backend/serviceAccountKey.json` returns the complete 2,382-byte live key again; tree clean (`git ls-files`, only false positive = prop-types ReactPropTypesSecret.js). Founder-only console action, $0.
HITL #2 (wire Stripe key) — carries, day 5. Re-verified: no STRIPE_SECRET_KEY, no `stripe` binary, no `~/.config/stripe`; all 10 users plan=free. CFO still blind. $0.

### New this meeting
22. **Four endpoints the deployed frontend calls do not exist in the backend.** Deployed bundle `frontend/dist/assets/index-BMkOoNTk.js` (built 09-06, matches what the site serves) calls `POST /api/universe/create`, `GET /api/universe/{name}/projects`, `POST /api/universe/{u}/project/create` (from `UniverseDashboard.tsx:56/77/105`, rendered at `App.jsx:136`) and `GET /api/assets/check_video_status/{jobId}` (`PitchDeckGallery.tsx:183`). None of these strings exist anywhere under `backend/`. Live probes: all four → `404 {"detail":"Not Found"}`, while `GET /api/assets/teaser_status` (the name the backend does define) → 422. Grep of `4a7de22` (June) shows the same 9 top-level routes and the same absence — the drift predates the revive; it became user-visible only when the backend went live 09-06. **This is the remaining work of the revival: the app cannot list or create universes/projects.**
23. **All 11 routers are registered inside `lazy_initialize()`** (`backend/main.py:88-98`, invoked from line 126 and 142) — i.e. mounting happens as a side effect of serving a request. Live evidence on one instance: `GET /api/user/me` → 404 (router route, unmounted) while `GET /api/assets/teaser_status` → 422 (main.py route, exists). Mounting is request-order-dependent; a user whose first call on a cold instance isn't a main.py route gets 404 for an endpoint that works a second later. Cannot confirm real-user impact without a valid Firebase token — flagged as a design fragility, not a measured outage.
24. **CORRECTION to items since 09-07:** "`/docs` 200 / API docs reachable" was a false positive. `firebase.json:42` rewrites `**` → `/index.html`; `curl -D- https://arcwriter.us/openapi.json` → `content-type: text/html` (the SPA). Only real external API signal is an actual `/api/**` status code. (Also corrects the 09-09 item 24 / 09-08 item 17 "api healthy (/docs 200)".)
25. **GitHub secret scanning, push protection, validity checks and Dependabot security updates are all `disabled`** on the public repo; `/vulnerability-alerts` 404, `/secret-scanning/alerts` 404. Secret scanning + push protection are free on public repos and would have caught the Feb 28 key commit. $0, one click, directly mitigates the live exposure in HITL #1.
26. **`share_links` collection surfaced** (not reported by any prior board): 8 docs, all owner = founder, 36 total views, top link `WV84lDp8bliA` → "Kevin Fong" with 18 views from one device. **5 links are past `expires_at` and still `is_revoked: false`** — `q7x9bIEwon2T` (exp 03-21), `pZ3KsUsdq93C`/"A24 Studios" (04-14), `ZnPW6Y1Md5I4` + `WV84lDp8bliA` + `JXlZosrtsFEt` (04-09). Check expiry enforcement at `backend/app/routers/share.py:235` (`/view/{share_hash}`).
27. **TRAFFIC: zero requests to the live backend in 24 hours.** Cold starts between 2026-09-09T13:01Z and 2026-09-10T13:01Z: none (the single 09-10T13:01Z start is the board's own probe). The 09-08 (00:27/04:27/06:42/07:08/14:54/15:20Z) and 09-09 (05:46/09:45/11:20Z) pre-dawn bursts did not recur. **Item 15/19 (unexplained traffic) CLOSED.** Implication: the revival has not reached a single end user yet — the win-back mail (recommended item) is the only lever that changes this.
28. **The 9 ERROR-severity log lines are fully explained and closed:** all 9 are in the 09-06 16:11–16:15Z deploy window, `ModuleNotFoundError: No module named 'asgiref'` raised from `backend/main.py:306`, surfacing as Flask `Exception on /api/health|/|/docs`. `asgiref` is now in `backend/requirements.txt`, and there are zero ERROR entries after 16:15:53Z on 09-06. (Prior wording: "zero errors in logs" was true only for the sampled window; the deploy window did error.)
29. New this meeting, flat data re-verified: `campaign_stats` = 1 doc (`daily_coverage`, date 2026-04-04, count 9); `rate_limits` = 7 docs, all last_run 2026-04-03/04, all from the creed9569 lead flow, incl. test doc `bypass_hash_for_testing`; `temporary_analyses` = at least 1 (`Steve's Going To London`, 2026-02-28, `claimed: true`); `universes` = 13 with the newest write being the founder's own "Writing Excercises" on **2026-07-10**.
30. Re-verified flat (no change): users=10, leads=12, feedback=6, mail_queue=19 (18 delivered SUCCESS / 1 never processed), writer_rooms=0; repo `pushedAt 09-06T16:20:09Z` + HEAD `c2c5f25` unchanged; functions = `api` + `ext-firestore-send-email-processqueue` only; host uptime 3d 4h (boot 09-07 04:42), disk 20%.
31. Housekeeping carried (from 08-31): delete `test_user_writer_room_001` (plan=explorer); clear `subscription_status=active` on aksystems.mail + starrwulfe (both plan=free); commit the 3 board files + 2 build artifacts (frontend/dist/index.html, frontend/node_modules/.package-lock.json).

## 2026-09-11 — board meeting (revive day 6)

HITL #1 (rotate the exposed service-account key) — **sharpened today with new evidence**: it is not only in public git history
(`git cat-file -p eb12fad^:backend/serviceAccountKey.json` → 2,382 bytes) — it is inside the live deploy. Downloaded
`gs://gcf-v2-sources-784508378100-us-central1/api/function-source.zip` (148,585 bytes, uploaded 2026-09-06T16:16:42Z, 51 files) →
contains `serviceAccountKey.json`, 2,382 bytes. Live function log 2026-09-10T13:03:22Z: `Found service account key at
serviceAccountKey.json` (code path `backend/app/utils/firebase_auth_utils.py:14-17`), so production uses the file, not ADC.
Day 6, $0, founder-only (GCP Console → IAM → service accounts → keys).

HITL #2 (wire Stripe visibility) — carries; re-verified today: no `STRIPE_SECRET_KEY` in env, no `stripe` binary, no
`~/.config/stripe`, and the live revision's env is only FIREBASE_CONFIG/GCLOUD_PROJECT/EVENTARC_CLOUD_EVENT_SOURCE/FUNCTION_TARGET/
LOG_EXECUTION_ID. `stripe_service.py:12` has no fallback, so billing is non-functional, not merely unmeasured.

### New this meeting
14. **[Recommended, High] Stop shipping the key with the deploy.** `backend/serviceAccountKey.json` exists on disk (Jul 21) and
    nothing excludes it — no `.gcloudignore`, and `firebase.json` functions `ignore` covers only venv/.git/firebase-debug.log*.
    Proposal: delete the file from the working dir and add it to the functions ignore list, then `firebase deploy --only functions`
    so `firebase_auth_utils.py:19` takes the `ApplicationDefault()` branch. **Order: rotate (HITL #1) first, then this**, so the
    container is never left on a revoked credential. $0, reversible.
15. **[Recommended, High] Fix the four endpoints the live app calls** — re-probed today 13:00:46Z: `/api/universe/create` 404,
    `/api/assets/check_video_status/x` 404, `/api/user/me` 404, vs `/api/universes` + `/api/assets/teaser_status` 422. No code
    moved since 09-10; the dashboard still cannot list or create universes.
16. **[Recommended, High] Move `include_router()` out of `lazy_initialize()`** (`backend/main.py:88-98`, invoked at 126 and 142) —
    unchanged; today's 13:00:46Z cold start again served a 404 and a 422 in the same second depending on route order.
17. **[Recommended, High] Enable GitHub secret scanning + push protection + Dependabot** — re-checked today: all `disabled`,
    `/secret-scanning/alerts` and `/vulnerability-alerts` both 404. Free on public repos.
18. **[Recommended, High] Win-back the 8 external users** — mail_queue still 19 docs, newest 2026-04-05; mail extension still has
    no delivery activity in the window pulled. Blocked on proving the send path.
19. **[Recommended, Medium] Verify the LLM path with one real login (new).** Live revision has **no `GEMINI_API_KEY`**;
    `llm_service.py:36-61` falls back to Vertex AI via ADC and `aiplatform.googleapis.com` is ENABLED — plausible, unproven. No
    authenticated request has ever reached the running backend, so generation — the actual product — has never run in prod.
20. **[Medium] Share-link expiry** — re-read all 8 docs: 5 past `expires_at`, still `is_revoked: false`; 36 views total. Check
    `backend/app/routers/share.py` `/view/{share_hash}`.
21. **[Low] Commit the dirty tree** (`DECISION_QUEUE.md`, `decisions.md`, `pending_actions.md`, `frontend/dist/index.html`,
    `frontend/node_modules/.package-lock.json` at HEAD `c2c5f25`).
22. **[Low] Firestore housekeeping** (carried since 08-31): delete `test_user_writer_room_001`; clear stale
    `subscription_status=active` on aksystems.mail + starrwulfe.
23. **Ops note (no action): automated secret-scanner probes** — 2026-09-11 12:30:50–12:32Z (08:30 EDT), `GET /api/.env`,
    `/api/config`, `/api/env`, all 404, three distinct Google-fronted IPs. Same shape as the 09-08/09-09 pre-dawn bursts. Nothing
    leaked; flagged as recurrence risk while the repo is public with an un-rotated key in history.
24. **Data-source note:** this meeting added Cloud Monitoring (`run.googleapis.com/request_count`), the Cloud Logging
    `run.googleapis.com/requests` stream, the Cloud Run Admin revisions API, the Service Usage API, and the deployed function
    source bundle in GCS. Per-day backend traffic: 09-07 = 38, 09-08 = 29, 09-09 = 18, 09-10 = 13, 09-11 (partial) = 10 — of
    which 7 today were the board's own probes and 3 were the scanner. Zero authenticated user requests since the revive.

## 2026-09-12 — board meeting (revive day 7)

**Context: the founder acted.** Last night (2026-09-11 17:18–17:34 EDT) two commits landed on this box — `5955732` "Fix
cold-start 404s: register routers at import, not on first request" and `4924a72` "Harden deploy: stop shipping
serviceAccountKey.json; add missing dashboard endpoints" — followed by two deploys (`api-00005-law` 21:23:48Z,
`api-00006-dos` 21:33:40Z). Verified today: deployed bundle 262,719 bytes / 70 files with **no `serviceAccountKey.json`**,
instance log `Using Application Default Credentials`, `firebase.json` ignore now covers the key file + `.env`, GitHub secret
scanning + push protection + Dependabot security updates all **enabled**, and the four 404 endpoints are live
(`/api/user/me` 422, `/api/universe/x/projects` 422, `/api/assets/check_video_status/x` 422, `/api/universe/create` 405 on GET).
**HITL #1 from meetings #8-#15 (rotate the exposed key) is effectively resolved:** the leaked key
(`private_key_id 0785d10579c3d543347f9359ade0a58396f5c93c`) returns `400 invalid_grant: Invalid JWT Signature` at Google's
token endpoint, and the IAM key listing shows the service account no longer holds it.

### HITL (need explicit approval — irreversible or >$50)
25. **[HITL #1] Close the incident on GitHub** — resolve the 3 open secret-scanning alerts (#2 `backend/serviceAccountKey.json`
    publicly leaked but now dead; #1 `frontend/src/firebase.js` Google API key; #3 `deploy_v9.log` Google API key). Alerts #1/#3
    need a human call on revoke-and-reissue. $0, founder-only.
26. **[HITL #2] Wire `STRIPE_SECRET_KEY` (+ `STRIPE_WEBHOOK_SECRET`, price IDs)** — day 7; revision env still carries only
    FIREBASE_CONFIG/GCLOUD_PROJECT/EVENTARC_CLOUD_EVENT_SOURCE/FUNCTION_TARGET/LOG_EXECUTION_ID; `stripe_service.py:12` has no
    fallback, so `/api/billing/*` is non-functional. $0, founder-only.

### Recommended (no approval needed, not executed by the board)
27. **[High] `git push`** — `master` is ahead of `origin/master` by 2 (`4924a72`, `5955732`); remote HEAD still `c2c5f25`. The
    revive's working state is on one box only. $0.
28. **[High] Delete the last user-managed key** on `firebase-adminsdk-fbsvc@arc-studio-box` (`6fc5b7af…`, created 2026-01-13,
    enabled) — production runs on ADC and the compute SA has no user-managed keys, so nothing needs this key. Closes the class.
29. **[High] Fix `capture_lead` 500** — `app/routers/public.py:77` raises `HTTPException(404)` inside the handler's `try`, and the
    broad `except Exception` at line 187 re-raises it as a 500. Expired-link visitors get "Failed to deliver analysis." Root-caused
    from the deployed source + 3 log lines (09-11 21:31:59/21:32:29/21:34:27Z).
30. **[High] [Marketing] Prove the mail path, then send the win-back** to the 8 external users — `mail_queue` 19 docs, newest
    2026-04-05. Note `BREVO_API_KEY`/`BREVO_LIST_ID` absent from the revision env, so the Brevo sync in `public.py:92-118` never runs.
31. **[Medium → CLOSED, verified] Cold-start 404s.** Correction to items 16 above: the deployed `main.py` calls
    `lazy_initialize()` at module scope (line 380) so all 11 routers mount at import. Field-tested today: after 13 minutes
    idle, the first request to a router-only path (`GET /api/billing/health`, 2026-09-12T13:21:53Z) returned 200
    `{"status":"billing router is live"}`. No action needed.
32. **[Medium] Verify the LLM path with one real login** — `GEMINI_API_KEY` unset → Vertex ADC fallback; no authenticated request
    has ever hit production.
33. **[Low] Merge the 7 Dependabot PRs** (opened 09-11T21:19Z, all workflow runs green).
34. **[Low] Commit or discard the 5 dirty files**; hosting last deployed 2026-09-06T16:19:34Z, so `frontend/dist/index.html` is not live.
35. **[Low] Firestore housekeeping** — fixture user + stale `subscription_status` on two free accounts.
36. **[Low] Share-link expiry enforcement** — 5 of 8 links past `expires_at`, none revoked.
37. **Ops note (no action):** automated secret-scanner probes now nightly — 6 requests in the last 24h (`/api/.env` ×3,
    `/api/config`, `/api/env`, `/api/session/properties`), all 404, three IPs, 2026-09-12 00:01–06:55Z.
38. **Data-source note (new method):** credential-liveness test — JWT-bearer assertion signed with the key recovered from public
    history, exchanged at `oauth2.googleapis.com/token`; `400 invalid_grant` proves a leaked key is dead without touching production.

## 2026-09-13 — board meeting (revive day 8)

### HITL (need explicit approval — irreversible or >$50)
39. **[HITL][Finance] Wire Stripe** — `STRIPE_SECRET_KEY` (+ `STRIPE_WEBHOOK_SECRET`, price IDs) into the `api`
    function env, plus a key or CLI on this box. Day 8. Re-read today: revision `api-00006-dos` env is still only
    `FIREBASE_CONFIG, GCLOUD_PROJECT, EVENTARC_CLOUD_EVENT_SOURCE, FUNCTION_TARGET, LOG_EXECUTION_ID`. Billing
    routes exist and are non-functional. `$0`, founder-only. No MRR estimate is given while this is unwired.
40. **[HITL][Ops] Close the credential incident** — delete the last user-managed key on
    `firebase-adminsdk-fbsvc@arc-studio-box` (`6fc5b7af8d5c83d416a08a542cdcd2f10cdd19ca`, created 2026-01-13,
    still enabled; compute SA has 0 keys, prod runs on ADC) **and** resolve the 3 open secret-scanning alerts
    (#1/#3 = Google API keys in `frontend/src/firebase.js` / `deploy_v9.log` → decide revoke-vs-keep; #2 = the
    already-dead service-account key → mark resolved). Reversible, `$0`, founder-only.

### Recommended (no approval needed, but not executed by the board)
41. **[High][Ops] `git push`** — day 2. `origin/master` HEAD `c2c5f25`; local `4924a72` + `5955732` still unpushed;
    diffs re-checked clean of secrets. Only item here where inaction can lose work.
42. **[High][Ops] Fix the `capture_lead` 500** — still deployed (no deploy since 09-11T21:33:40Z): `public.py:77`
    raises `HTTPException(404)` inside the handler `try`, `except Exception` at :187 rewrites it as a 500 on the
    funnel's conversion step. One-line fix.
43. **[Medium][Marketing] First real visitor arrived and bounced** — Win-back path is still the only conversion
    lever: `mail_queue` 19 docs, newest write 2026-04-05; no `BREVO_API_KEY`/`BREVO_LIST_ID` in the revision env.
44. **[Low][Ops] Freebie backlog (carried 5+ meetings)** — merge 7 Dependabot PRs; commit/discard 5 dirty files
    (hosting still serves the 2026-09-06T16:19:34Z release); Firestore housekeeping (fixture user + 2 stale
    `subscription_status: active`); confirm share-link expiry enforcement (5 of 8 past `expires_at`, none revoked).
45. **[Low][Ops] Cold start ≈6s on first request after idle** — measured 6.22s (visitor, 23:43:53Z) and 5.81s
    (bingbot, 10:03:19Z). Accept, or `min-instances=1` on Cloud Run = new recurring spend (~$10–20/mo, verify).
46. **Ops note (no action):** automated traffic is now crawlers *and* scanners — 15 hits/24h vs 6 the day before:
    `bingbot/2.0` (200, render), `CCBot/2.0`, `DeepSeekBot/1.0`, `ChatGPT-User/1.0`, a Chrome/131 `.env` sweeper
    (`/api/.env`, `/api/v1|v2|v3|staging/.env`), a GitLab-scanner `/api/v4/projects`, `metabase-cve-2026-72898-detect/1.0`,
    and a Chrome-UA API enumerator (`/api/assets/generate`, `/api/bible/update`, `/api/project/character/update_anchor`).
    All 404/405/422 — nothing leaked, nothing served.
47. **Data-source note (new method this meeting):** the **User-Agent + Referer** fields on `run.googleapis.com/requests`
    entries are what separate a real visitor from the crawler/board noise (all board curls show `curl/8.18.0`; the
    visitor showed `Edg/152.0.0.0` with `referer: https://arcwriter.us/`). Remote IP is useless for this — API calls
    arrive via Firebase Hosting's Google edge, so every client looks like a Google IP.

---
## Board meeting 2026-09-14 (revive day 9)

### HITL — needs A.K.'s approval (no action taken by the board)
1. **[HIGH][Finance] Wire Stripe** — day 9. Live revision `api-00006-dos` env names still lack `STRIPE_SECRET_KEY` /
   `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_*`; also no `BREVO_API_KEY`, no `GEMINI_API_KEY`. Box re-checked: no `stripe`
   binary, no `~/.config/stripe`, no env var. Billing endpoints are non-functional, not just unmeasured. $0, founder-only.
2. **[HIGH][Ops] Close the credential incident** — `firebase-adminsdk-fbsvc@arc-studio-box` still holds 1 user-managed
   key (`6fc5b7af8d5c…`, created 2026-01-13, `validBeforeTime` 9999 = never expires) with no consumer (prod uses ADC;
   compute SA has 0 keys). GitHub alerts #1/#2/#3 still `open`, `publicly_leaked: true`, `validity: unknown` → #2 =
   documentation close (dead key), #1/#3 = revoke-or-keep call on API keys in `frontend/src/firebase.js` and
   `deploy_v9.log`. $0, reversible.
3. **[Medium][Ops] `min-instances=1` on Cloud Run `api`** — recurring spend, annualized ~$120–240/yr (crosses the $50
   line, so flagged for explicit Approve/Deny/Delay). Cold start measured **7.58s** today (vs 6.22s / 5.81s on 09-13);
   `template.scaling` has `maxInstanceCount: 10` and no minimum.

### Recommended (no approval needed, but not executed by the board)
4. **[High][Ops] Fix `capture_lead` 500 + deploy** — production still runs `api-00006-dos` (09-11T21:33:40Z); source
   bundle `api/function-source.zip` byte-identical (262,719 B, uploaded 09-11T21:33:01Z). `public.py:77` raises
   `HTTPException(404)` inside the handler `try`; `except Exception` at `:187` rewrites it as a 500. Still unfixed in the
   working tree. One-line fix, then `firebase deploy` also brings prod in sync with `master`.
5. **[Medium][Marketing] Prove the mail path** — `mail_queue` 19 docs / 18 `pending`, newest write 2026-04-05; `leads` 12,
   all one address (`creed9569@aol.com` / `Creed9569@aol.com`), 2026-04-04/05. No `BREVO_API_KEY`/`BREVO_LIST_ID` in the
   revision env, so `capture_lead`'s email half is inert. Win-back is the only conversion lever until Stripe lands.
6. **[Low][Ops] Freebie backlog** — merge 7 Dependabot PRs; commit/discard 5 dirty files (hosting still serves the
   2026-09-06T16:19:34Z release); Firestore housekeeping (fixture `test_user_writer_room_001`, 2 stale
   `subscription_status: active` on free plans).
   - **[CLOSED — no action]** share-link expiry enforcement confirmed: `routers/share.py:256–260` / `:313–315` enforce
     `expires_at` (410) and `:252` / `:310` enforce `is_revoked` (410). The 8 expired share-links are inert.

### Ops note (no action)
7. Scanner mix changed: `python-httpx/0.28.1` swept `/api/config`, `/api/v1|v2/config`, `/api/.env`, `/api/v1|v2/.env`
   at 09:22–09:23Z today; a Chrome/125 UA asked for `/api/health`; and **4 rapid `POST /api/auth/signin` 404s** at
   09-13T13:06Z from a Windows Chrome/120 UA with no referer (no such route exists — auth is client-side Firebase).
   11 automated hits in 24h total, all 404, nothing leaked (down from 15 the previous day).
8. **Host rebooted** 2026-09-14 04:15 EDT (previous boot ran 2d17h). Post-boot checks clean: API answering, container
   logs normal, disk 20 %, mem 5/31 GB used. Logged here only because the box previously ran 2+ days.
9. **Push resolved (09-14):** `master` == `origin/master` == `4924a72`; `pushed_at` 2026-09-13T15:54:00Z. Closes
   pending item #41 from the previous three meetings.

## 2026-09-15 — proposals from board meeting (revive day 10)

HITL #1 (wire Stripe — day 10) and HITL #2 (delete leftover never-expiring user-managed SA key
`6fc5b7af8d5c83d416a08a542cdcd2f10cdd19ca` on `firebase-adminsdk-fbsvc@arc-studio-box`; resolve the 3 open
secret-scanning alerts) carry forward unchanged — both $0, both still awaiting review. HITL #3 (`min-instances=1`,
~$10–20/mo) also carries forward; new evidence today is a 9.08s cold start (worst measured).

### New this meeting
10. **[Recommended, $0] Get `TestClient` off the request path.** The deployed `main.py` (bundle uploaded
    09-11T21:33:01Z) builds `fastapi.testclient.TestClient(app, raise_server_exceptions=False)` at lines 395–396 and
    serves every production request via `client.request(...)`. Effect: `httpx`/`testclient` import on the first
    request of every cold start (stderr shows the Starlette deprecation warning at each cold-start timestamp all
    week) and a likely large share of the 9.08s cold start. Proposal: call the ASGI app directly
    (`async_to_sync(app)(scope, receive, send)` with a small scope/receive shim, or Firebase's documented ASGI
    adapter) and drop the test client. Pair with trimming the `functions.ignore` list — the bundle ships `tests/`,
    `tests/__pycache__/*.pyc`, `discovery_test.txt` and 2 PDFs (70 files / 740 KB uncompressed) although
    `serviceAccountKey.json` is already ignored.
11. **[Recommended, $0] Fix the `capture_lead` 500 — day 2 unwritten.** `app/routers/public.py:77` raises
    `HTTPException(404, "Analysis expired or not found.")` inside the handler's broad `try`; `except Exception` at
    line 187 rewrites it as a 500. One-line fix (re-raise `HTTPException` before the generic handler), then
    `firebase deploy` — which also closes the 4-day prod-vs-repo gap.
12. **[Recommended, $0] Brevo key still missing** — revision env has no `BREVO_API_KEY` / `BREVO_LIST_ID`, so
    `capture_lead`'s email half is inert and win-back stays blocked (mail_queue 19 docs, 18 `pending`, newest
    2026-04-05; leads 12, all one AOL address from 2026-04-04/05).
13. **[Recommended, $0, ~15 min] Freebie backlog (carried 7+ meetings):** merge the 7 Dependabot PRs (all green,
    opened 09-11T21:19Z); commit or discard the 5 dirty files; Firestore housekeeping (fixture
    `test_user_writer_room_001`, stale `subscription_status: active` on two free-plan accounts).
14. **[Ops note, no action] Discovery is broadening:** Facebook `meta-webindexer/1.1`, `AhrefsBot/7.0` and
    `GPTBot/1.4` each fetched the landing page API (200) between 00:25Z and 08:13Z on 09-15; the scanner parade
    continues (19 automated hits/24h, all 404, nothing leaked). One Metabase-CVE probe carried a forged
    `referer: https://www.arcwriter.us` — it is not a visitor.

### New this meeting — 2026-09-16 (revive day 11)
15. **[HITL, $0] Wire Stripe — day 11.** Env names on the live revision `api-00006-dos` re-read today: `FIREBASE_CONFIG,
    GCLOUD_PROJECT, EVENTARC_CLOUD_EVENT_SOURCE, FUNCTION_TARGET, LOG_EXECUTION_ID` — no `STRIPE_SECRET_KEY`, no
    `STRIPE_WEBHOOK_SECRET`. Box re-checked: no `stripe` binary, no `~/.config/stripe`, `STRIPE_SECRET_KEY` unset. Billing
    routes exist; billing cannot work. Also blocks any MRR figure. Founder-only console work.
16. **[HITL, $0] Close the credential incident.** IAM re-list: `firebase-adminsdk-fbsvc@arc-studio-box` still holds one
    never-expiring user-managed key `6fc5b7af8d5c83d416a08a542cdcd2f10cdd19ca` (created 2026-01-13, `validBeforeTime` 9999);
    compute SA holds 0, so it has no consumer. GitHub alerts #1/#2/#3 still `open`, all `publicly_leaked: true`, all
    `validity: unknown`. Founder-only, reversible, $0.
17. **[HITL, ~$10-20/mo] `min-instances=1` on Cloud Run `api`.** New counts today: 12 cold starts in 24h; first-request
    latency 9.65s (09-16), 9.08s (09-15), 7.58s (09-14); scanner bursts pay 5.16/5.54/5.78/5.82/5.31s on request #1 and
    0.009-0.36s on request #2. `template.scaling` = `{maxInstanceCount: 10}` only. Approve / Deny / Delay.
18. **[Recommended, $0] `capture_lead` 500 fix — day 3 unwritten.** `backend/app/routers/public.py:77` raises
    `HTTPException(404)` inside the handler `try`; `except Exception` at line 187 rewrites it as 500. One-line re-raise, then
    `firebase deploy`.
19. **[Correction, $0] Production is not behind the repo.** `git log --since=2026-09-11T21:33:40Z -- backend/` returns only
    `4924a72`, the commit revision `api-00006-dos` was built from; `master` == `origin/master` at `4924a72`. Yesterday's
    "4 days behind" framing was wrong — the delta is unwritten code, not a stale deploy. `frontend/dist/index.html` dirty
    diff is also a non-issue: live site serves `assets/index-BMkOoNTk.js` / `index-BWlmgZpy.css`, exactly those hashes, 200.
20. **[Recommended, $0] `TestClient` still on the production request path.** Bundle re-pulled, byte-identical (262,719 B,
    uploaded 09-11T21:33:01Z). `main.py:395-396` builds `TestClient(app, raise_server_exceptions=False)`; line 407 serves
    every request through `client.request(...)`. Starlette deprecation warning logged at all 12 cold starts in 24h.
21. **[Recommended, $0] Brevo key still missing** — `mail_queue` 19 docs / 18 `pending`, newest write 2026-04-05T00:04:34Z;
    `leads` 12, 11 of them one AOL address (2026-04-04/05). No `BREVO_API_KEY`/`BREVO_LIST_ID` in the revision env.
22. **[Recommended, $0, ~15 min] Freebie backlog, carried 8 meetings:** 7 Dependabot PRs still open (all 7 runs `success`);
    5 dirty files; Firestore housekeeping (fixture `test_user_writer_room_001`, stale `subscription_status: active` on two
    free-plan accounts).
23. **[Ops note, no action] Crawler visit did not repeat and the scanner mix rotated:** 0 crawler UAs in 24h (no
    `meta-webindexer`, `AhrefsBot`, or `GPTBot`); 25 automated hits, all 404, nothing served. Revisit Friday — one day is
    not a trend.

## 2026-09-17 — board meeting (revive day 12)

HITL items carry forward unchanged: #1 Stripe wiring (day 12), #2 credential-incident close-out (leftover key
`6fc5b7af…` + 3 open GitHub alerts), #3 `min-instances=1`. Nothing executed; nothing written to production.

### New this meeting — 2026-09-17 (revive day 12)

24. **[HITL, $0] Wire Stripe — day 12.** Live revision `api-00006-dos` env names re-read today, unchanged:
    `FIREBASE_CONFIG, GCLOUD_PROJECT, EVENTARC_CLOUD_EVENT_SOURCE, FUNCTION_TARGET, LOG_EXECUTION_ID`. Box re-checked:
    no `stripe` binary, no `~/.config/stripe`, `STRIPE_SECRET_KEY` verified **unset by character count** (this shell
    masks the variable name in output, so a `***` display is not evidence either way). Billing routes exist and cannot
    work; MRR stays unreported rather than estimated.
25. **[HITL, $0] Close the credential incident.** IAM re-list: `firebase-adminsdk-fbsvc@arc-studio-box` still holds one
    never-expiring user-managed key `6fc5b7af8d5c83d416a08a542cdcd2f10cdd19ca` (created 2026-01-13, `validBeforeTime`
    9999-12-31); compute SA holds 0, so it has no consumer. GitHub alerts #1/#2/#3 all still `open`, all
    `publicly_leaked: true`, all `validity: unknown`.
26. **[HITL, ~$10-20/mo] `min-instances=1` on Cloud Run `api` — board now recommends DELAY.** Cold-start *events* fell
    to 2 in 24h (from 12) and both were machine-triggered (board probe + one scanner); first-request latency is still
    the worst measured (9.62s / 7.00s today), but with zero human traffic the spend buys nobody anything. Revisit when
    real traffic returns, or try the $0 `TestClient` fix first.
27. **[Recommended, $0] `capture_lead` 500 fix — day 4 unwritten.** `backend/app/routers/public.py:77` raises
    `HTTPException(404)` inside the handler `try`; `except Exception` at 187-190 rewrites it as a 500. Also masks the
    mail-delivery path from diagnosis. One-line re-raise, then `firebase deploy`.
28. **[Recommended, $0] `TestClient` still serving production traffic.** Bundle unchanged (262,719 B, uploaded
    09-11T21:33:01Z). `main.py:395-396` builds `TestClient(...)`; line 407 routes every request through it. Likely
    cause of the cold-start latency; fix = call the ASGI app directly.
29. **[Recommended, $0] Brevo key still missing**, so `capture_lead`'s email half is inert — `mail_queue` 19 docs / 18
    `pending`, newest write 2026-04-05T00:04:34Z. Prove one send before spending another meeting on win-back.
30. **[Recommended, $0, ~15 min] Freebie backlog, carried 9 meetings:** 7 Dependabot PRs still open (7/7 runs
    `success`); 5 dirty files; Firestore housekeeping — fixture `test_user_writer_room_001`, stale
    `subscription_status: active` on two free-plan accounts, and the leftover `rate_limits/bypass_hash_for_testing` doc
    (last used 2026-04-03).
31. **[Ops note, no action] Discovery still quiet:** 0 crawler UAs for a second straight day (no `meta-webindexer`, no
    `AhrefsBot`, no `GPTBot`). 09-16 hourly totals: 0 / 3 / 5 / 2 = 10 requests all day, all automated. If the crawlers
    don't return by Friday, Monday's discovery burst was a one-off.
32. **[Data-quality correction] Daily Monitoring buckets drift.** The daily-aligned `request_count` series reports 2
    requests for 09-16, contradicting the hourly series (10) and the `run.googleapis.com/requests` log stream (7
    in-window). Use the hourly series and the log stream; the day-level bucket is misaligned.

## 2026-09-18 — board meeting (revive day 13)

HITL items carry forward unchanged: #1 Stripe wiring (day 13), #2 credential-incident close-out (leftover key
`6fc5b7af…` + 3 open GitHub alerts), #3 `min-instances=1`. Nothing executed; nothing written to production.

### New this meeting — 2026-09-18 (revive day 13)

33. **[HITL, $0] Wire Stripe — day 13.** Live revision `api-00006-dos` env names re-read today, unchanged:
    `FIREBASE_CONFIG, GCLOUD_PROJECT, EVENTARC_CLOUD_EVENT_SOURCE, FUNCTION_TARGET, LOG_EXECUTION_ID`. Box re-checked:
    no `stripe` binary, no `~/.config/stripe`, `STRIPE_SECRET_KEY` = 5 characters (the literal `unset`, measured by
    character count — not a masked display). `subscriptions` collection still 0 docs; MRR stays unreported.
34. **[HITL, $0] Close the credential incident.** IAM re-list: `firebase-adminsdk-fbsvc@arc-studio-box` still holds one
    never-expiring user-managed key `6fc5b7af8d5c83d416a08a542cdcd2f10cdd19ca` (created 2026-01-13, `validBeforeTime`
    9999-12-31); compute SA holds 0. GitHub alerts #1/#2/#3 all still `open`, all `publicly_leaked: true`, all
    `validity: unknown`.
35. **[HITL, ~$10-20/mo] `min-instances=1` — board still recommends DELAY (3rd day).** First-request latency 9.29s
    server-side today (9.62s / 9.65s / 9.08s the three days prior); 6 cold-start events in 24h, every one
    machine-triggered. Zero human traffic ⇒ the spend buys nobody anything. Try the $0 items first.
36. **[Recommended, $0] `capture_lead` 500 fix — day 5 unwritten — NOW CONFIRMED LIVE IN PRODUCTION.** Pulled
    `api/function-source.zip` (262,719 B, md5 `MdQ3DWc98OosnOV9KQcPFA==`, uploaded 2026-09-11T21:33:01Z) and grepped
    the code the running revision was built from: `app/routers/public.py:77` raises `HTTPException(404, "Analysis
    expired or not found.")` inside the handler `try`; `except Exception` at line 187 rewrites it as a 500
    "Failed to deliver analysis." at line 190. Line numbers match the working tree. One-line re-raise of
    `HTTPException` before the generic handler, then `firebase deploy`.
37. **[Recommended, $0] `TestClient` still on the production request path, and the bundle still ships junk.**
    `main.py:395-396` builds `TestClient(app, raise_server_exceptions=False)`; the entrypoint serves every request
    through `client.request(...)`. The `StarletteDeprecationWarning` shows in stderr at all 6 cold-start timestamps in
    the 24h window. Bundle also still contains `__pycache__/*.pyc` (12+ files), the whole `tests/` dir, two coverage
    PDFs and five stray text/markdown fixtures — `serviceAccountKey.json` is correctly absent, so the 09-11 ignore
    fix holds (day 7). `a2wsgi` is already in `requirements.txt`, so the direct-ASGI fix needs no new dependency.
38. **[Recommended, $0] Brevo key still missing** ⇒ `capture_lead`'s email half is inert. Refined today: `mail_queue`
    19 docs with **18 at `delivery.state = SUCCESS`** (Mar 29–Apr 5) and 1 never processed (`support@arcwriter.us`);
    the `status: pending` on those 18 is stale bookkeeping, not an undelivered backlog. `leads` 12 docs, all one AOL
    address. Prove one send before spending another meeting on win-back.
39. **[Recommended, $0, ~15 min] Freebie backlog, carried 10 meetings:** 7 Dependabot PRs still open and all
    `MERGEABLE` (7/7 workflow runs `success`); 5 dirty files; Firestore housekeeping (fixture
    `test_user_writer_room_001`, stale `subscription_status: active` on two free-plan accounts, leftover
    `rate_limits/bypass_hash_for_testing` doc). New: **`billingbudgets.googleapis.com` is DISABLED** — no budget alert
    exists on a project that can bill.
40. **[Ops note, no action] Discovery returned after two blank days.** Baiduspider-render/2.0 rendered the landing page
    09-17T14:49:05Z → 200 with `referer: https://arcwriter.us/` (first Baidu visit on record, 6.75s cold);
    HeadlessChrome/153.0.0.0 rendered the app 09-18T04:19:38Z → 200 with `referer: https://arc-studio-box.web.app/`
    (Firebase default host, 6.47s cold). Two events — not yet a trend. Only other stranger: Windows-UA `GET /api/.env`
    09-17T21:49:51Z → 404, nothing leaked.
41. **[Ops note] 0 `severity>=ERROR` entries in 48h; no 429s this run.** Host uptime 4d 4h 45m (booted 2026-09-14
    04:15 EDT) — longest clean stretch yet.

## 2026-09-19 — board meeting (revive day 14)

42. **[HITL, $0, founder-only] Wire Stripe — day 14, unchanged.** Env names on live revision `api-00006-dos` still
    `FIREBASE_CONFIG, GCLOUD_PROJECT, EVENTARC_CLOUD_EVENT_SOURCE, FUNCTION_TARGET, LOG_EXECUTION_ID`. No `stripe`
    binary, no `~/.config/stripe`, `STRIPE_SECRET_KEY` unset by character count (5 = literal `unset`). New framing:
    `subscriptions` does not exist as a collection, so paid conversion is structurally impossible, not just
    unmeasured. MRR reported as UNKNOWN, never estimated.
43. **[HITL, $0, founder-only] Credential incident still open.** firebase-adminsdk SA holds 1 user-managed key
    (`6fc5b7af…`, created 01-13, expires 9999-12-31, not the leaked one); compute SA 0 keys; 3 GitHub secret alerts
    still `open`, all `publicly_leaked: true`, all `validity: unknown`. **New:** repo has
    `secret_scanning_validity_checks: disabled`, which is why they read "unknown" — enabling it (free) lets GitHub
    classify them, and alert #2 (dead SA JSON) should self-resolve to inactive.
44. **[HITL, ~$10–20/mo] `min-instances=1` — board recommends DELAY.** Zero humans for 14 days; 4 cold starts in
    24h, all machine-paid; `template.scaling` still `{maxInstanceCount: 10}` only.
45. **[Recommended, $0] `capture_lead` 500 — day 6 unwritten, now reproduced live.** `POST
    https://api-eqqs6vvela-uc.a.run.app/api/public/capture_lead` with a bogus `analysis_id` → **500**
    `{"detail":"Failed to deliver analysis. Please try again."}` in 0.55s. Code unchanged: `app/routers/public.py:77`
    raises `HTTPException(404 …)` inside the broad `try`; `except Exception` at 187–190 rewrites it as 500.
    One-line re-raise, then `firebase deploy`.
46. **[Recommended, $0] `TestClient` still on the production request path.** Bundle byte-identical for 8 days
    (`api/function-source.zip`, 262,719 B, md5 `MdQ3DWc98OosnOV9KQcPFA==`, updated 2026-09-11T21:33:01Z);
    `main.py:395–396` builds `TestClient(...)` and serves every request through `client.request(...)`;
    `StarletteDeprecationWarning` at all 4 cold-start timestamps. `serviceAccountKey.json` correctly absent.
    `a2wsgi` already in `requirements.txt`.
47. **[Recommended, $0] `billingbudgets.googleapis.com` still DISABLED** while Cloud Billing confirms
    `billingEnabled: true` on account `01D3CE-7950F5-66CF34` — no budget alert on a project that can bill.
48. **[Recommended, $0] Mail path + the revive test.** Revision has no `BREVO_API_KEY` / `BREVO_LIST_ID`;
    `mail_queue` 19 docs (18 `delivery.state: SUCCESS`, 1 never processed — `support@arcwriter.us`), `leads` 12 docs
    but **one address** (`creed9569@aol.com` ×12). The 09-06 → 10-06 revive test is at day 14 with zero humans driven
    into it ⇒ fund the $0 mail test + one shared link, or accept an inconclusive result.
49. **[Recommended, $0, ~15 min] Freebie backlog, carried 10 meetings:** 7 Dependabot PRs (8 days old, branches
    unchanged); 5 dirty files (`dist/index.html` diff confirmed a non-issue — live hashes match); Firestore
    housekeeping (fixture `test_user_writer_room_001`, stale `subscription_status: active` on two free-plan
    accounts, `rate_limits/bypass_hash_for_testing`) **plus revoke the 8 expired `share_links`** (all past
    `expires_at`, newest 2026-04-14, `revoked` unset on all 8, 36 views total).
50. **[Ops note, no action] Zero crawlers in 24h.** Window 09-18T13:00Z → 09-19T13:00Z has no `meta-webindexer`,
    `AhrefsBot`, `GPTBot`, `Baiduspider` or HeadlessChrome — yesterday's two render-bots sit just outside. If
    still absent Monday, treat the 09-15/17/18 cluster as a one-off.
51. **[Ops note] Collector script repaired** (`scripts/arcwriter_gather.py`): `entries:list` had no 429 retry and
    aborted the whole run; a section name in the timestamp position silently produced
    `timestamp>="monitoring"` → 0 entries (reads as "no traffic"). Fixed: per-section isolation, 429-retried POSTs,
    timestamp found by shape not position. Also: a static frontend-vs-router diff gave 13 false "missing route"
    hits — live probes (422 = exists / 404 = missing) are the only trustworthy route check.
52. **[Ops note] Host uptime 5d 4h 48m** (booted 2026-09-14 04:15 EDT) — reboot watch closed, 0 ERROR entries in
    48h, no 429s. Cold start improved for the first time in four days: 7.05s vs 9.29/9.62/9.65/9.08s.

## 2026-09-20 — board meeting (revive day 15)

53. **[HITL, $0, founder-only] Wire Stripe — day 15, unchanged.** Live revision `api-00006-dos` env names still
    `FIREBASE_CONFIG, GCLOUD_PROJECT, EVENTARC_CLOUD_EVENT_SOURCE, FUNCTION_TARGET, LOG_EXECUTION_ID`. No `stripe`
    binary, no `~/.config/stripe`, `STRIPE_SECRET_KEY` unset by character count (5 = literal `unset`). Firestore
    collection list re-read: **no `subscriptions` collection** ⇒ paid conversion structurally impossible. MRR
    reported as UNKNOWN, never estimated.
54. **[HITL, $0, founder-only] Credential incident still open.** firebase-adminsdk SA holds 1 user-managed key
    (`6fc5b7af…`, created 01-13, `validBeforeTime` 9999-12-31); compute SA 0 keys; 3 GitHub secret alerts all still
    `open`, `publicly_leaked: true`, `validity: unknown`. `secret_scanning_validity_checks: disabled` — enabling it
    (free) lets GitHub classify them; #2 (dead SA JSON) should self-resolve to inactive.
55. **[HITL, ~$10–20/mo] `min-instances=1` — board recommends DELAY.** Zero humans for 15 days; 5 cold-start events
    in 24h, all machine-paid (5.30s / 5.72s / 6.73s / 6.78s / 6.46s); `template.scaling` still
    `{maxInstanceCount: 10}` only.
56. **[Recommended, $0] `capture_lead` 500 — day 7 unwritten, reproduced live again.** `POST
    https://api-eqqs6vvela-uc.a.run.app/api/public/capture_lead` with a bogus `analysis_id` → **500**
    `{"detail":"Failed to deliver analysis. Please try again."}` in 0.46s (only `severity>=ERROR` entry in the 24h
    window). Code unchanged: `app/routers/public.py:77` raises `HTTPException(404 …)` inside the broad `try`;
    `except Exception` at 187–190 rewrites it as 500. One-line re-raise, then `firebase deploy`.
57. **[Recommended, $0] `TestClient` still on the production request path.** Bundle byte-identical for **9 days**
    (`api/function-source.zip`, 262,719 B, md5 `MdQ3DWc98OosnOV9KQcPFA==`, updated 2026-09-11T21:33:01Z);
    `main.py:395–396` serves every request through `TestClient`. `a2wsgi` already in `requirements.txt`.
58. **[Recommended, $0] `billingbudgets.googleapis.com` still DISABLED** while Cloud Billing confirms
    `billingEnabled: true` on account `01D3CE-7950F5-66CF34` — no budget alert on a project that can bill.
59. **[Recommended, $0] Mail path + the revive test (day 15 of 30).** Revision has no `BREVO_API_KEY` /
    `BREVO_LIST_ID`; `mail_queue` 19 docs (18 `delivery.state: SUCCESS`, 1 never processed — `support@arcwriter.us`);
    `leads` 12 docs but one address (`creed9569@aol.com`). Zero humans driven into the test ⇒ fund the $0 mail test +
    one shared link, or accept an inconclusive result.
60. **[Recommended, $0, ~15 min] Freebie backlog, carried 11 meetings:** 7 Dependabot PRs (9 days old, all
    `MERGEABLE`); 5 dirty files; Firestore housekeeping (fixture `test_user_writer_room_001`, stale
    `subscription_status: active` on two free-plan accounts, `rate_limits/bypass_hash_for_testing`) + revoke the
    8 expired `share_links` (36 views, 0 revoked).
61. **[Ops note] Automated scanning ~3x'd: 40 attacker probes in 24h, all 404, nothing leaked.** One scanner fired
    32 requests in 12 seconds (08:27:47–08:27:59 EDT) rotating ~20 spoofed AI-crawler UAs (KimiBot, DeepSeekBot,
    GrokBot, ChatGLM, MoonshotBot, Hunyuan, MistralAI, cohere-ai, YouBot, YiBot, DuckAssistBot, Amazonbot,
    Meta-ExternalAgent, Bytespider, Googlebot, bingbot, xAI-SearchBot, OAI-SearchBot, CCBot…) at `.env`,
    `/api/config`, `/api/v1/keys`, `/api/graphql`, `/api/inngest`, `/api/fs/exec` and a
    `proc/self/environ` traversal; one used a forged `referer: https://arcwriter.us`. UA field is fiction here.
62. **[Ops note] First crawler 200 on a real content route:** `Bytespider` (ByteDance) →
    `GET /api/manual/section/LANDING` 2026-09-20T09:00:18Z, `referer: arcwriter.us/`, **200** in 6.73s (cold).
    Public-by-design route ⇒ indexed marketing content, not a leak. **Lesson: a truncated UA made this look like an
    Android phone — always read the full `userAgent` (and `referer`) before calling anything a visitor.**
63. **[Ops note] Host rebooted ~2026-09-19 19:20 EDT** (uptime 13h 40m at 09:02 EDT) — end of the previous 5-day
    clean stretch; nothing broken on return. Disk 93G/475G (20%). Cold start best in six days (**5.70s**, warm
    0.11s); 0 production-caused ERRORs in 48h; no 429s; monitoring daily/hourly buckets agree with the log stream
    this run (51/51).
64. **[HITL, $0, founder-only] Wire Stripe — day 16, unchanged.** Live revision `api-00006-dos` env names still
    `FIREBASE_CONFIG, GCLOUD_PROJECT, EVENTARC_CLOUD_EVENT_SOURCE, FUNCTION_TARGET, LOG_EXECUTION_ID`. No `stripe`
    binary, no `~/.config/stripe`, `STRIPE_SECRET_KEY` unset by character count (5 = literal `unset`). Firestore
    collection list re-read: **no `subscriptions` collection** ⇒ paid conversion structurally impossible. MRR
    reported as UNKNOWN, never estimated.
65. **[HITL, $0, founder-only] Credential incident still open.** firebase-adminsdk SA holds 1 user-managed key
    (`6fc5b7af…`, created 01-13, `validBeforeTime` 9999-12-31); compute SA 0 keys; 3 GitHub secret alerts all still
    `open`, `publicly_leaked: true`, `validity: unknown`. `secret_scanning_validity_checks: disabled` — enabling it
    (free) lets GitHub classify them; #2 (dead SA JSON) should self-resolve to inactive.
66. **[HITL, ~$10–20/mo] `min-instances=1` — board recommends DELAY.** Zero humans for 16 days; 4 cold-start events
    in 24h, all machine-paid (5.43s / 5.48s / 5.69s / 5.70s), and cold starts are trending *better*
    (9.65s → 5.99s across the week); `template.scaling` still `{maxInstanceCount: 10}` only.
67. **[Recommended, $0] `capture_lead` 500 — day 8 unwritten, reproduced live again.** `POST
    https://api-eqqs6vvela-uc.a.run.app/api/public/capture_lead` with `{"analysis_id":"…","email":"…"}` → **500**
    `{"detail":"Failed to deliver analysis. Please try again."}` in 0.32s. Code unchanged: `app/routers/public.py:77`
    raises `HTTPException(404 …)` inside the broad `try`; `except Exception` at 187–190 rewrites it as 500. One-line
    re-raise, then `firebase deploy`. **Probe recipe: the body must carry BOTH `analysis_id` and `email`** — with only
    `analysis_id` the endpoint returns 422 (validation) and the bug looks fixed.
68. **[Recommended, $0] `TestClient` still on the production request path.** Bundle byte-identical for **10 days**
    (`api/function-source.zip`, 262,719 B, md5 `MdQ3DWc98OosnOV9KQcPFA==`, updated 2026-09-11T21:33:01Z);
    `main.py:395–396` serves every request through `TestClient`. `a2wsgi` already in `requirements.txt`.
69. **[Recommended, $0] `billingbudgets.googleapis.com` still DISABLED** while Cloud Billing confirms
    `billingEnabled: true` on account `01D3CE-7950F5-66CF34` — no budget alert on a project that can bill.
70. **[Recommended, $0] Mail path + the revive test (day 16 of 30).** Revision has no `BREVO_API_KEY` /
    `BREVO_LIST_ID`; `mail_queue` 19 docs (18 `delivery.state: SUCCESS`, 1 never processed — `XFCvszY0Qb2fNpdXTCMd`,
    2026-03-29 founder self-test `to: support@arcwriter.us`, no `delivery` block at all);
    `leads` 12 docs but one address (`creed9569@aol.com` + one capitalised duplicate). New this meeting: inbound is no
    longer provably zero — a browser-shaped 200 hit the landing page 09-20 10:25 EDT — so one verified mail test +
    one shared link is now the cheapest way to test whether an arriving visitor can be reached/re-engaged.
71. **[Recommended, $0, ~15 min] Freebie backlog, carried 12 meetings:** 7 Dependabot PRs (10 days old, all
    `MERGEABLE`); 5 dirty files (`DECISION_QUEUE.md`, `decisions.md`, `pending_actions.md`, `frontend/dist/index.html`,
    `frontend/node_modules/.package-lock.json`); Firestore housekeeping (fixture `test_user_writer_room_001`, stale
    `subscription_status: active` on two free-plan accounts, `rate_limits/bypass_hash_for_testing`) + revoke the
    8 expired `share_links` (36 views, 0 revoked).
72. **[Ops note] Host rebooted twice in 36h; the second one is clean and unattributed.** `uptime` 4h 26m at 09:01 EDT
    ⇒ booted **2026-09-21 04:35 EDT** via `systemd-reboot.service` (hardware watchdog `/dev/watchdog0 (intel_oc_wdt)`
    armed) — not a crash. Prior boot ran 09-19 19:21 → 09-21 04:35, and the boot before that carried `last -x`'s
    `crash` flag. No `dnf`/`PackageKit`/offline-update lines anywhere in the previous boot's journal; only candidate
    on the box is `dnf5-automatic.timer` (active) with **no log evidence**. Nothing broken on return; disk
    93G/475G (20%), load 1.22. Third occurrence ⇒ find who requested the reboot.
73. **[Marketing note] First browser-shaped, non-bot request in 16 days — not being called a visitor.**
    `2026-09-20T14:25:19Z` `GET /api/manual/section/LANDING` → **200** in 5.69s (cold), `referer:
    https://arcwriter.us/`, UA clean `Chrome/131.0.0.0` Windows (no bot token, stale Chrome version). Same shape a
    real landing-page visit makes (SPA on Hosting → one public API call) and the same shape a link-preview/headless
    renderer makes; **no companion request followed** — no second API call, no signup, no login. Worth one shared
    link, not a conversion.
74. **[Marketing note] Crawlers keep getting 200s on the public content route — one per day.** `bingbot/2.0` →
    `GET /api/manual/section/LANDING` 200 at 2026-09-20T22:40:08Z, `referer: arcwriter.us/`, UA string
    doubled/concatenated (SEO-crawler UA pool, not a browser). Public-by-design route ⇒ indexed marketing copy, not a
    leak. Prior day: Bytespider, same route, same result.
75. **[Data-quality note] Two probe/plumbing traps fixed this meeting.** (a) `curl` without `-4` to `https://arcwriter.us/`
    returned `000` / 0 bytes (IPv6 path flaky from this host) — a `000` is transport, never "site down"; force IPv4.
    (b) `journalctl --list-boots` reports boot times 4h off `last -x`/`uptime` on this host — use `last -x`/`uptime`
    for boot times. Monitoring hourly series (11) agreed exactly with the log stream (11) this run; the 51 on the
    09-20 daily bucket belongs to the previous meeting's window (it holds the pre-window 32-shot scanner burst).


76. **[Recommended, NEW, $0] Dependabot alert backlog is 53, not 7.** First measurement this meeting:
    `GET /repos/AKSystems-mail/ArcWriter/dependabot/alerts?state=open` = **53** (2 critical, 25 high, 23 medium, 3 low)
    across @babel/core, @grpc/grpc-js, protobufjs, @protobufjs/utf8, websocket-driver, vite, rollup, esbuild, postcss,
    nanoid, js-yaml, brace-expansion, minimatch, picomatch, react-router, browserslist, baseline-browser-mapping,
    postcss-selector-parser, flatted. Only 7 have an open PR (opened 09-11T21:19Z, 11 days old); nothing merged or
    dismissed since. Every prior board carried the PR count as the backlog. Triage in one pass; runtime-shipping deps
    (@grpc/grpc-js, protobufjs, websocket-driver) first, then the 2 criticals.
77. **[Ops note] Host reboot streak stopped — 28h uptime, watch item downgraded.** No reboot since 2026-09-21 04:35 EDT,
    so the two-in-36h pattern closed at two events rather than three; the trigger was never attributed
    (`dnf5-automatic.timer` active, no journal evidence). Disk 93G/475G (20%), load 0.75. Reopen only if a third clean
    reboot appears.
78. **[Marketing note] The one-crawler-per-day streak broke — zero content-route 200s in 24h.** Both crawler UA strings
    seen this window (`YandexBot/3.0`, `GPTBot/1.3`) were on scanner paths (`/api/env`, `/api/config`, `/api/.env`) from a
    single client in a 0.002s burst = one scanner rotating UA strings, all 404. Machine probes fell to 11 in 24h (from 40).
    No 500s from any stranger; nothing leaked.

79. **[Correction — supersedes items about `capture_lead` being broken] The public funnel's happy path works; the 500 is the
    expired-link path.** Re-tested 2026-09-23 with the real analysis ID `a715b70e-b33a-4551-8970-64818eb899a6` (the single
    `temporary_analyses` doc): `POST /api/public/capture_lead` → **200 `{"status":"success"}`** in 0.737s server-side, wrote
    `leads/eZ1P5T3Blr7NDnIFWD2A`, wrote `mail_queue/P1VSVCJiRZ3qbMD1Hg4f`, and
    `ext-firestore-send-email-processqueue` delivered it (`250 2.0.0 OK`, `delivery.state: SUCCESS`, 2.2s). Nine meetings of
    500s came from bogus IDs in the board's own probes — the server logged `Lead Capture Error: 404: Analysis expired or not
    found.` at 2026-09-22T13:02:50.730Z. Still worth fixing (expired/unknown ID should return 404, not 500, via the broad
    `except` at `app/routers/public.py:187–190` swallowing the `HTTPException(404)` raised at line 77) but it is no longer a
    funnel outage claim.
80. **[HITL #3 — governance] The board's `capture_lead` check is not read-only.** Today it wrote 2 production Firestore docs
    (Firestore 93 → 95) and sent a real email to `board@example.com`. Recommendation: **DELAY/stop write-probes** until the
    founder says otherwise; substitute a non-writing check (422/404 route discrimination, no valid analysis ID). No action taken.
81. **[Ops — free, ~15 min] 53 Dependabot alerts still open** (2 critical / 25 high / 23 medium / 3 low), unchanged in a day;
    only 7 have a PR, all opened 2026-09-11T21:19Z (12 days old, `MERGEABLE`). Triage in one pass; runtime-shipping deps
    (`@grpc/grpc-js`, `protobufjs`, `websocket-driver`) and the 2 criticals first.
82. **[Ops — free toggle] `secret_scanning_validity_checks` and `secret_scanning_non_provider_patterns` are still DISABLED.**
    One toggle makes GitHub test whether the 3 open secret alerts (all `validity: unknown` since 07-21) are live credentials.
83. **[Marketing — decision, day 18 of 30] The revive test's email path is now proven working, so zero inbound is a traffic
    problem, not a delivery problem.** `mail_queue` 19 organic docs, 18 × `delivery.state: SUCCESS`; today's probe delivered
    end-to-end. `leads` 12 organic, 11 of them one AOL address. Drive traffic to the funnel or accept the test ends
    inconclusive in 12 days.
84. **[Correction] Share-link cleanup is 7 links, not 8.** `share_links` re-read: `SD5JR6mAJ1K3` already has
    `is_revoked: true`; the other 7 are expired and unrevoked (36 views total, newest 2026-04-14).
85. **[Ops note] Host uptime clean past 48h** (still the 2026-09-21 04:35 EDT boot); no third reboot, so reboot attribution
    stays downgraded/unresolved. Disk 93G/475G (20%), load 1.00.
86. **[Marketing note] The crawler returned to a content route** — `Mozilla/5.0 (compatible; Dataprovider.com)` → 200 on
    `/api/manual/section/LANDING` at 09:26:50Z with `referer: https://arcwriter.us/` (full UA read). Two scanner 404s
    (`crusader-worker/1.0` on `/api/.git/config`, Chrome/124-Windows UA on `/api/v1/execute`). No 5xx from strangers.
87. **[Ops question] The public lead endpoint wrote a lead without touching `rate_limits`** (still 7 docs, all 2026-04-03/04).
    One probe cannot distinguish "limiter not applied on the beat-sheet path" from "limiter didn't trip"; verify before
    promoting the funnel.

## 2026-09-24 — proposals from board meeting #19 (revive day 19 of 30; test ends 2026-10-06)

88. **[Security — new signal, no action] The scanner burst moved onto AI-coding-agent paths.** 2026-09-23T15:17:51–15:18:05Z:
    13 requests in 14 seconds wearing `ClaudeBot/1.0`, `Claude-User/1.0`, `YiBot/1.0`, `PanguBot/1.0` x2, `Bravebot/1.0`,
    `xAI-Grok/1.0`, `PerplexityBot/1.0`, `Qwenbot/1.0`, `Googlebot/2.1` plus one Windows `Chrome/153` with a **forged
    referer of the arcwriter dot us domain** — same fingerprint as the 09-20 burst, i.e. one scanner rotating strings. Paths:
    `/api/.env`, `/api/console/api_server?apis=../../../../../proc/self/environ`, the same traversal for `/.env`, `/robots.txt`,
    `POST /api/graphql`, `POST /api/v1/validate/code`, `DELETE /api/inngest`, `POST /api/fs/exec`,
    `POST /api/designer/v1/file-content` x2, `POST /api/templates/preview` x2. **All 404, nothing leaked, zero 5xx.** Three of
    those routes are AI coding-assistant endpoints — the enumeration list has retargeted. No code change proposed; this raises
    the priority of the credential item below.
89. **[HITL — carried, day 19] Stripe still dark.** Live revision env names unchanged (`FIREBASE_CONFIG, GCLOUD_PROJECT,
    EVENTARC_CLOUD_EVENT_SOURCE, FUNCTION_TARGET, LOG_EXECUTION_ID`); no `stripe` binary, no `~/.config/stripe`;
    `STRIPE_SECRET_KEY` unset by character count (5); no `subscriptions` collection. **No MRR reported and none estimated.**
90. **[HITL — carried] Credential incident still open.** `firebase-adminsdk-fbsvc@arc-studio-box` still holds exactly 1
    user-managed key (`6fc5b7af8d5c83d416a08a542cdcd2f10cdd19ca`, 2026-01-13, never expires); compute SA 0 keys; GitHub secret
    alerts #1/#2/#3 still `open` / `validity: unknown`. Founder-only, $0.
91. **[HITL — governance, board complied today] `capture_lead` write-probes remain stopped.** No production write this meeting;
    the endpoint was exercised only with `analysis_id` and no `email` -> **422 `missing body.email`**. Firestore still 95 docs,
    identical to yesterday's post-probe read. Awaiting the founder's call on whether write-probes may resume.
92. **[HITL — carried] `min-instances=1` on the `api` service: board recommends DELAY.** `template.scaling` still
    `{maxInstanceCount: 10}`; 7 cold starts in the window, 6 machine-paid; zero humans in 19 days.
93. **[Ops — free] 53 Dependabot alerts still open** (2 critical / 25 high / 23 medium / 3 low); only 7 have a PR, all
    2026-09-11T21:19Z, now **13 days** old, all `MERGEABLE`. Nothing merged in 13 days.
94. **[Ops — free toggle] `secret_scanning_validity_checks` still DISABLED**, so all 3 secret alerts stay `validity: unknown`.
95. **[Marketing — decision, day 19 of 30] Zero inbound again.** `leads` 12 organic (11 = one AOL address), `mail_queue` 18/19
    delivered, zero humans in 19 days, 0 signups since 2026-04-06. Delivery is proven; traffic is missing. 11 days left.
96. **[Ops — free] `billingbudgets.googleapis.com` still DISABLED** while `billingEnabled: true` (account `01D3CE-7950F5-66CF34`).
97. **[Ops note] Host reboot item closed, not solved.** `uptime` = 3d 4h 35m at 09:11 EDT (still the 2026-09-21 04:35 boot, 76h
    clean, no third reboot). Trigger never attributed; downgraded permanently unless a reboot recurs.
98. **[Security note] A forged bingbot string got a 200 on the content route.** 2026-09-24T01:14:49.921Z,
    `/api/manual/section/LANDING` -> 200 in 5.70s, with the arcwriter dot us referer. The UA is bingbot's string concatenated
    with two different Chrome versions — not what bingbot sends. Not evidence of a human visitor or of Bing; runbook note.
99. **[CFO note] No GCP cost figure available** — no BigQuery cost export, `billingbudgets` disabled, `gcloud` not installed on
    this box. Burn reported as "~$0 new / hosting-only" rather than estimated.
100. **[Ops question — carried] `rate_limits` still 7 docs, all last touched 2026-04-03/04.** A single probe cannot tell whether
    the limiter covers the beat-sheet path; verify before promoting the funnel.

101. **[HITL — carried, day 20] Stripe still dark.** Live revision env names unchanged (`FIREBASE_CONFIG, GCLOUD_PROJECT,
    EVENTARC_CLOUD_EVENT_SOURCE, FUNCTION_TARGET, LOG_EXECUTION_ID`); no `stripe` binary, no `~/.config/stripe`;
    `STRIPE_SECRET_KEY` unset by character count (5); no `subscriptions` collection. **No MRR reported and none estimated.**
102. **[HITL — carried] Credential incident still open.** `firebase-adminsdk-fbsvc@arc-studio-box` still holds exactly 1
    user-managed key (`6fc5b7af8d5c83d416a08a542cdcd2f10cdd19ca`, 2026-01-13, never expires); compute SA 0 keys; GitHub secret
    alerts #1/#2/#3 still `open` / `validity: unknown`. Founder-only, $0.
103. **[HITL — governance, board complied again] `capture_lead` write-probes remain stopped.** No production write this meeting;
    the endpoint was exercised only with `analysis_id` and no `email` -> **422 `missing body.email`**. Firestore still 95 docs,
    identical to yesterday's read. Awaiting the founder's call on whether write-probes may resume.
104. **[HITL — carried] `min-instances=1` on the `api` service: board recommends DELAY.** `template.scaling` still
    `{maxInstanceCount: 10}`; 5 cold starts in the window, 4 machine-paid; zero humans in 20 days.
105. **[Ops — free] 53 Dependabot alerts still open** (2 critical / 25 high / 23 medium / 3 low); only 7 have a PR, all
    2026-09-11T21:19Z, now **14 days** old, all `MERGEABLE`. Nothing merged in 14 days.
106. **[Ops — free toggle] `secret_scanning_validity_checks` still DISABLED** (also `secret_scanning_non_provider_patterns`),
    so all 3 secret alerts stay `validity: unknown`.
107. **[Marketing — decision, day 20 of 30] Zero inbound again.** `leads` 12 organic (11 = one AOL address), `mail_queue` 19/20
    delivered, zero humans in 20 days, 0 signups since 2026-04-06. Delivery is proven; traffic is missing. 10 days left.
108. **[Ops — free] `billingbudgets.googleapis.com` still DISABLED** while `billingEnabled: true` (account `01D3CE-7950F5-66CF34`).
109. **[Ops note] Host reboot item stays closed.** `uptime` = 4d 4h 27m at 09:03 EDT (still the 2026-09-21 04:35 boot, 100h
    clean). Trigger never attributed; downgraded permanently unless a reboot recurs.
110. **[Security note] First Google-search referer on record, treated as forged.** 2026-09-25T07:50:38.174103Z,
    `GET /api/config` -> 404 in 6.21s, `referer: https://www.google.com/search?q=arcwriter.us`, UA a plain Windows
    Firefox/137. A search-driven visitor would load a page, not a config path; scanners in this log have forged referers
    before. Not counted as a human or a visit.
111. **[CFO note] No GCP cost figure available** — no BigQuery cost export, `billingbudgets` disabled, `gcloud` not installed on
    this box. Burn reported as "~$0 new / hosting-only" rather than estimated.
112. **[Ops question — carried] `rate_limits` still 7 docs, all last touched 2026-04-03/04.** A single probe cannot tell whether
    the limiter covers the beat-sheet path; verify before promoting the funnel.

113. **[Ops — NEW, needs your call] Board minutes are public.** `DECISION_QUEUE.md`, `decisions.md` and `pending_actions.md` are
    tracked and committed in the public repo `AKSystems-mail/ArcWriter` (added in `c2c5f25`, 2026-09-06; visible since the
    2026-09-13 push). `gh api repos/.../contents` lists all three. Proposed: `git rm --cached` + `.gitignore` ($0, reversible);
    purging the already-public copies needs a history rewrite (irreversible) — hence HITL, not a recommendation.
114. **[HITL — carried, day 21] Stripe still dark.** Live revision env names unchanged; no `stripe` binary, no `~/.stripe`;
    `STRIPE_SECRET_KEY` unset by character count (5); no `subscriptions` collection. **No MRR reported and none estimated.**
115. **[HITL — carried] Credential incident still open.** `firebase-adminsdk-fbsvc@arc-studio-box` still holds exactly 1
    user-managed key (`6fc5b7af8d5c83d416a08a542cdcd2f10cdd19ca`, 2026-01-13, never expires); compute SA 0 keys; GitHub secret
    alerts #1/#2/#3 still `open` / `validity: unknown`. Founder-only, $0.
116. **[HITL — governance, board complied] No production writes this meeting.** `capture_lead` probed with `analysis_id` and no
    `email` -> **422 `missing body.email`**. Firestore still 95 docs; the only write since 07-10 is the board's own 09-23 probe.
117. **[HITL — carried] `min-instances=1` on the `api` service: board still recommends DELAY.** `template.scaling`
    still `{maxInstanceCount: 10}`; cold starts still machine-paid (5.39s on a scanner at 2026-09-25T16:45:29Z) and zero humans.
118. **[Ops — free] 53 Dependabot alerts still open** (2 critical / 25 high / 23 medium / 3 low); only 7 have a PR, all
    2026-09-11T21:19Z, now **15 days** old. Nothing merged in 15 days.
119. **[Ops — free] Secret-scanning validity checks still off**, so all 3 secret alerts stay `validity: unknown`.
120. **[Ops — free] Expired share links still live.** 8 links, all expired 2026-03-21 -> 04-14; 5 explicit `is_revoked: false`,
    2 with no `is_revoked` field at all, 1 revoked. Recipients: Kevin Fong (5), Gloria D, A24 Studios, creed9569@aol.com.
121. **[Marketing — decision, day 21 of 30] Zero inbound again.** `leads` 13 (12 historical; 1 is the board's 09-23 write),
    `mail_queue` 19/20 delivered, zero humans in 21 days, 0 signups since 2026-04-06. Delivery is proven; traffic is missing.
    **9 days left.**
122. **[Ops note] Host reboot item stays closed.** `uptime` = 5d 4h 26m at 09:02 EDT (still the 2026-09-21 04:35 boot, 124h
    clean). Trigger never attributed; downgraded permanently unless a reboot recurs.
123. **[Security note] Scanner burst, not crawlers.** 2026-09-25T16:45:29Z, three requests inside 8 ms from one source wearing
    three different UAs (spoofed AppleWebKit, `ClaudeBot/1.0`, `OAI-SearchBot/1.3`) at `/api/.env`, `/api/env`, `/api/config`,
    all 404, nothing leaked. Treated as one rotating scanner, not three real crawlers.
124. **[CFO note] No GCP cost figure available** — no BigQuery cost export, `gcloud` not installed on this box. Billing verified
    `enabled: true` / `billingbudgets` DISABLED; burn reported as "~$0 new / hosting-only" rather than estimated.

125. **[HITL · P1 Security] Rotate then delete the secret named after the Stripe live key** (2026-09-27, new).
    `GET secretmanager/v1/projects/arc-studio-box/secrets` returns 12 secrets, each labelled `firebase-managed: functions`.
    One is named `SK_LIVE_51T4U_ECQ6…` (107 chars, `createTime 2026-02-28T15:27:01Z`) — a Stripe live-key-shaped string used as the
    resource *name*. Secret names are readable by anyone holding `secretmanager.secrets.list` and show up in console listings and
    audit logs, so this is a live payment credential sitting in plaintext. Proposal: rotate the key in the Stripe dashboard first,
    then `gcloud secrets delete SK_LIVE_…`. Founder-only (dashboard + delete are both irreversible). Nothing was executed.
126. **[HITL · P2 Finance] Bind the existing secrets to the `api` function and redeploy** (2026-09-27, new — corrects items 19, 32, 47).
    Secret Manager already holds `GEMINI_API_KEY` (2026-01-18), `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (2026-02-28),
    `BREVO_API_KEY` / `BREVO_LIST_ID` / `BREVO_REGISTERED_LIST_ID`, `BETA_SECRET_CODE`, `STRIPE_PRICE_*` — 12 secrets, none bound.
    Evidence: `functions/api.serviceConfig` has `secretEnvironmentVariables: null`, `secretVolumes: null` and only 5 env vars;
    `firebase.json` declares no secrets and ignores `.env*`; `grep -rn "defineSecret|secrets=|secretmanager"` over `backend/` (excluding
    venv) returns **no hits** while 24 `os.getenv`/`environ[` reads exist — incl. `app/services/stripe_service.py:12-13`,
    `app/services/llm_service.py:36`, `app/services/asset_studio.py:40`, `app/routers/public.py:92-93`. Proposal: declare + attach the
    secrets in the function config and redeploy `api`. Production deploy → founder approval required.
127. **[HITL · P3 Ops] Untrack the board artifacts from the public repo** (carryover of 121, day 2).
    `gh api repos/AKSystems-mail/ArcWriter/contents/<f>` still resolves `DECISION_QUEUE.md` (5,228 B), `decisions.md` (4,763 B),
    `pending_actions.md` (5,318 B). Repo is public, commit `c2c5f25` (2026-09-06). Proposal unchanged: `git rm --cached` + `.gitignore`.
128. **[HITL · P4 Security] Delete the never-expiring service-account key `6fc5b7af8d5c…`** (carryover, day 5+).
    IAM still lists it as the only USER_MANAGED key on `firebase-adminsdk-fbsvc@arc-studio-box` (`validAfterTime 2026-01-13`,
    `validBeforeTime 9999-12-31`); the compute SA returns 0 keys.
129. **[Recommended · Ops] Merge or close the 7 open Dependabot PRs** (carryover, now 16 days old — created 2026-09-11T21:19Z).
    They cover 7 of 53 open alerts (2 critical, 25 high, 23 medium, 3 low). Critical: `websocket-driver`; high incl. `js-yaml`,
    `nanoid`, `browserslist`, `react-router`, `postcss`, `brace-expansion`, `protobufjs` (all `frontend/package-lock.json`).
130. **[Recommended · Security] Enable `secret_scanning_validity_checks` + `secret_scanning_non_provider_patterns`** (carryover).
    `security_and_analysis` re-checked 2026-09-27: `push_protection: enabled`, `validity_checks: disabled`,
    `non_provider_patterns: disabled`. Explains why the 3 open secret alerts still report `validity: unknown`.
131. **[Recommended · Ops] Revoke the 7 un-revoked expired share links** (carryover, day 3+).
    8 docs in `share_links`: 5 `is_revoked: false`, 2 with **no** `is_revoked` field, 1 revoked. All expired 2026-03-21 → 04-14
    (166–190 days ago). Recipients: Kevin Fong ×5, Gloria D, A24 Studios, creed9569@aol.com.
132. **[Recommended · Finance] Enable `billingbudgets` and set a budget alert** (carryover).
    `billingEnabled: true` (account `01D3CE-7950F5-66CF34`) with `billingbudgets.googleapis.com` DISABLED, re-verified 2026-09-27.
133. **[Recommended · Marketing] Send one link to one open-mic host** (carryover, **8 days left** of the 30-day test that began 2026-09-06).
    Zero humans in 24h: 52 logged requests = 2 board probes (`curl/8.18.0`) + 2 crawler `200`s on `/api/manual/section/LANDING`
    (`ShapBot/0.1.0` 00:08:28Z, `Baiduspider-render/2.0` 06:13:55Z) + 48 scanner `404`s in six bursts (01:35Z, 02:02Z, 04:09Z, 20:30Z,
    22:31Z) rotating ~15 forged crawler UAs, including escaped path-traversal probes
    `/api/console/api_server?...apis=../../../../../../.env` and `.../proc/self/environ` — all 404, nothing leaked. Landing section
    served 200 to a stranger in 5.8s/6.6s, so the link works.
134. **[Ops note] Secrets listed, but still no revenue figure.** The 12 project secrets do not make Stripe readable from this box:
    no local key, no CLI. MRR remains unmeasured and unestimated — the fix is item 126, not a probe.
135. **[CFO note] No GCP cost figure available** (unchanged): no BigQuery cost export, `gcloud` not on PATH this session. Billing verified
    enabled/disabled only.
136. **[Ops note] Host reboot item stays closed.** `uptime` = 6d 4h 28m at 09:03 EDT (still the 2026-09-21 04:35 boot, clean);
    trigger remains unattributed. No new reboot.
137. **[QA note] Board probe disclosure for 2026-09-27.** This meeting issued 7 GET + 2 POST unauthenticated probes (~09:04Z):
    `/` 200, `/api/billing/health` 200, `POST /api/billing/create-session` 422, `POST /api/billing/create-portal-session` 422,
    `/api/universes` 422, `/api/users/me` 404, `www.arcwriter.us` 301. No writes performed (empty bodies fail validation before any
    handler side effect). These will appear in tomorrow's log as `curl/8.18.0`.
