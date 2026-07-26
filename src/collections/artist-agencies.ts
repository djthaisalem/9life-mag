import type { CollectionConfig } from 'payload'

export const ArtistAgencies: CollectionConfig = {
  slug: 'artist-agencies',
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'name', type: 'text', required: true },
    {
      name: 'status', type: 'select', required: true, defaultValue: 'published', options: [
        { label: 'Chờ duyệt', value: 'pending_review' },
        { label: 'Đã duyệt', value: 'published' },
        { label: 'Đình chỉ', value: 'suspended' },
        { label: 'Đã hủy', value: 'cancelled' },
      ],
    },
    { name: 'label', type: 'text' },
    { name: 'location', type: 'text' },
    { name: 'coverage', type: 'text' },
    { name: 'image', type: 'text' },
    { name: 'description', type: 'textarea' },
    { name: 'specialties', type: 'array', fields: [{ name: 'value', type: 'text', required: true }] },
    { name: 'services', type: 'array', fields: [{ name: 'value', type: 'text', required: true }] },
  ],
}
