"""The one place this service talks to Supabase. Every call here uses the
service-role key, which bypasses Row Level Security entirely — correct for
this service specifically, since writing a perceptual hash or a
photo_matches row is not something any ordinary user's RLS policy allows
(see 0005_photo_matches.sql: there is no INSERT policy at all, on purpose).
"""

from functools import lru_cache

from supabase import Client, create_client

from app.config import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL


@lru_cache
def get_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def fetch_report_evidence(client: Client, report_id: str) -> list[dict]:
    response = client.table("evidence").select("id, report_id, storage_path, perceptual_hash").eq(
        "report_id", report_id
    ).execute()
    return response.data


def fetch_other_hashed_evidence(client: Client, exclude_report_id: str) -> list[dict]:
    """Every evidence row that already has a hash, belonging to a DIFFERENT
    report — comparing a report's evidence against itself would be
    meaningless (of course two screenshots in the same report are
    "unrelated"; that's not what we're checking)."""
    response = (
        client.table("evidence")
        .select("id, report_id, perceptual_hash")
        .not_.is_("perceptual_hash", "null")
        .neq("report_id", exclude_report_id)
        .execute()
    )
    return response.data


def download_evidence_bytes(client: Client, storage_path: str) -> bytes:
    return client.storage.from_("evidence").download(storage_path)


def save_hash(client: Client, evidence_id: str, perceptual_hash: str) -> None:
    client.table("evidence").update({"perceptual_hash": perceptual_hash}).eq("id", evidence_id).execute()


def save_match(client: Client, evidence_id_a: str, evidence_id_b: str, distance: int) -> None:
    # Canonical ordering so (a, b) and (b, a) are always the same row —
    # enforced again by a CHECK constraint in the migration, so a bug here
    # fails loudly instead of silently storing a duplicate.
    lo, hi = sorted([evidence_id_a, evidence_id_b])
    client.table("photo_matches").upsert(
        {"evidence_id": lo, "matched_evidence_id": hi, "hamming_distance": distance},
        on_conflict="evidence_id,matched_evidence_id",
    ).execute()
