import { startSocialAuth } from '@/lib/social-auth'

export async function GET() {
  await startSocialAuth('facebook')
}
