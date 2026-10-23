# Deploying Catch a Scam

Two separate things to deploy, because they're two separate runtimes:

| Piece | Where | Why there |
|---|---|---|
| Next.js app | Vercel | Built by the same team as Next.js; zero-config deploys straight from GitHub. |
| Python image-matching service | Render (or Fly.io) | A long-lived Python process — Vercel's serverless functions can't run this. |

Both need you to create an account — that part only you can do. The steps below are everything else.

## 1. Deploy the Python service first

The Next.js app needs its URL before it can be configured, so this goes first.

1. Create a free account at [render.com](https://render.com) (sign in with GitHub — same account as this repo).
2. **New -> Web Service**, connect the `catch-a-scam` repo.
3. Set the **Root Directory** to `services/image-matching` — this is a monorepo, and Render needs to know this isn't the repo root.
4. Settings:
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add its environment variables (Render dashboard -> Environment), copying the real values from your local `services/image-matching/.env`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `INTERNAL_SECRET` — generate a **new** one for production rather than reusing the local dev value (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
   - `MATCH_THRESHOLD` = `10`
6. Deploy. Render gives you a URL like `https://catch-a-scam-image-matching.onrender.com`. Keep it — you need it in step 2.

Render's free tier spins the service down after idle periods and takes ~30-60s to wake back up on the next request. `approveReport`'s 10-second timeout (see `src/app/moderate/actions.ts`) will time out against a cold instance — this is a known limitation of the free tier, not a bug. A paid "always on" plan, or Fly.io's always-on free allowance, removes this if it becomes a real problem. Not worth paying for until real moderators are hitting it regularly.

## 2. Deploy the Next.js app

1. Create a free account at [vercel.com](https://vercel.com) (sign in with GitHub).
2. **Add New -> Project**, import the `catch-a-scam` repo. Vercel detects Next.js automatically — no configuration needed for the build itself.
3. Add its environment variables (Vercel dashboard -> Settings -> Environment Variables), copying from your local `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `IMAGE_MATCHING_SERVICE_URL` — the Render URL from step 1, **not** `http://localhost:8001`.
   - `IMAGE_MATCHING_SERVICE_SECRET` — the **new** production secret you generated in step 1, matching exactly.
   - `NEXT_PUBLIC_SITE_URL` — Vercel gives you a URL like `https://catch-a-scam.vercel.app`; use that (or your own domain, if you buy one later).
4. Deploy.

## 3. After both are live

- Open the deployed site and sign up for a real account, then run `npm run promote -- your-email@example.com` **locally** (it uses your local `.env.local`'s service-role key against the same, shared Supabase project — there's nothing to deploy for this script, it's a one-off admin action).
- Replace `[INSERT CONTACT EMAIL]` in `src/app/terms/page.tsx`, `src/app/privacy/page.tsx`, and `src/app/takedown/page.tsx` with a real address once you have one.
- Submit the sitemap to [Google Search Console](https://search.google.com/search-console) (`https://your-domain/sitemap.xml`) so search results start picking up account pages — this is what actually makes "search a handle before paying" work as a real acquisition channel.

## Local development stays the same

Nothing above changes how you run this locally — `npm run dev` plus `uvicorn app.main:app --reload --port 8001` in `services/image-matching`, exactly as before. Production and local are just two different sets of the same environment variables pointing at the same Supabase project (or, later, separate dev/prod Supabase projects, if this gets far enough to need that).
