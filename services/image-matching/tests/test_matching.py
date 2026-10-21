"""Tests the orchestration logic in matching.py in isolation from both the
real hashing algorithm and the real database — every function
analyze_report calls is replaced with a fake via monkeypatch, so this file
is testing one thing: given hashes and distances, does analyze_report skip
what it should skip and record what it should record.

(hashing.py's own correctness is covered separately in test_hashing.py.)
"""

import app.matching as matching


def test_analyze_report_skips_already_hashed_evidence_and_records_only_close_matches(monkeypatch):
    report_rows = [
        {"id": "E1", "report_id": "R1", "storage_path": "p1", "perceptual_hash": None},
        {"id": "E2", "report_id": "R1", "storage_path": "p2", "perceptual_hash": "existing-hash"},
    ]
    candidates = [
        {"id": "E3", "report_id": "R2", "perceptual_hash": "close-hash"},  # should match
        {"id": "E4", "report_id": "R3", "perceptual_hash": "far-hash"},  # should not match
    ]
    saved_hashes = []
    saved_matches = []

    monkeypatch.setattr(matching, "fetch_report_evidence", lambda client, report_id: report_rows)
    monkeypatch.setattr(matching, "fetch_other_hashed_evidence", lambda client, exclude_report_id: candidates)
    monkeypatch.setattr(matching, "download_evidence_bytes", lambda client, path: b"fake-bytes-for-" + path.encode())
    monkeypatch.setattr(matching, "compute_phash", lambda image_bytes: "new-hash")
    monkeypatch.setattr(matching, "save_hash", lambda client, evidence_id, h: saved_hashes.append((evidence_id, h)))
    monkeypatch.setattr(
        matching, "save_match", lambda client, a, b, distance: saved_matches.append((a, b, distance))
    )
    # MATCH_THRESHOLD defaults to 10 (app/config.py) — 5 is a clear match, 50 is not.
    monkeypatch.setattr(matching, "hamming_distance", lambda a, b: 5 if b == "close-hash" else 50)

    result = matching.analyze_report(client=object(), report_id="R1")

    assert result["hashed"] == ["E1"]  # E2 already had a hash and was left alone
    assert saved_hashes == [("E1", "new-hash")]

    # Both E1 (freshly hashed) and E2 (already hashed) get compared against
    # every candidate — E3 is close enough to record, E4 is not.
    matched_pairs = {(m["evidence_id"], m["matched_evidence_id"]) for m in result["matches_found"]}
    assert matched_pairs == {("E1", "E3"), ("E2", "E3")}
    assert len(saved_matches) == 2
    assert all(distance == 5 for _, _, distance in saved_matches)
