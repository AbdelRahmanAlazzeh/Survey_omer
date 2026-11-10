"""Session building (Sprint 2): face selection and pair design.

Standard library only. Rules from the spec:
  - per sex: faces_per_sex faces, least-shown first, half group A / half group B
  - pairs_per_sex pairs: a cycle through every face plus random extra links
  - random left/right, no item in two consecutive pairs
  - repeat pairs (sides swapped) at the end of each part
"""
import itertools

# Populations counted as group A; every other population counts as group B.
# This mapping is an assumption: confirm it against the final faces.csv values.
GROUP_A_POPULATIONS = {"han", "chinese", "chinese_other"}


class NotEnoughFaces(Exception):
    pass


def in_group_a(population):
    return population.strip().lower() in GROUP_A_POPULATIONS


def validate_settings(faces_per_sex, pairs_per_sex, repeat_pairs_per_sex):
    if faces_per_sex < 4 or faces_per_sex % 2:
        raise ValueError("faces_per_sex must be an even number >= 4")
    if pairs_per_sex < faces_per_sex:
        raise ValueError("pairs_per_sex must be >= faces_per_sex (the cycle needs one pair per face)")
    if pairs_per_sex > faces_per_sex * (faces_per_sex - 1) // 2:
        raise ValueError("pairs_per_sex exceeds the number of distinct pairs")
    if repeat_pairs_per_sex < 0 or repeat_pairs_per_sex > pairs_per_sex:
        raise ValueError("invalid repeat_pairs_per_sex")


def select_faces(rows, per_sex, rng):
    """rows: iterable of (code, population, shown_count) for ONE sex.
    Returns per_sex codes, half from each group, least-shown first (random tie-break)."""
    group_a, group_b = [], []
    for code, population, shown in rows:
        (group_a if in_group_a(population) else group_b).append((shown, rng.random(), code))
    half = per_sex // 2
    if len(group_a) < half or len(group_b) < half:
        raise NotEnoughFaces(f"need {half} per group, have {len(group_a)} and {len(group_b)}")
    group_a.sort()
    group_b.sort()
    return [c for _, _, c in group_a[:half]] + [c for _, _, c in group_b[:half]]


def _arrange(pairs, rng, tries=200):
    """Order pairs so no two consecutive pairs share a face, or None."""
    for _ in range(tries):
        pool = pairs[:]
        rng.shuffle(pool)
        seq = []
        while pool:
            prev = set(seq[-1]) if seq else set()
            ok = [p for p in pool if not (set(p) & prev)]
            if not ok:
                break
            choice = rng.choice(ok)
            pool.remove(choice)
            seq.append(choice)
        if not pool:
            return seq
    return None


def build_pairs(faces, n_pairs, n_repeat, rng):
    """Returns a list of (left, right, is_repeat) for one part."""
    n = len(faces)
    for _ in range(100):
        order = faces[:]
        rng.shuffle(order)
        cycle = {frozenset((order[i], order[(i + 1) % n])) for i in range(n)}
        others = [frozenset(p) for p in itertools.combinations(faces, 2)
                  if frozenset(p) not in cycle]
        chosen = list(cycle) + rng.sample(others, n_pairs - len(cycle))
        seq = _arrange([tuple(sorted(e)) for e in chosen], rng)
        if seq is None:
            continue
        main = [(a, b) if rng.random() < 0.5 else (b, a) for a, b in seq]
        for _ in range(200):
            picks = rng.sample(main, n_repeat)
            repeats = _arrange([(r, l) for l, r in picks], rng)
            if repeats is None:
                continue
            if main[-1] and repeats and set(main[-1]) & set(repeats[0]):
                continue
            return [(l, r, 0) for l, r in main] + [(l, r, 1) for l, r in repeats]
    raise RuntimeError("could not build a valid pair sequence")

