"""Bradley-Terry attractiveness estimation engine (Sprint 4).

Standard library only (math). Fits pairwise comparison data using Hunter's (2004)
Minorization-Maximization (MM) algorithm with tiny symmetric regularization so
sparse/disconnected graphs and zero-win faces converge cleanly.
"""
import math

CHINESE_RATER_POPS = {"han", "chinese_other"}
MIDEAST_RATER_POPS = {"arab", "persian", "turkish", "kurdish", "mideast_other"}


def fit_bradley_terry(codes, pairs, max_iter=500, tol=1e-8, eps=1e-4):
    """Fit Bradley-Terry log-strengths for `codes` given win/loss `pairs` [(winner, loser), ...].

    Returns dict: code -> {"bt_log_strength": float, "wins": int, "comparisons": int}
    Mean-centered so average bt_log_strength across `codes` is 0.0.
    """
    if not codes:
        return {}
    idx_of = {c: i for i, c in enumerate(codes)}
    n = len(codes)
    wins = [0] * n
    comps = [0] * n
    # pair_counts[(i, j)] = total comparisons between i and j (with i < j)
    pair_counts = {}

    for w, l in pairs:
        wi, li = idx_of.get(w), idx_of.get(l)
        if wi is None or li is None or wi == li:
            continue
        wins[wi] += 1
        comps[wi] += 1
        comps[li] += 1
        key = (wi, li) if wi < li else (li, wi)
        pair_counts[key] = pair_counts.get(key, 0) + 1

    # Adjacency list for fast MM updates
    adj = [[] for _ in range(n)]
    for (i, j), cnt in pair_counts.items():
        adj[i].append((j, cnt))
        adj[j].append((i, cnt))

    pi = [1.0] * n
    if pair_counts:
        for _ in range(max_iter):
            new_pi = [1.0] * n
            for i in range(n):
                denom = eps
                pi_i = pi[i]
                for j, cnt in adj[i]:
                    denom += cnt / (pi_i + pi[j])
                new_pi[i] = (wins[i] + eps) / denom

            # Normalize geometric mean to 1.0 (sum of logs = 0.0)
            mean_log = sum(math.log(max(v, 1e-15)) for v in new_pi) / n
            scale = math.exp(-mean_log)
            new_pi = [v * scale for v in new_pi]

            diff = max(abs(new_pi[i] - pi[i]) / max(pi[i], 1e-12) for i in range(n))
            pi = new_pi
            if diff < tol:
                break

    out = {}
    for i, c in enumerate(codes):
        out[c] = {
            "bt_log_strength": round(math.log(max(pi[i], 1e-15)), 4),
            "wins": wins[i],
            "comparisons": comps[i],
        }
    return out


def rater_subgroup(population):
    p = (population or "").strip().lower()
    if p in CHINESE_RATER_POPS:
        return "chinese"
    if p in MIDEAST_RATER_POPS:
        return "mideast"
    return "other"


def compute_bt_rows(faces, trials, raters, completed_only=False):
    """Compute bt_scores rows across (face_sex, rater_group).

    Args:
      faces: iterable of dict/Row with code, sex, population, status
      trials: iterable of dict/Row with rater_id, left_code, right_code, is_repeat, winner
      raters: iterable of dict/Row with id, population, completed_at
    """
    eligible_raters = {}
    for r in raters:
        if completed_only and r["completed_at"] is None:
            continue
        eligible_raters[r["id"]] = rater_subgroup(r["population"])

    active_by_sex = {"F": [], "M": []}
    face_meta = {}
    for f in faces:
        face_meta[f["code"]] = (f["sex"], f["population"])
        if f["status"] == "active" and f["sex"] in active_by_sex:
            active_by_sex[f["sex"]].append(f["code"])

    # Group non-repeat answered trials into (face_sex, rater_group)
    pairs_by_bucket = {
        ("F", "all"): [], ("F", "chinese"): [], ("F", "mideast"): [],
        ("M", "all"): [], ("M", "chinese"): [], ("M", "mideast"): [],
    }
    for t in trials:
        if t["is_repeat"] or t["winner"] not in ("left", "right"):
            continue
        grp = eligible_raters.get(t["rater_id"])
        if grp is None:
            continue
        meta = face_meta.get(t["left_code"])
        if not meta or meta[0] not in ("F", "M"):
            continue
        fsex = meta[0]
        w_code = t["left_code"] if t["winner"] == "left" else t["right_code"]
        l_code = t["right_code"] if t["winner"] == "left" else t["left_code"]
        pairs_by_bucket[(fsex, "all")].append((w_code, l_code))
        if grp in ("chinese", "mideast"):
            pairs_by_bucket[(fsex, grp)].append((w_code, l_code))

    rows = []
    for fsex in ("F", "M"):
        codes = sorted(active_by_sex[fsex])
        for rgrp in ("all", "chinese", "mideast"):
            fitted = fit_bradley_terry(codes, pairs_by_bucket[(fsex, rgrp)])
            for code in codes:
                _, fpop = face_meta[code]
                stats = fitted[code]
                rows.append({
                    "code": code,
                    "face_sex": fsex,
                    "face_population": fpop,
                    "rater_group": rgrp,
                    "bt_log_strength": stats["bt_log_strength"],
                    "wins": stats["wins"],
                    "comparisons": stats["comparisons"],
                })
    return rows

