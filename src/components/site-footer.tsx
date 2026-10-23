import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-zinc-500">
        <span>&copy; {new Date().getFullYear()} Catch a Scam</span>
        <nav className="flex gap-4">
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
          <Link href="/takedown" className="hover:underline">
            Takedown & right of reply
          </Link>
        </nav>
      </div>
    </footer>
  )
}
