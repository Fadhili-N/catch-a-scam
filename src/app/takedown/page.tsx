import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'

export const metadata: Metadata = { title: 'Takedown & Right of Reply' }

export default function TakedownPage() {
  return (
    <LegalPage title="Takedown & Right of Reply" updated="21 October 2026">
      <p>
        If a report names your account and you believe it&rsquo;s false, unfair, or about the wrong
        seller, you can ask us to review it. This page explains how, and what to expect.
      </p>

      <h2>How to request a review</h2>
      <p>Email us (address below) with:</p>
      <ul>
        <li>A link to the report or account page in question.</li>
        <li>Your relationship to the account (you own it, run it, or represent it).</li>
        <li>Your side of what happened, with whatever evidence supports it.</li>
      </ul>

      <h2>What happens next</h2>
      <p>
        A moderator reviews your request — we aim to respond within 7 days. Depending on what the review
        finds, a report may be left standing, edited for accuracy, marked with a note reflecting your
        response, or rejected and removed. We do not promise a specific outcome in advance; the review is
        genuinely independent of who asks.
      </p>

      <h2>What we won&rsquo;t do</h2>
      <p>
        We won&rsquo;t remove a report just because the account named in it disputes it, without actually
        reviewing the claim — that would make the whole site meaningless. A report always stays labelled
        as a user allegation, never as proven fact, in either direction; a successful dispute changes
        what&rsquo;s shown, not the underlying principle that nothing here is a final verdict.
      </p>

      <h2>Repeated or bad-faith requests</h2>
      <p>
        We may decline to keep reviewing requests that repeat the same claim without new information, or
        that appear intended to pressure a reporter rather than genuinely dispute the facts.
      </p>

      <h2>Contact</h2>
      <p>[INSERT CONTACT EMAIL]</p>
    </LegalPage>
  )
}
