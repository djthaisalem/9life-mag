import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'fullName', 'accountType', 'role', 'stars', 'isActive'],
  },
  fields: [
    {
      name: 'fullName',
      type: 'text',
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'accountType',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        { label: 'User', value: 'user' },
        { label: 'Artist', value: 'artist' },
      ],
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'customer',
      options: [
        { label: 'Customer', value: 'customer' },
        { label: 'Admin', value: 'admin' },
        { label: 'Super Admin', value: 'super_admin' },
        { label: 'Security Admin', value: 'security_admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Artist Manager', value: 'artist_manager' },
        { label: 'Booking Agent', value: 'booking_agent' },
        { label: 'Finance', value: 'finance' },
        { label: 'Finance Ops', value: 'finance_ops' },
        { label: 'Booking Ops', value: 'booking_ops' },
        { label: 'Artist Ops', value: 'artist_ops' },
      ],
    },
    {
      name: 'portalRole',
      type: 'select',
      defaultValue: 'artist',
      admin: {
        description: 'Vai trò vận hành ngoài site chính, không cấp quyền CMS.',
      },
      options: [
        { label: 'Artist', value: 'artist' },
        { label: 'Manager', value: 'manager' },
        { label: 'Booking Coordinator', value: 'booking' },
      ],
    },
    {
      name: 'portalAccessStatus',
      type: 'select',
      defaultValue: 'approved',
      admin: {
        description: 'Manager và Booking Coordinator chỉ truy cập dashboard khi đã được duyệt.',
      },
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Suspended', value: 'suspended' },
      ],
    },
    {
      name: 'managedAgent',
      type: 'text',
      admin: { description: 'Agent mà Manager được phân công quản lý.' },
    },
    {
      name: 'artistAgent',
      type: 'text',
      admin: { description: 'Agent đang quản lý hồ sơ nghệ sĩ; để trống khi là nghệ sĩ tự do.' },
    },
    {
      name: 'artistProfileSlug',
      type: 'text',
      admin: { description: 'Slug hồ sơ công khai được chuyển quyền quản lý giữa các Agent.' },
    },
    {
      name: 'managedOutletSlugs',
      type: 'array',
      admin: { description: 'Các outlet mà Booking Coordinator được phép điều phối.' },
      fields: [{ name: 'slug', type: 'text', required: true }],
    },
    {
      name: 'socialProvider',
      type: 'select',
      defaultValue: 'local',
      options: [
        { label: 'Local', value: 'local' },
        { label: 'Google', value: 'google' },
        { label: 'Facebook', value: 'facebook' },
      ],
    },
    {
      name: 'socialId',
      type: 'text',
    },
    {
      name: 'artistProfile',
      type: 'relationship',
      relationTo: 'artists',
    },
    {
      name: 'stars',
      type: 'number',
      required: true,
      defaultValue: 100,
      admin: {
        description: 'Số sao khả dụng hiện tại của tài khoản.',
      },
    },
    {
      name: 'signupStarsEarned',
      type: 'number',
      defaultValue: 100,
    },
    {
      name: 'dailyStarsEarned',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'bonusStarsEarned',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'playlistStarsEarned',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'followedArtistSlugs',
      type: 'array',
      fields: [
        {
          name: 'slug',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'followedAgentSlugs',
      type: 'array',
      fields: [
        {
          name: 'slug',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'dailyClaimDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'bonusClaimDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'isPremium',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'sessionInvalidAfter',
      type: 'date',
      admin: {
        description: 'Thu hồi mọi session phát hành trước thời điểm này.',
      },
    },
    {
      name: 'securityNotes',
      type: 'textarea',
      admin: {
        description: 'Ghi chú nội bộ cho các trường hợp cần rà soát bảo mật hoặc hỗ trợ tài khoản.',
      },
    },
  ],
}
