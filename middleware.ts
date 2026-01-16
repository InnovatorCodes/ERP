// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  // We are creating a response object that we can modify and return
  const res = NextResponse.next()

  // Create the Supabase client with cookie handling configured for the middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // The `get` and `set` methods are used here because we have direct
        // access to the request and response objects.
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          // The middleware must update the cookies on both the request and response
          // objects.
          req.cookies.set({ name, value, ...options })
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options) {
          req.cookies.set({ name, value: '', ...options })
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // This is the most important step! It refreshes the session cookie.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  if (!user && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role;

    const rolePages: { [key: string]: string[] } = {
      'production manager': ['/view-orders'],
      'sales coordinator': ['/customers', '/products', '/place-order'],
    };

    const allowedPages = rolePages[userRole] || [];
    let isPageAllowed = false;

    if (pathname === '/employees') {
      isPageAllowed = userRole === 'admin';
    } else {
      isPageAllowed =
        userRole === 'admin' ||
        userRole === 'manager' ||
        allowedPages.some((page) => pathname.startsWith(page)) ||
        pathname === '/' ||
        pathname === '/login';
    }

    if (!isPageAllowed) {
      const defaultPage = userRole === 'production manager' ? '/view-orders' : '/dashboard';
      return NextResponse.redirect(new URL(defaultPage, req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
