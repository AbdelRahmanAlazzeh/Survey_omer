# Survey v2: Execution Plan

Source spec: [code_artifact.md](./code_artifact.md). The spec contains no code, and none of the files it names existed before Sprint 1.

## Scope
Only what the spec describes. No extra features in the core survey.

## Sprints

| Sprint | Contents | Status |
|---|---|---|
| 1. Foundation | `server.py` (stdlib only), SQLite schema (faces, raters, trials), `config.json`, static serving with 24 h face cache, anonymous rater ID, resume endpoint, admin-key check, tests | Done, 4/4 tests pass |
| 2. Session logic | 24 faces per sex (least-shown first, half CN / half ME), 30 pairs per sex (cycle plus random links), random sides, no face in consecutive pairs, 2 repeated pairs with swapped sides, per-tap save with RT and server validation | Done, 12/12 tests pass (Sprints 1+2). Assumption to confirm: which `population` values count as Chinese (`han`, `chinese`, `chinese_other`); everything else counts as Middle Eastern |
| 3. Participant front end | `public/` screens: language auto-detect, info and 18+ consent, tap-only questions, instructions, Part 1, break, Part 2, 3 final questions, thank-you; stacked A/B, 0.25 s tap lock, preload next 4 pairs, offline queue with retry, long-press and drag disabled, i18n (中文 / English / العربية), no external fonts or CDN | Not started |
| 4. Researcher and deployment | `tools/prepare_faces.py`, `faces.csv`, `admin.html`, 5 CSV exports, Bradley-Terry scores (all raters, completed raters, per rater group), systemd, Caddy HTTPS, daily backup, `DEVELOPER_HANDOFF.md` | Not started |

## Needed from you
1. Photos in the "pic for test" folder, named number + F/M, plus `chinese` for Chinese faces. Confirm whether you have all 138 or only samples.
2. Confirmation that you have the right to show the volunteers' photos online.
3. Ethics approval number and contact email.
4. Final Chinese, English and Arabic texts. The Arabic in the spec has typos. Chinese study text is missing, so any draft needs a native speaker's review.
5. Hosting decision: Hong Kong server and domain.
6. Admin key, chosen and entered by you in `config.json`. I will not generate or search for credentials.
7. Bradley-Terry method: a standard maximum-likelihood fit that I document, or a specific method you want.

## Known risks
- Behaviour inside China can only be tested from there.
- Face detection in `prepare_faces.py` cannot use the standard library only. Proposal: Pillow plus OpenCV for the offline tool only, needing your approval.

