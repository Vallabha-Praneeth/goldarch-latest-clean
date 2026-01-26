import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const pathWithQuery = request.nextUrl.pathname + request.nextUrl.search;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Handle invalid refresh token by clearing stale cookies
  if (
    error &&
    (error.message.includes('Invalid Refresh Token') ||
      error.message.includes('Refresh Token Not Found'))
  ) {
    const redirectUrl = new URL('/auth', request.url);
    redirectUrl.searchParams.set('next', pathWithQuery);

    const redirectResponse = NextResponse.redirect(redirectUrl);

    // Clear all Supabase cookies
    const allCookies = request.cookies.getAll();
    allCookies.forEach((cookie) => {
      if (cookie.name.startsWith('sb-')) {
        redirectResponse.cookies.set(cookie.name, '', { maxAge: 0, path: '/' });
      }
    });

    return redirectResponse;
  }

  const pathname = request.nextUrl.pathname;

  // If not authenticated and trying to access protected areas
  const isDashboard = pathname.startsWith('/app-dashboard');
  const isFrameworkBApi = pathname.startsWith('/api/framework-b');
  const isFrameworkBHealth = pathname === '/api/framework-b/health';

  // Allow health endpoint to remain public
  const isProtectedFrameworkB = isFrameworkBApi && !isFrameworkBHealth;

  if (!user && (isDashboard || isProtectedFrameworkB)) {
    const redirectUrl = new URL('/auth', request.url);
    redirectUrl.searchParams.set('next', pathWithQuery);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/app-dashboard/:path*', '/api/framework-b/:path*'],
};
