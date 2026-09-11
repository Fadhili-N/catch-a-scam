# Catch a Scam

A public, searchable record of social-commerce fraud in Kenya.

Many Kenyans buy clothes, shoes and accessories from sellers on TikTok and
Instagram. A recurring pattern: an attractive product is posted, the buyer is
moved to WhatsApp, money is sent via M-Pesa, and the seller blocks them. The
account keeps trading because there is nowhere for victims to leave a durable,
searchable warning.

This project lets anyone **check a seller account before paying**, and lets
victims **publish a documented report** of what happened.

## Principles

These constrain every design decision in this repository.

1. **Reading is free and anonymous.** No account is required to search or read
   reports. Accounts are required only to post or comment.
2. **We report accounts, not people.** The subject of a report is a trading
   handle (`@example` on TikTok/Instagram) — never an individual's legal name.
3. **Nothing publishes automatically.** Every report passes through human
   moderation before it becomes visible.
4. **Evidence is required, and redacted.** A report must carry proof. Uploaders
   must black out their own personal details before submitting.
5. **Language stays factual.** Reports are "reported", never "confirmed guilty".
6. **Verification never suppresses a report.** A paid verified badge does not
   hide, remove, or downrank anything filed against that seller.

## Architecture

| Component | Technology | Responsibility |
|---|---|---|
| Web application | Next.js 16 (App Router), TypeScript, Tailwind CSS | Public pages, auth, report submission, moderation |
| Database & auth | Supabase (PostgreSQL) | Data, Row Level Security, user accounts |
| File storage | Supabase Storage | Evidence screenshots (private bucket) |
| Intelligence service | Python, FastAPI | Perceptual image hashing, duplicate detection, linking accounts by reused product photos |

The web app is server-rendered so that report pages are indexable by search
engines — most users will arrive from a search for a seller's handle.

## Getting started

Requirements: Node.js 20+, npm.

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase credentials
npm run dev
```

The app runs at http://localhost:3000.

## Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Produce a production build (also type-checks) |
| `npm run start` | Serve a production build |
| `npm run lint` | Run ESLint |

## Project status

Under active development. See the roadmap in project notes; currently at
**Phase 0 — foundations**.

## Legal

Reports are user-submitted allegations, not findings of fact. The project
operates a published takedown and right-of-reply process. Personal data is
handled in line with Kenya's Data Protection Act, 2019.
