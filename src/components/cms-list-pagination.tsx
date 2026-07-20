import Link from 'next/link'

export const CMS_LIST_PAGE_SIZE = 20

type CmsListPaginationProps = {
  page: number
  totalItems: number
  baseHref: string
}

function getPageHref(baseHref: string, page: number) {
  const separator = baseHref.includes('?') ? '&' : '?'
  return `${baseHref}${separator}page=${page}`
}

export function CmsListPagination({ page, totalItems, baseHref }: CmsListPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / CMS_LIST_PAGE_SIZE))

  return (
    <nav className="cms-list-pagination" aria-label="Phân trang danh sách">
      <span>Trang {page} / {totalPages} · {totalItems} mục</span>
      <div>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
          <Link
            key={pageNumber}
            href={getPageHref(baseHref, pageNumber)}
            className={pageNumber === page ? 'cms-page-button cms-page-button-active' : 'cms-page-button'}
          >
            {pageNumber}
          </Link>
        ))}
      </div>
    </nav>
  )
}
