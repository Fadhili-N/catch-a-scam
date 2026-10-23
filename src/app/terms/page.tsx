import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'

export const metadata: Metadata = { title: 'Terms of Use' }

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="21 October 2026">
      <p>
        Catch a Scam lets anyone search a TikTok or Instagram selling account before paying, and lets
        signed-up users publish a documented report when they believe they were scammed. Reading and
        searching is always free and requires no account. Posting a report, commenting, or filing a
        takedown request requires one.
      </p>

      <h2>Reports are allegations, not verified facts</h2>
      <p>
        A report reflects one person&rsquo;s account of a transaction, reviewed by a moderator before
        publication but not independently investigated or proven in any legal sense. We present reports as
        what they are — a documented allegation with evidence attached — not as a finding that someone is
        guilty of fraud.
      </p>

      <h2>What you may report</h2>
      <p>
        Report the trading handle or account that scammed you — the username, not a person&rsquo;s legal
        name. This site is built around social-media selling accounts, not individuals, deliberately: a
        handle is a fact you can document (who you paid, who you spoke to); naming a private individual is
        an accusation this site is not designed to carry responsibly. A report that primarily targets a
        named individual rather than a trading account may be removed.
      </p>

      <h2>What you must not do</h2>
      <ul>
        <li>File a report you know to be false, exaggerated, or about the wrong account.</li>
        <li>Upload someone else&rsquo;s personal information that isn&rsquo;t your own to redact and share.</li>
        <li>Use this site to harass, intimidate, or settle an unrelated dispute with someone.</li>
        <li>Attempt to access, scrape, or copy data here beyond ordinary use of the public pages.</li>
        <li>Attempt to self-assign a moderator role or otherwise bypass the review process described below.</li>
      </ul>

      <h2>Evidence and redaction</h2>
      <p>
        A report needs supporting evidence — screenshots of the conversation and payment. You are
        responsible for blacking out your own personal details (name, phone number, balance) before
        submitting; the submission tool requires this step. Evidence you upload is never shown publicly —
        only to you and to moderators reviewing the report.
      </p>

      <h2>Moderation</h2>
      <p>
        Nothing you submit appears publicly until a moderator reviews it. A moderator may approve, reject,
        or request changes to a report, and may remove a comment. Verification badges, where offered to
        sellers in future, confirm identity only — they never hide, remove, or downrank a report filed
        against that seller.
      </p>

      <h2>No warranty</h2>
      <p>
        This site is provided as-is. We do not guarantee that a search result is complete, that an unlisted
        account is safe, or that a published report is accurate — only that it passed moderator review. To
        the fullest extent the law allows, we are not liable for a transaction you enter into with any
        account listed or not listed here.
      </p>

      <h2>Accounts and enforcement</h2>
      <p>
        We may suspend or remove an account that violates these terms, remove a report or comment at any
        time, and refuse service to anyone. See our{' '}
        <a href="/takedown" className="underline">
          takedown and right-of-reply policy
        </a>{' '}
        if you believe a report about your business is false or unfair.
      </p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of Kenya.</p>

      <h2>Contact</h2>
      <p>[INSERT CONTACT EMAIL]</p>
    </LegalPage>
  )
}
