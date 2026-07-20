import type { CollectionConfig } from 'payload'
import { seoFields, slugField } from '@/collections/shared'

export const Products: CollectionConfig = {
  slug: 'products',
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
      name: 'productType',
      type: 'select',
      required: true,
      defaultValue: 'track',
      options: [
        { label: 'Track', value: 'track' },
        { label: 'Album', value: 'album' },
        { label: 'Package', value: 'package' }
      ]
    },
    {
      name: 'artist',
      type: 'relationship',
      relationTo: 'artists'
    },
    {
      name: 'price',
      type: 'number',
      required: true
    },
    {
      name: 'currency',
      type: 'text',
      defaultValue: 'VND'
    },
    {
      name: 'licenseType',
      type: 'select',
      defaultValue: 'personal',
      options: [
        { label: 'Personal', value: 'personal' },
        { label: 'Performance', value: 'performance' },
        { label: 'Commercial', value: 'commercial' }
      ]
    },
    {
      name: 'previewFile',
      type: 'relationship',
      relationTo: 'media'
    },
    {
      name: 'sourceFile',
      type: 'relationship',
      relationTo: 'media'
    },
    {
      name: 'description',
      type: 'richText'
    },
    ...seoFields
  ]
}
