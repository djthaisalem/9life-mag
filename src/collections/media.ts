import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt'
  },
  upload: true,
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true
    },
    {
      name: 'kind',
      type: 'select',
      defaultValue: 'image',
      options: [
        { label: 'Image', value: 'image' },
        { label: 'Audio Preview', value: 'audio-preview' },
        { label: 'Source Audio', value: 'source-audio' },
        { label: 'Press Kit', value: 'press-kit' }
      ]
    }
  ]
}
