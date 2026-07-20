import type { CollectionConfig } from 'payload'
import { publishFields, seoFields, slugField } from '@/collections/shared'

export const Albums: CollectionConfig = {
  slug: 'albums',
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
      name: 'coverImage',
      type: 'relationship',
      relationTo: 'media'
    },
    {
      name: 'description',
      type: 'textarea'
    },
    {
      name: 'artist',
      type: 'relationship',
      relationTo: 'artists'
    },
    {
      name: 'musician',
      type: 'text'
    },
    {
      name: 'presenter',
      type: 'text'
    },
    {
      name: 'musicCategory',
      type: 'text'
    },
    {
      name: 'releaseDate',
      type: 'date'
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false
    },
    {
      name: 'isPublic',
      type: 'checkbox',
      defaultValue: true
    },
    {
      name: 'tracks',
      type: 'relationship',
      relationTo: 'tracks',
      hasMany: true
    },
    {
      name: 'shareCode',
      type: 'text'
    },
    ...publishFields,
    ...seoFields
  ]
}
