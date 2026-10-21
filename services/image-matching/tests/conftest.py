"""app/config.py raises at import time if its required environment
variables are missing — correct for the real service (fail fast on
misconfiguration, not on the first request), but it means every test file
that imports anything from app.* needs these set first. conftest.py is
loaded by pytest before the test modules in its directory, so setting them
here, with throwaway values, makes the whole suite runnable with no real
Supabase project at all.
"""

import os

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("INTERNAL_SECRET", "test-internal-secret")
