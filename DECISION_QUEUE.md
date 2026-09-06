# Decision Queue — 2026-09-06 (fork day 15 — LANE-DECISION DEADLINE DAY)

> **Executive Summary:** This is the day the deadline was set for, and the ask is still the same as it was fifteen meetings ago: pick a lane for ArcWriter. Say "revive" or "shelve" — either one beats the default, and the default isn't going to execute itself, because I don't touch production without your word. Nothing else has moved: the dead service-account key and the production env file are still sitting in the public repo, revenue's still invisible (no Stripe key on this box), users and leads are flat at 10 and 12 since April, and the repo's been untouched on GitHub since June 6. The one genuinely new thing today: this box rebooted last night (~7:25pm EDT), so the daily cron survived a restart — uptime's 13h and everything came back clean. The one thing I'd do first, today, is still the lane call — and if you want more time, just say so, because "more time" is also a valid answer and it costs nothing.

## HITL (needs approval, >$50 or irreversible)
| Priority | Category | Action | Reason | Cost |
|---|---|---|---|---|
| HIGH — deadline TODAY (09-06) | Strategy | **Pick a lane: revive vs. shelve ArcWriter** | Day 15 of the fork. The 09-06 deadline set on 08-30 has arrived with zero response across 15 board meetings. Per board standing default: SHELVE = point arcwriter.us at ScoutBoard, archive repo, close the queue (reversible: unarchive + repoint, $0). Approve = revive: fresh service key + `firebase deploy` + 30-day test w/ win-back email to 9 external signups. Board will NOT execute the default without your word — reply "revive", "shelve", or "extend the deadline". | $0 |
| High | Security | **Secrets scrub on public repo** | Re-verified today: `backend/serviceAccountKey.json` + `frontend/.env.production` STILL tracked (git ls-files); origin HEAD unchanged (4a7de22, Jun 6) so a live service-account key has been public ~3 months. GitHub confirms secret scanning + push protection + dependabot all DISABLED on the repo — no alerting net. `git rm --cached` + `git filter-repo`. Irreversible → HITL. Lane-independent. | $0 |
| High | Finance | **Wire STRIPE_SECRET_KEY** (needs founder's key — only you have Stripe access) | CFO still blind: env scan today shows no Stripe key; revenue/MRR unverifiable. Moot if shelving, prerequisite for revive. $0, reversible. | $0 |

## Recommended
| Priority | Category | Action | Reason |
|---|---|---|---|
| Medium | Operations | Commit or discard ~3 months of uncommitted local edits (asset_studio.py, llm_service.py, tests, GEMINI.md, package-locks; AUDIT_CHECKLIST.md + board files untracked) | Verified dirty today: 8 files, +103/−134, nothing committed since Jun 6. If you shelve, commit FIRST so this work survives the archive. $0 local commit. |
| Medium | Operations | Delete orphaned ScoutBoard functions from arc-studio-box (analyzeResume, generateKit, scoutChat, scoutFetchJob, requestScoutNow, sendFeedback, suggestProfileFromResume — re-listed today via functions:list; dupes of scoutboard-io) | Dead duplicate backend on your app's project; note `api` function still absent — production backend was never deployed. $0, reversible by redeploy. |
| Low | Finance | Housekeeping batch (pending_actions 08-31): delete test_user_writer_room_001, clear stale `subscription_status=active` on aksystems.mail + starrwulfe (both plan=free), README status note | Firestore hygiene; $0. |
| Low | Ops/Marketing | Diagnose mail_queue: 19 docs STILL pending (counted today, flat since Feb–Apr) despite ext-firestore-send-email extension live on the project | Extension present but queue never drains — SendGrid key suspected (from 08-23). If reviving, win-back email depends on this working. |
| Low | Marketing | Feedback widget reality check | 6 feedback docs, all founder self-tests Mar 29–Apr 2 (verified 09-05, count flat today). Zero real-user entries in 5 months. Not actionable until the lane decision lands. |

## Status at a Glance
- MRR: $0 / UNKNOWN (Stripe key not wired) | Runway: N/A (hosting-only spend; no infra delta)
- Users: 10 | Leads: 12 | Feedback: 6 (all self-test) | mail_queue: 19 stuck — all flat vs. every prior count
- GitHub: 0 stars / 0 issues / 0 forks, last push Jun 6, secret scanning DISABLED
- Secrets tracked in public repo: 2 files | Uncommitted local work: ~3 months (8 files)
- Ops: arcwriter.us live = ArcWriter Studio v2.5.4 (not yet pointed at ScoutBoard); `api` function absent; host rebooted ~19:25 EDT 09-05 (uptime 13h, cron fine)

## Data Sources Queried
- Firestore arc-studio-box (live counts today: users=10, leads=12, feedback=6, mail_queue=19)
- GitHub API (repo metadata: pushed_at 2026-06-06, open_issues 0, archived false; security_and_analysis: secret_scanning/push_protection/dependabot all disabled)
- Git local + origin (`git ls-files` secrets check, `git status` dirty set, `git ls-remote` origin HEAD == 4a7de22, diff stat +103/−134)
- Firebase CLI `functions:list` (arc-studio-box: no `api`; 7 ScoutBoard orphans + deleteAccount + ext-firestore-send-email-processqueue)
- HTTP check arcwriter.us (200, ArcWriter Studio v2.5.4 shell) + env scan (no STRIPE_SECRET_KEY) + uptime 13h37
