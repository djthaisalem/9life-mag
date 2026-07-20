'use client'

import { Share2 } from 'lucide-react'
import { useState } from 'react'
import { createReferralShareUrl } from '@/lib/client-referrals'

export function ArticleShareButton({ slug, title }: { slug: string; title: string }) {
  const [message, setMessage] = useState('')
  const share = async () => {
    const result = await createReferralShareUrl(`/tin-tuc/${slug}`)
    const url = result.ok && result.url ? result.url : `${window.location.origin}/tin-tuc/${slug}`
    if (navigator.share) {
      try { await navigator.share({ title, text: 'Đọc bài viết mới trên 9LIFE MAG', url }) } catch { return }
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
    }
    setMessage(result.ok ? 'Link chia sẻ đã sẵn sàng. Lượt truy cập hợp lệ có thể nhận sao referral.' : 'Đã sao chép link bài viết.')
  }
  return <div className="article-share-action"><button type="button" className="button-secondary" onClick={() => void share()}><Share2 size={16} /> Chia sẻ</button>{message ? <small>{message}</small> : null}</div>
}
