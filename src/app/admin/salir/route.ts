import { NextResponse, type NextRequest } from 'next/server'
import { logout } from '@/lib/auth'

// Cierra la sesión y manda al login. Aquí llegan las sesiones de accesos desactivados.
export async function GET(request: NextRequest) {
  await logout()
  return NextResponse.redirect(new URL('/admin/login', request.url))
}
