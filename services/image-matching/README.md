# Image matching service

A small FastAPI service with one job: notice when two different reported
accounts are using the same product photo. Scam pages that get exposed
tend to rebrand under a new handle — but the stolen product photos are
almost always recycled, because finding fresh photos to steal is more work
than making a new account. This is the photo-based counterpart to the
till/phone-number linking the main app already does with the `identifiers`
table — same idea, different signal.

## How it works

1. A perceptual hash (pHash) is computed for each evidence screenshot —
   a fingerprint of what the image *looks like*, not its exact bytes, so
   resizing or recompression barely changes it. See `app/hashing.py` for
   the actual technique.
2. Every new hash is compared against every other report's already-hashed
   evidence. A close match (small Hamming distance) is recorded in the
   `photo_matches` table.
3. The Next.js app never calls this service to *read* anything — it just
   queries `photo_matches` directly, the same way it already queries
   `identifiers` for the till-number linking feature. This service is
   only ever a writer, triggered once per report.

This service is called exactly once per report, by the Next.js app's
`approveReport` Server Action, right after a moderator approves a report.
It's a deliberately separate process from the Next.js app rather than
logic bolted into it — a different language and runtime for a genuinely
different kind of problem (image processing, not web request/response),
callable over a trivial internal HTTP API.

## Running it locally

```bash
python -m venv .venv
.venv/Scripts/activate        # .venv/bin/activate on macOS/Linux
pip install -r requirements-dev.txt
cp .env.example .env           # then fill in the real values
uvicorn app.main:app --reload --port 8001
```

## Running the tests

```bash
pytest
```

`tests/test_hashing.py` and `tests/test_matching.py` need no network or
database at all — synthetic in-memory images and faked database calls,
respectively. `tests/test_main.py` checks the HTTP layer (auth, status
codes) the same way.

## Deploying it

Not yet deployed anywhere — this runs locally for now. Before launch
(Phase 7), it needs a real host that can run a long-lived Python process
(Render and Fly.io both have straightforward free tiers for this); Vercel,
where the Next.js app will live, cannot run this itself.
