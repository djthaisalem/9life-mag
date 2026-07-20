import type { CollectionConfig } from 'payload'
import { publishFields, seoFields, slugField } from '@/collections/shared'

export const Tracks: CollectionConfig = {
  slug: 'tracks',
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
      name: 'musicCode',
      type: 'text',
      unique: true,
      admin: {
        readOnly: true,
        description: 'Mã quản lý 6 số được hệ thống tạo khi upload.',
      },
    },
    {
      name: 'coverImage',
      type: 'relationship',
      relationTo: 'media'
    },
    {
      name: 'coverR2Key',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Cover mặc định trên R2 khi track chưa có ảnh riêng.',
      },
    },
    {
      name: 'description',
      type: 'textarea'
    },
    {
      name: 'primaryArtist',
      type: 'relationship',
      relationTo: 'artists'
    },
    {
      name: 'author',
      type: 'text'
    },
    {
      name: 'singer',
      type: 'text'
    },
    {
      name: 'remixer',
      type: 'text'
    },
    {
      name: 'mixedInKey',
      type: 'text'
    },
    {
      name: 'tempo',
      type: 'number'
    },
    {
      name: 'durationLabel',
      type: 'text',
      admin: {
        description: 'Ví dụ: 04:32'
      }
    },
    {
      name: 'durationSeconds',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Được ffprobe tự động đọc từ file upload.',
      },
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
      name: 'isOfficial',
      type: 'checkbox',
      defaultValue: true
    },
    {
      name: 'isPublic',
      type: 'checkbox',
      defaultValue: true
    },
    {
      name: 'trackType',
      type: 'select',
      defaultValue: 'nonstop',
      options: [
        { label: 'Nonstop Playlist', value: 'nonstop' },
        { label: 'Top Remix', value: 'remix' },
        { label: 'Single Track', value: 'single' },
        { label: 'Album / EP release', value: 'album' }
      ]
    },
    {
      name: 'previewFile',
      type: 'relationship',
      relationTo: 'media'
    },
    {
      name: 'fullFile',
      type: 'relationship',
      relationTo: 'media'
    },
    {
      name: 'previewR2Key',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Preview MP3 256kb do worker tạo.',
      },
    },
    {
      name: 'masterR2Key',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'File master nguyên gốc, chỉ dùng cho download có quyền.',
      },
    },
    {
      name: 'sourceFormat',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'submittedArtistSlug',
      type: 'text',
    },
    {
      name: 'genreLabel',
      type: 'text',
    },
    {
      name: 'albumLabel',
      type: 'text',
    },
    {
      name: 'accessLevel',
      type: 'select',
      defaultValue: 'public',
      options: [
        { label: 'Public play', value: 'public' },
        { label: 'Star gated', value: 'stars' },
        { label: 'Premium', value: 'premium' },
        { label: 'Internal', value: 'internal' },
      ],
    },
    {
      name: 'playbackStarCost',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Số sao trừ mỗi lần phát. Để 0 nếu nghe miễn phí.',
      },
    },
    {
      name: 'downloadStarCost',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Số sao trừ mỗi lần tải. Để 0 nếu tải miễn phí.',
      },
    },
    {
      name: 'displayMap',
      type: 'textarea',
    },
    {
      name: 'visibility',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Nháp nội bộ', value: 'draft' },
        { label: 'Chờ admin duyệt', value: 'pending' },
        { label: 'Đang public', value: 'public' },
        { label: 'Tạm ẩn', value: 'hidden' },
      ],
    },
    {
      name: 'requiresLoginToDownload',
      type: 'checkbox',
      defaultValue: true
    },
    {
      name: 'downloadCount',
      type: 'number',
      defaultValue: 0
    },
    {
      name: 'shareCode',
      type: 'text'
    },
    ...publishFields,
    ...seoFields
  ]
}
