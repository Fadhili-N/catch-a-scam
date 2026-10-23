import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'

export const metadata: Metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="21 October 2026">
      <p>
        This policy explains what we collect and why, in line with Kenya&rsquo;s Data Protection Act,
        2019. Searching and reading reports requires no account and no personal data from you at all.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details</strong> — your email address, if you sign up to post or comment.
        </li>
        <li>
          <strong>Report content</strong> — the account you report, the story you write, and the payment
          or contact details you cite about that account.
        </li>
        <li>
          <strong>Evidence</strong> — screenshots you upload. We require you to black out your own
          personal details before uploading, but we cannot guarantee you caught everything, so treat
          anything you upload as sensitive. Evidence is never shown publicly; only you and a moderator can
          view it.
        </li>
        <li>
          <strong>Anonymous usage data</strong> — page views and search activity, collected without an
          account and not tied to your identity, used to understand what people are checking before they
          pay.
        </li>
      </ul>

      <h2>Why we process it</h2>
      <p>
        Account details are processed with your consent, given at signup. Report content is processed on
        the basis of our and the public&rsquo;s legitimate interest in preventing fraud — this is why an
        approved report&rsquo;s text and cited identifiers become public, while the underlying evidence
        does not.
      </p>

      <h2>Who can see what</h2>
      <p>
        An approved report&rsquo;s story, amount, and cited identifiers are public. Evidence images are
        visible only to you and to moderators, through a temporary access link generated at the moment of
        viewing — never a permanent public URL. A pending or rejected report is visible only to you and
        moderators, not the public.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep report data for as long as it remains relevant to warning others, or until you request its
        removal and we have no overriding reason to keep it (see our{' '}
        <a href="/takedown" className="underline">
          takedown policy
        </a>
        ). Account data is kept until you delete your account.
      </p>

      <h2>Who else processes it</h2>
      <p>
        We use Supabase to host our database, authentication, and file storage, and a privacy-respecting
        analytics tool to count visits. Neither is permitted to use your data for their own purposes. We
        do not sell personal data to anyone.
      </p>

      <h2>Your rights</h2>
      <p>
        Under the Data Protection Act, 2019, you can ask us what we hold about you, ask us to correct it,
        ask us to delete it, or object to how we use it. Contact us (below) to exercise any of these —
        we&rsquo;ll respond within a reasonable time and tell you if a request can&rsquo;t be fully met (for
        example, because a report is still relevant to an active dispute).
      </p>

      <h2>Children</h2>
      <p>This site is not intended for anyone under 18.</p>

      <h2>Changes</h2>
      <p>If this policy changes materially, we&rsquo;ll update the date at the top of this page.</p>

      <h2>Contact</h2>
      <p>[INSERT CONTACT EMAIL]</p>
    </LegalPage>
  )
}
