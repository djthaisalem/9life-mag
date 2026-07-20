import type { Field } from 'payload'

export const slugField: Field = {
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  admin: {
    description: 'Slug dùng cho URL thân thiện SEO.'
  }
}

export const seoFields: Field[] = [
  {
    name: 'seoTitle',
    type: 'text'
  },
  {
    name: 'seoDescription',
    type: 'textarea'
  }
]

export const publishFields: Field[] = [
  {
    name: 'publishedAt',
    type: 'date'
  },
  {
    name: 'status',
    type: 'select',
    required: true,
    defaultValue: 'draft',
    options: [
      { label: 'Draft', value: 'draft' },
      { label: 'Scheduled', value: 'scheduled' },
      { label: 'Published', value: 'published' }
    ]
  }
]
