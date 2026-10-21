"""Orchestrates one report's analysis: hash whatever evidence doesn't have
a hash yet, then compare each hash against every other report's already-
hashed evidence, recording anything close enough to matter.

Kept separate from main.py (the HTTP layer) and db.py (the Supabase calls)
so this function's actual logic — the part worth unit-testing — doesn't
require spinning up a web server or a database to exercise.
"""

from app.config import MATCH_THRESHOLD
from app.db import (
    download_evidence_bytes,
    fetch_other_hashed_evidence,
    fetch_report_evidence,
    save_hash,
    save_match,
)
from app.hashing import compute_phash, hamming_distance


def analyze_report(client, report_id: str) -> dict:
    evidence_rows = fetch_report_evidence(client, report_id)

    hashed_now = []
    for row in evidence_rows:
        if row["perceptual_hash"]:
            continue  # already hashed in an earlier run — don't redo the work
        image_bytes = download_evidence_bytes(client, row["storage_path"])
        row["perceptual_hash"] = compute_phash(image_bytes)
        save_hash(client, row["id"], row["perceptual_hash"])
        hashed_now.append(row["id"])

    candidates = fetch_other_hashed_evidence(client, exclude_report_id=report_id)

    matches_found = []
    for row in evidence_rows:
        if not row["perceptual_hash"]:
            continue
        for candidate in candidates:
            distance = hamming_distance(row["perceptual_hash"], candidate["perceptual_hash"])
            if distance <= MATCH_THRESHOLD:
                save_match(client, row["id"], candidate["id"], distance)
                matches_found.append(
                    {"evidence_id": row["id"], "matched_evidence_id": candidate["id"], "distance": distance}
                )

    return {"report_id": report_id, "hashed": hashed_now, "matches_found": matches_found}
