import type { CollectionConfig } from 'payload'
import { publishFields, seoFields, slugField } from '@/collections/shared'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title'
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true
    },
    slugField,
    {
      name: 'excerpt',
      type: 'textarea'
    },
    {
      name: 'coverImage',
      type: 'relationship',
      relationTo: 'media'
    },
    {
      name: 'gallery',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories'
    },
    {
      name: 'topic',
      type: 'relationship',
      relationTo: 'categories',
    },
    {
      name: 'placement',
      type: 'text',
    },
    {
      name: 'content',
      type: 'richText'
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false
    },
    ...publishFields,
    ...seoFields
  ]
}
