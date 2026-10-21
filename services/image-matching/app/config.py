"""Loads this service's own configuration from the environment.

This service is a separate Python process from the Next.js app, so it has
its own .env file (see .env.example) rather than sharing
catch-a-scam/.env.local directly — but it points at the same Supabase
project, using the SAME service-role key the Next.js app's admin scripts
use, since both need to bypass Row Level Security: the Next.js app to
seed/promote, this service to write perceptual hashes and match rows that
no ordinary user is allowed to write themselves.
"""

import os

from dotenv import load_dotenv

load_dotenv()


def _require(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(
            f"Missing required environment variable {name}. "
            "Copy .env.example to .env in services/image-matching and fill it in."
        )
    return value


SUPABASE_URL = _require("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = _require("SUPABASE_SERVICE_ROLE_KEY")

# A shared secret the Next.js app sends on every request, checked in
# main.py. Without this, anyone who found this service's URL could trigger
# it against arbitrary report IDs — low stakes (it only ever reads
# evidence and writes hashes/matches, nothing a visitor could use to
# deface the site) but still not something to leave wide open.
INTERNAL_SECRET = _require("INTERNAL_SECRET")

# Hamming distance, out of a 64-bit perceptual hash (an 8x8 pHash — see
# hashing.py). In practice a distance under ~10 reliably means "the same
# photo, possibly resized or recompressed"; above ~15 is usually an
# unrelated image. 10 is a deliberately conservative choice: a false
# "these are the same photo" claim shown next to someone's account is a
# real accusation, so it's better to miss a few true matches than to
# manufacture one.
MATCH_THRESHOLD = int(os.environ.get("MATCH_THRESHOLD", "10"))
