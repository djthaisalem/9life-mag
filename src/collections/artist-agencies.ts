import type { CollectionConfig } from 'payload'

export const ArtistAgencies: CollectionConfig = {
  slug: 'artist-agencies',
  admin: { useAsTitle: 'name' },
  fields: [
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'name', type: 'text', required: true },
    { name: 'label', type: 'text' },
    { name: 'location', type: 'text' },
    { name: 'coverage', type: 'text' },
    { name: 'image', type: 'text' },
    { name: 'description', type: 'textarea' },
    { name: 'specialties', type: 'array', fields: [{ name: 'value', type: 'text', required: true }] },
    { name: 'services', type: 'array', fields: [{ name: 'value', type: 'text', required: true }] },
  ],
}
