import { finishGoogleAuth } from '@/lib/social-auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return Response.redirect(new URL('/tai-khoan/oauth-callback?error=google_missing_code', request.url))
  }

  await finishGoogleAuth({ code, state })
}
