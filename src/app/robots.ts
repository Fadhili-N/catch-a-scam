import type { MetadataRoute } from 'next'

// Account profile pages and the search page are the whole point of
// indexing this site — someone googling a seller's handle before paying
// is the main way this product helps anyone. Everything else here is
// either an account-management page with no public content of its own
// (login/signup/report/moderate) or plumbing (auth callbacks) — none of
// it should show up in search results.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/login', '/signup', '/report', '/moderate', '/auth/'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/sitemap.xml`,
  }
}
