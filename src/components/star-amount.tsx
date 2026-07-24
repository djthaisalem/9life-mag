import { Star } from 'lucide-react'

type StarAmountProps = {
  amount: number | string
  prefix?: string
  suffix?: string
  className?: string
}

export function StarAmount({ amount, prefix = '', suffix = '', className = '' }: StarAmountProps) {
  const value = typeof amount === 'number' ? amount.toLocaleString('vi-VN') : amount
  const label = `${prefix}${value}${suffix} sao`

  return (
    <span className={`star-amount ${className}`.trim()} aria-label={label} title={label}>
      <span>{prefix}{value}{suffix}</span>
      <Star aria-hidden="true" size={15} strokeWidth={2.3} fill="currentColor" />
    </span>
  )
}
