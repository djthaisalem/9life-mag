import type { CollectionConfig } from 'payload'
import { publishFields, seoFields, slugField } from '@/collections/shared'

export const Playlists: CollectionConfig = {
  slug: 'playlists',
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
      name: 'keyword',
      type: 'text'
    },
    {
      name: 'musician',
      type: 'text'
    },
    {
      name: 'singer',
      type: 'text'
    },
    {
      name: 'playlistType',
      type: 'select',
      defaultValue: 'nonstop',
      options: [
        { label: 'Nonstop', value: 'nonstop' },
        { label: 'Remix', value: 'remix' },
        { label: 'Editorial', value: 'editorial' }
      ]
    },
    {
      name: 'releaseDate',
      type: 'date'
    },
    {
      name: 'tempo',
      type: 'number'
    },
    {
      name: 'isVip',
      type: 'checkbox',
      defaultValue: false
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
    {
      name: 'ownerSiteUserId',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'ID tài khoản sở hữu playlist user đã publish.'
      }
    },
    {
      name: 'isUserPlaylist',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        readOnly: true
      }
    },
    {
      name: 'userSnapshot',
      type: 'json',
      admin: {
        readOnly: true,
        description: 'Snapshot an toàn dùng để phát và tạo metadata cho link chia sẻ.'
      }
    },
    ...publishFields,
    ...seoFields
  ]
}
