import type { CollectionConfig } from 'payload'
import { slugField } from '@/collections/shared'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name'
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true
    },
    slugField,
    {
      name: 'description',
      type: 'textarea'
    }
  ]
}
