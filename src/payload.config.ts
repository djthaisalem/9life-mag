import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig } from 'payload'
import { Artists } from '@/collections/artists'
import { Albums } from '@/collections/albums'
import { BookingRequests } from '@/collections/booking-requests'
import { Categories } from '@/collections/categories'
import { Entitlements } from '@/collections/entitlements'
import { Media } from '@/collections/media'
import { Orders } from '@/collections/orders'
import { Playlists } from '@/collections/playlists'
import { Posts } from '@/collections/posts'
import { Products } from '@/collections/products'
import { Tracks } from '@/collections/tracks'
import { Users } from '@/collections/users'
import { StarTopups } from '@/collections/star-topups'
import { WalletLedger } from '@/collections/wallet-ledger'
import { RequestGuards } from '@/collections/request-guards'
import { PasswordResetTokens } from '@/collections/password-reset-tokens'
import { CmsAccessRequests } from '@/collections/cms-access-requests'
import { PortalNotifications } from '@/collections/portal-notifications'
import { AgentChangeTickets } from '@/collections/agent-change-tickets'
import { ArtistAgencies } from '@/collections/artist-agencies'
import { ShareReferrals } from '@/collections/share-referrals'
import { StudentApplications } from '@/collections/student-applications'
import { StudentRegistrationSettings } from '@/collections/student-registration-settings'
import { env } from '@/lib/env'

const storagePlugin = env.R2_ENDPOINT && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY
  ? s3Storage({
      collections: {
        media: {
          prefix: 'media'
        }
      },
      bucket: env.R2_BUCKET,
      config: {
        endpoint: env.R2_ENDPOINT,
        region: 'auto',
        credentials: {
          accessKeyId: env.R2_ACCESS_KEY_ID,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY
        }
      }
    })
  : null

export default buildConfig({
  secret: env.PAYLOAD_SECRET,
  admin: {
    user: Users.slug
  },
  editor: lexicalEditor(),
  collections: [
    Users,
    Media,
    Categories,
    Posts,
    Artists,
    Tracks,
    Playlists,
    Albums,
    BookingRequests,
    Products,
    Orders,
    Entitlements,
    StarTopups,
    WalletLedger,
    RequestGuards,
    PasswordResetTokens,
    CmsAccessRequests,
    PortalNotifications,
    AgentChangeTickets,
    ArtistAgencies,
    ShareReferrals,
    StudentApplications,
    StudentRegistrationSettings
  ],
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URI
    }
  }),
  plugins: storagePlugin ? [storagePlugin] : []
})
