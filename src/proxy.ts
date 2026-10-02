import { type NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, type SessionData } from '@/lib/session'

// Protege el panel: todo /admin salvo el login exige sesión.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()
  const session = await getIronSession<SessionData>(request, response, sessionOptions())
  const loggedIn = session.isLoggedIn === true

  if (pathname === '/admin/login') {
    return loggedIn ? NextResponse.redirect(new URL('/admin', request.url)) : response
  }
  if (!loggedIn) return NextResponse.redirect(new URL('/admin/login', request.url))
  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
