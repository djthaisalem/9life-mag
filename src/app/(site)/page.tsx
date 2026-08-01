import HomePageClient from '@/components/home-page-client'
import { listPublicArticles } from '@/lib/public-articles'

export const revalidate = 60

export default async function HomePage() {
  try {
    const articles = await listPublicArticles()
    return <HomePageClient initialArticles={articles} />
  } catch (error) {
    console.error('Home page initial article load failed', error)
    return <HomePageClient />
  }
}
