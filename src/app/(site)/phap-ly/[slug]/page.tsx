import Link from 'next/link'
import { notFound } from 'next/navigation'
import { legalPages } from '@/lib/site-data'

export default async function LegalDetailPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const page = legalPages[slug as keyof typeof legalPages]

  if (!page) {
    notFound()
  }

  return (
    <main>
      <section className="section">
        <div className="container article-layout">
          <div className="tag-row">
            <span className="pill">{page.category}</span>
            <span className="pill">{page.date}</span>
          </div>

          <h1 className="page-title article-title">{page.title}</h1>
          <p className="page-intro article-summary">{page.summary}</p>

          <div className="article-body-shell">
            {page.body.map((paragraph) => (
              <p key={paragraph} className="article-paragraph">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="article-actions">
            <Link href="/" className="button-secondary">
              Về trang chủ
            </Link>
            <Link href="/tin-tuc" className="button-secondary">
              Xem tin tức
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
