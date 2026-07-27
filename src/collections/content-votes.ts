import type { CollectionConfig } from 'payload'

export const ContentVotes: CollectionConfig = {
  slug: 'content-votes',
  admin: { useAsTitle: 'targetSlug', defaultColumns: ['targetType', 'targetSlug', 'siteUserId', 'status', 'createdAt'] },
  fields: [
    { name: 'targetType', type: 'select', required: true, options: [{ label: 'Nghệ sĩ', value: 'artist' }, { label: 'Outlet', value: 'outlet' }] },
    { name: 'targetSlug', type: 'text', required: true, index: true },
    { name: 'siteUserId', type: 'text', required: true, index: true },
    { name: 'status', type: 'select', required: true, defaultValue: 'confirmed', options: [{ label: 'Đã xác nhận', value: 'confirmed' }] },
  ],
}
