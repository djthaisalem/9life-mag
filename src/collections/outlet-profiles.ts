import type { CollectionConfig } from 'payload'
import { seoFields, slugField } from '@/collections/shared'

export const OutletProfiles: CollectionConfig = {
  slug: 'outlet-profiles',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', 'status', 'updatedAt'],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField,
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Bản nháp', value: 'draft' },
        { label: 'Chờ duyệt', value: 'pending_review' },
        { label: 'Đã duyệt', value: 'published' },
        { label: 'Huỷ', value: 'cancelled' },
      ],
    },
    { name: 'type', type: 'text' },
    { name: 'region', type: 'text' },
    { name: 'city', type: 'text' },
    { name: 'hours', type: 'text' },
    { name: 'crowd', type: 'text' },
    { name: 'vibe', type: 'text' },
    { name: 'summary', type: 'textarea' },
    { name: 'introduction', type: 'textarea' },
    { name: 'highlights', type: 'textarea' },
    { name: 'tableOptions', type: 'textarea' },
    { name: 'serviceNotes', type: 'textarea' },
    { name: 'musicStyles', type: 'textarea' },
    { name: 'faq', type: 'textarea' },
    { name: 'videoEmbed', type: 'text' },
    { name: 'audioEmbed', type: 'text' },
    { name: 'bookingChannel', type: 'text' },
    { name: 'createdByEmail', type: 'email', admin: { readOnly: true } },
    { name: 'coverImage', type: 'relationship', relationTo: 'media' },
    { name: 'portraitImage', type: 'relationship', relationTo: 'media' },
    { name: 'gallery', type: 'relationship', relationTo: 'media', hasMany: true },
    ...seoFields,
  ],
}
