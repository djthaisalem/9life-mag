import type { CollectionConfig } from 'payload'
import { seoFields, slugField } from '@/collections/shared'

export const Artists: CollectionConfig = {
  slug: 'artists',
  admin: {
    useAsTitle: 'stageName',
    defaultColumns: ['stageName', 'role', 'gender', 'serviceArea', 'profileStatus', 'managedBy'],
  },
  fields: [
    {
      name: 'stageName',
      type: 'text',
      required: true,
    },
    slugField,
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'DJ', value: 'dj' },
        { label: 'Producer', value: 'producer' },
        { label: 'MC Hype', value: 'mc' },
        { label: 'Rapper', value: 'rapper' },
        { label: 'Dancer', value: 'dancer' },
        { label: 'Live Act', value: 'live-act' },
      ],
    },
    {
      name: 'gender',
      type: 'select',
      options: [
        { label: 'Female', value: 'female' },
        { label: 'Male', value: 'male' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'genres',
      type: 'array',
      fields: [
        {
          name: 'value',
          type: 'text',
        },
      ],
    },
    {
      name: 'serviceArea',
      type: 'text',
    },
    {
      name: 'startingPrice',
      type: 'number',
    },
    {
      name: 'bookingPriceLabel',
      type: 'text',
      admin: {
        description: 'Ví dụ: Từ 12.000.000 VND hoặc Liên hệ để biết thêm chi tiết.',
      },
    },
    {
      name: 'isAvailable',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'profileStatus',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Pending Review', value: 'pending_review' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'managedBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'heroImage',
      type: 'relationship',
      relationTo: 'media',
    },
    {
      name: 'portraitImage',
      type: 'relationship',
      relationTo: 'media',
    },
    {
      name: 'bio',
      type: 'richText',
    },
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'SoundCloud', value: 'soundcloud' },
            { label: 'TikTok', value: 'tiktok' },
          ],
        },
        {
          name: 'url',
          type: 'text',
        },
      ],
    },
    ...seoFields,
  ],
}
