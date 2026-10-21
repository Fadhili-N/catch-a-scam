"""The HTTP surface. Thin on purpose — every function here either checks
the request or hands off to matching.py/db.py, so there is exactly one
place (matching.py) that needs real tests for its logic.
"""

from fastapi import Depends, FastAPI, Header, HTTPException

from app.config import INTERNAL_SECRET
from app.db import get_client
from app.matching import analyze_report

app = FastAPI(title="Catch a Scam — image matching service")


def require_internal_secret(x_internal_secret: str = Header(default="")) -> None:
    if x_internal_secret != INTERNAL_SECRET:
        raise HTTPException(status_code=401, detail="Missing or incorrect X-Internal-Secret header.")


@app.get("/health")
def health() -> dict:
    # Deliberately no auth — this is just "is the process up", for whatever
    # hosting platform ends up polling it, not a data endpoint.
    return {"status": "ok"}


@app.post("/internal/reports/{report_id}/analyze")
def analyze(report_id: str, _: None = Depends(require_internal_secret)) -> dict:
    """Called by the Next.js app's approveReport Server Action right after
    a moderator approves a report. Hashes any of its evidence that isn't
    hashed yet, and records any close match against evidence from other
    reports. Idempotent: calling it again re-checks for new matches but
    never re-hashes or re-inserts what's already there."""
    try:
        client = get_client()
        return analyze_report(client, report_id)
    except Exception as exc:  # noqa: BLE001 — deliberately broad: this is
        # the outermost boundary before the response goes out, and any
        # failure here (a bad storage path, a malformed image, a network
        # blip talking to Supabase) should come back as a clear 500 rather
        # than an unhandled crash, since the caller already treats this
        # whole request as best-effort and non-fatal to report approval.
        raise HTTPException(status_code=500, detail=str(exc)) from exc
