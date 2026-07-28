import { NewsPageClient } from '@/components/news-page-client'
import { listPublicArticles, type PublicNewsArticle } from '@/lib/public-articles'

export const dynamic = 'force-dynamic'

export default async function NewsPage() {
  let articles: PublicNewsArticle[] = []
  try {
    articles = await listPublicArticles()
  } catch (error) {
    console.error('News page article query failed', error)
  }

  return <NewsPageClient initialCmsArticles={articles} />
}
