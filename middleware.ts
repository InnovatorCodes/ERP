// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { homePathFor, isUserRole, routeRolesFor } from '@/lib/roles'

export async function middleware(request: NextRequest) {
  // Supabase may refresh the session and write new cookies. They are written to
  // this response, and copied onto any redirect we return, so a refreshed
  // session is never lost.
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { pathname } = request.nextUrl
  const isApi = pathname.startsWith('/api/')
  const isLogin = pathname === '/login'

  const withSessionCookies = (res: NextResponse) => {
    response.cookies.getAll().forEach((cookie) => res.cookies.set(cookie))
    return res
  }
  const redirectTo = (path: string, search = '') => {
    const url = request.nextUrl.clone()
    url.pathname = path
    url.search = search
    return withSessionCookies(NextResponse.redirect(url))
  }
  const deny = (status: 401 | 403, error: string) =>
    withSessionCookies(NextResponse.json({ error }, { status }))

  // getUser() validates the session with Supabase Auth; don't trust the cookie alone.
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    if (isLogin) return response
    return isApi ? deny(401, 'You must be signed in.') : redirectTo('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  const role = isUserRole(profile?.role) ? profile.role : null

  // Signed in but no role (e.g. created outside the Employees page): end the
  // session instead of bouncing between pages.
  if (!role) {
    await supabase.auth.signOut()
    if (isApi) return deny(403, 'Your account has no role assigned.')
    return redirectTo('/login', '?error=no_access')
  }

  if (isLogin || pathname === '/') {
    return redirectTo(homePathFor(role))
  }

  const allowedRoles = routeRolesFor(pathname)
  if (allowedRoles && !allowedRoles.includes(role)) {
    return isApi
      ? deny(403, 'You do not have permission to access this.')
      : redirectTo(homePathFor(role))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (build output and image optimisation)
     * - favicon.ico and static files in /public (images, fonts), so the
     *   login page can load them before the user signs in
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|otf|ttf|woff|woff2)$).*)',
  ],
}
