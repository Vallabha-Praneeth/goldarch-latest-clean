import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          // Update request cookies so downstream server components see fresh tokens
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Recreate response with updated request
          response = NextResponse.next({ request });
          // Set cookies on response so browser receives the refreshed tokens
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;
  const pathWithQuery = pathname + request.nextUrl.search;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Helper: clear all Supabase cookies
  const clearSupabaseCookies = (res: NextResponse) => {
    request.cookies.getAll().forEach((cookie) => {
      if (cookie.name.startsWith('sb-')) {
        res.cookies.set(cookie.name, '', { maxAge: 0, path: '/' });
      }
    });
  };

  // On /auth page: clear stale cookies on ANY auth error so login starts fresh
  if (error && pathname.startsWith('/auth')) {
    clearSupabaseCookies(response);
    return response;
  }

  // On protected pages: redirect to /auth if refresh token is invalid
  if (
    error &&
    (error.message.includes('Invalid Refresh Token') ||
      error.message.includes('Refresh Token Not Found'))
  ) {
    const redirectUrl = new URL('/auth', request.url);
    redirectUrl.searchParams.set('next', pathWithQuery);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    clearSupabaseCookies(redirectResponse);
    return redirectResponse;
  }

  // If not authenticated and trying to access protected areas
  const isDashboard = pathname.startsWith('/app-dashboard');
  const isFrameworkBApi = pathname.startsWith('/api/framework-b');
  const isFrameworkBHealth = pathname === '/api/framework-b/health';
  const isProtectedFrameworkB = isFrameworkBApi && !isFrameworkBHealth;

  if (!user && (isDashboard || isProtectedFrameworkB)) {
    const redirectUrl = new URL('/auth', request.url);
    redirectUrl.searchParams.set('next', pathWithQuery);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/auth', '/app-dashboard/:path*', '/api/framework-b/:path*'],
};
