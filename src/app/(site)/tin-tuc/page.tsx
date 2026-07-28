import { NewsPageClient } from '@/components/news-page-client'

export default function NewsPage() {
  // Keep the public page independent from Payload startup. Live articles are
  // loaded by the client API, so a temporary CMS error cannot take down /tin-tuc.
  return <NewsPageClient initialCmsArticles={[]} />
}
