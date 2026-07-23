'use client'

import { Share2 } from 'lucide-react'
import { useState } from 'react'
import { createReferralShareUrl } from '@/lib/client-referrals'
import { copyText } from '@/lib/client-share'

export function ArticleShareButton({ slug, title }: { slug: string; title: string }) {
  const [message, setMessage] = useState('')
  const share = async () => {
    const result = await createReferralShareUrl(`/tin-tuc/${slug}`)
    const url = result.ok && result.url ? result.url : `${window.location.origin}/tin-tuc/${slug}`
    if (navigator.share) {
      try {
        await navigator.share({ title, text: 'Đọc bài viết mới trên 9LIFE MAG', url })
        setMessage('Đã mở bảng chia sẻ bài viết.')
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    const copied = await copyText(url)
    if (!copied) window.prompt('Copy link bài viết', url)
    setMessage(result.ok ? 'Đã sao chép link referral. Lượt truy cập hợp lệ có thể nhận sao.' : 'Đã sao chép link bài viết.')
  }
  return <div className="article-share-action"><button type="button" className="button-secondary" onClick={() => void share()}><Share2 size={16} /> Chia sẻ</button>{message ? <small>{message}</small> : null}</div>
}
