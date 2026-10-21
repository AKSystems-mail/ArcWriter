# Decision Queue — 2026-09-27 (Day 22 of the revive)

> **Executive Summary:** Morning, A.K. Day 22, and today I found something the last three weeks of meetings got wrong: your keys aren't missing. Secret Manager holds 12 of them — Stripe, Gemini, Brevo — and not one is wired to the live function, which is exactly why the app still can't take a payment or hand me a revenue number. Worse, one of those 12 isn't named `STRIPE_SECRET_KEY`; it's named after the Stripe live key itself, so anyone who can list secrets reads it in plain text. That's the one I'd handle today — rotate it in Stripe, then delete the secret. Nobody human came by again: the only two 200s in 24 hours were a Baidu renderer and something called ShapBot, and the other 48 requests were scanners sweeping `.env`, `.git/config` and a path-traversal run at `/proc/self/environ` — all 404, nothing leaked. Host's been up six days clean, production logged zero errors, and the board notes I flagged yesterday are still public in the repo. Eight days left in the revive test and still not one real person.

---

## HITL (needs approval — >$50 or irreversible)

| Priority | Category | Action | Reason | Cost |
|---|---|---|---|---|
| 1 | Security | **Rotate the Stripe live key, then delete the Secret Manager secret whose NAME is that key** (`SK_LIVE_51T4U_ECQ6…`, 107 chars, created 2026-02-28) | **New finding.** `secrets.list` returns 12 secrets, all labelled `firebase-managed: functions`; one is named with a Stripe live-key-shaped string. Secret *names* are not treated as secret — they appear in console listings, `gcloud secrets list` and audit logs — so a live payment credential is sitting in plaintext. Rotation is irreversible and Stripe-side only (you), so it jumps the Finance-first queue: it's the payment rail. | $0 |
| 2 | Finance | **Bind the four existing secrets to the `api` function and redeploy** — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `GEMINI_API_KEY`, `BREVO_API_KEY` + `BREVO_LIST_ID` | **Day 22 with no revenue number, and the keys have been in the project the whole time.** Secret Manager: `GEMINI_API_KEY` (2026-01-18), `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (2026-02-28), `BREVO_*` (2026-02-28). The deployed function has `secretEnvironmentVariables: null`, `secretVolumes: null`, 5 unrelated env vars, and the code contains **zero** `defineSecret()`/secret-ref declarations while reading all four via `os.getenv`. So every credential read returns empty and Stripe/Gemini/Brevo silently no-op. This corrects the "no Stripe key / unwired" framing of the previous 21 meetings: absent from the *runtime*, present in the *project*. Needs your hand — it's a production deploy. | $0 |
| 3 | Ops | Untrack the board artifacts from the public repo — `git rm --cached DECISION_QUEUE.md decisions.md pending_actions.md` + `.gitignore` (carryover, day 2) | Still public: the contents API resolves all three (`DECISION_QUEUE.md` 5,228 B, `decisions.md` 4,763 B, `pending_actions.md` 5,318 B; committed `c2c5f25` 2026-09-06, pushed 09-13). Notes, not credentials — but they contain your security history. Untracking is $0; purging the already-public copies is a history rewrite, hence HITL. | $0 |
| 4 | Security | Delete the never-expiring SA key `6fc5b7af8d5c…` on `firebase-adminsdk-fbsvc@arc-studio-box` (carryover) | IAM still returns it as the only USER_MANAGED key, `validAfterTime 2026-01-13` → `validBeforeTime 9999-12-31`. Compute SA still clean (0 keys). Pairs with the 3 open secret-scanning alerts whose `validity` reads `unknown`. | $0 |

## Recommended

| Priority | Category | Action | Reason |
|---|---|---|---|
| 1 | Ops | Merge or close the 7 open Dependabot PRs (created 2026-09-11, now **16 days** old) | Fastest dent in **53 open alerts** (2 critical, 25 high, 23 medium, 3 low). The 7 PRs cover 7 of the 53. Critical one is `websocket-driver`; also `js-yaml`, `nanoid`, `browserslist`, `react-router`, `postcss`, `brace-expansion`, `protobufjs` — all `frontend/package-lock.json`. |
| 2 | Security | Turn ON `secret_scanning_validity_checks` (+ `non_provider_patterns`) | Re-verified via the repo's `security_and_analysis`: push protection **is** enabled, validity checks **disabled**, non-provider patterns **disabled**. Free toggles, and the only reason the 3 open alerts still read `validity: unknown` instead of resolved. |
| 3 | Ops | Revoke the 7 un-revoked expired share links | 8 links, all expired 2026-03-21 → 04-14 (**166–190 days ago**); 5 carry `is_revoked: false`, 2 have **no `is_revoked` field at all**, only 1 is revoked. Live URLs pointing at client work — Kevin Fong (5), Gloria D, A24 Studios, creed9569@aol.com. They logged 4/2/4/18/4/2/2 views while valid. |
| 4 | Finance | Enable `billingbudgets` + set a budget alert | Re-verified: `billingEnabled: true` (account `01D3CE-7950F5-66CF34`) while `billingbudgets.googleapis.com` is **DISABLED**. A project that can bill with no alert, and the only guardrail available since real cost is unreachable from this host. |
| 5 | Marketing | Send one link to one open-mic host | **8 days left** of the 30-day revive test with zero inbound, ever. The two 200s today prove the landing section serves fine to a stranger (`/api/manual/section/LANDING`, 5.8s and 6.6s) — a link works; nothing else in the data can move the user count. |

## Status at a Glance

- MRR: **unmeasurable — Stripe credentials exist in the project but are not bound to the runtime** (no figure given, none estimated) | Runway: no figures reachable (no cost export, `gcloud` absent) | Billing enabled: yes | Budget alert: none
- Active users: **10** (9 `plan: free`, 1 `test_use` with `plan: explorer`) — newest user **2026-04-06 (174 days)** | DAU/MAU not measurable: no authenticated activity exists to count
- Leads: **13** (newest 2026-09-23 = the 09-23 board probe) | Feedback: 6, all founder self-tests Mar 29–Apr 2 | Firestore: 95 docs, newest organic write **2026-07-10 (79 days)**
- API requests 24h: **52 logged** (2 board probes + 2 crawler 200s + 48 scanner 404s) | Cloud Monitoring daily: **50** (bucket boundary split, log stream authoritative) | Human visitors: **0** | Signups: **0** | Logins: **0**
- Cold start: **6.60s** (Baiduspider-render, 06:13:55Z) | Production ERRORs 24h: **0** | stderr: **0**
- Open PRs: **7** | 16 days old | Open Dependabot alerts: **53** (2 critical, 25 high, 23 medium, 3 low) | Secret-scanning alerts: **3** | Branches: 8
- Deployed: `api-00006-dos` (2026-09-11T21:33Z) — bundle md5 `MdQ3DWc98OosnOV9KQcPFA==`, byte-identical for **16 days** | Last commit `4924a72` (09-11), pushed 09-13 | Host uptime: 6d 4h (boot 2026-09-21 04:35, clean)
- Secret Manager: **12 secrets, 0 bound to the runtime** | Last frontend release 2026-09-06

## Data Sources Queried

- **Secret Manager REST** (`secrets.list`, `arc-studio-box`) — **new this meeting**: 12 secrets with `createTime`/`labels` (all `firebase-managed: functions`)
- **Cloud Functions API v2** — `functions/api` full `serviceConfig`: `secretEnvironmentVariables: null`, `secretVolumes: null`, 5 env vars (`FIREBASE_CONFIG`, `GCLOUD_PROJECT`, `EVENTARC_CLOUD_EVENT_SOURCE`, `FUNCTION_TARGET`, `LOG_EXECUTION_ID`), 4 GiB, 300s, state ACTIVE
- **Firestore REST** (10 collections read): users (10), leads (13), mail_queue (20 — 19 `delivery.state: SUCCESS`, 1 never processed `XFCvszY0Qb2fNpdXTCMd` → support@arcwriter.us), feedback (6), share_links (8), universes (13), campaign_stats, rate_limits, temporary_analyses, temporary_coverage
- **Cloud Logging** (`run.googleapis.com/requests`, window ≥2026-09-26T13:00Z): 52 requests, **0 ERROR, 0 stderr**
- **Cloud Monitoring** (`run.googleapis.com/request_count`, daily + hourly by `response_code`): daily buckets 50 / 13; hourly agrees with the log stream (hour ending 02:03Z = 30 × 404 = the 01:35 + 02:02 bursts)
- **Cloud Run** service + 6 revisions, **Cloud Storage** bundle (`gcf-v2-sources-784508378100`, md5 unchanged), **IAM** key listing (both SAs), **Service Usage** (4 services + `billingbudgets`), **Cloud Billing** `billingInfo`
- **Firebase Hosting** releases API (3 releases; latest 2026-09-06)
- **GitHub API** (`GH_TOKEN` from `~/.hermes/scripts/.github-token`): repo metadata + `security_and_analysis`, `gh issue list` (0 real issues — the 7 in `open_issues_count` are the PRs), open PRs, `dependabot/alerts`, `secret-scanning/alerts`, branches, `contents` listing, latest commit
- **Local repo** (`~/dev/ArcWriter`): `firebase.json` (no secret/`.env` declaration; `backend/.env` absent and ignored), `backend/main.py` + `app/` — `grep` for `defineSecret`/`secrets=`/`secretmanager` → no hits; 24 `os.getenv`/`environ[` reads; `billing.py` routes (health 200; create-session/create-portal-session/webhook/redeem-beta present)
- **Local terminal**: `uptime` / `last -x`, git log/status, `STRIPE_SECRET_KEY` character-count check (`5` = unset in this shell), `stripe` CLI absent
- **Live HTTP probes** (unauthenticated, read-only): `GET https://arcwriter.us/` → **200** (578 B), `GET /api/billing/health` → **200** `{"status":"billing router is live"}`, `POST /api/billing/create-session` → **422**, `POST /api/billing/create-portal-session` → **422**, `GET /api/universes` → **422**, `GET /api/users/me` → **404**, `GET https://www.arcwriter.us/` → **301** (7 GET + 2 POST probes, disclosed as this meeting's own traffic)

### Not queried / not reachable
- **Stripe API** — no key in this shell and no CLI on this host, so no MRR, churn, LTV/CAC or payment-failure data. Note the correction above: the credential *does* exist as a project secret; it just isn't bound, and the board still cannot read Stripe from here.
- **Cost figures** — no BigQuery cost export, `gcloud` not on PATH in this session; billing verified enabled/disabled only, no burn estimate offered.
- **Authenticated app routes** — no end-user Firebase token exists, so route existence is proven by 422-vs-404 probes only.
- **Board probes and bots are not visitors**: the 2 board hits are `curl/8.18.0`; the 2 `200`s are `ShapBot/0.1.0` (00:08:28Z) and `Baiduspider-render/2.0` (06:13:55Z); the 48 remaining are scanner sweeps in six bursts (01:35Z, 02:02Z, 04:09Z, 20:30Z, 22:31Z …) rotating ~15 forged crawler UAs and forging `www.arcwriter.us` referers. A burst of many different UAs in seconds is one scanner, not fifteen crawlers.

*No writes to production were made this meeting. Nothing in `pending_actions.md` was executed.*
