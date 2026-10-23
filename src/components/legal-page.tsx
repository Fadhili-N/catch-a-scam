import Link from 'next/link'

/**
 * Shared shell for the three legal pages. No typography plugin is
 * installed, so instead of repeating spacing classes on every <h2>/<p>/
 * <ul> in three separate files, this one wrapper applies them via
 * Tailwind's direct-child selectors — the content files themselves stay
 * plain semantic HTML.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto max-w-2xl px-4 py-16">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← Back
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900">{title}</h1>
        <p className="mt-1 text-xs text-zinc-400">Last updated {updated}</p>
        <div className="mt-6 text-sm text-zinc-700 [&>h2]:mt-6 [&>h2]:text-base [&>h2]:font-semibold [&>h2]:text-zinc-900 [&>p]:mt-2 [&>p]:leading-relaxed [&>ul]:mt-2 [&>ul]:list-disc [&>ul]:space-y-1 [&>ul]:pl-5">
          {children}
        </div>
      </main>
    </div>
  )
}
