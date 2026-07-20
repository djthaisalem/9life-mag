import type { ReactNode } from 'react'

type CmsListTableProps = {
  className?: string
  headers: string[]
  rows: Array<{
    key: string
    cells: ReactNode[]
  }>
  emptyLabel?: string
}

export function CmsListTable({ className = '', headers, rows, emptyLabel = 'Chưa có dữ liệu.' }: CmsListTableProps) {
  return (
    <div className="cms-table-wrap">
      <table className={`cms-table ${className}`.trim()}>
        <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>
          {rows.length ? rows.map((row) => <tr key={row.key}>{row.cells.map((cell, index) => <td key={`${row.key}-${headers[index]}`}>{cell}</td>)}</tr>) : (
            <tr><td colSpan={headers.length}>{emptyLabel}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
