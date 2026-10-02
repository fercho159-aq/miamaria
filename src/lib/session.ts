// Opciones de la cookie de sesión del panel. Las usa auth.ts y proxy.ts.
export interface SessionData {
  adminId?: string
  email?: string
  nombre?: string
  isLoggedIn?: boolean
}

function secreto() {
  const s = process.env.SESSION_SECRET
  if (s && s.length >= 32) return s
  // En producción no hay clave de respaldo: con una clave pública cualquiera podría entrar al panel.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET falta o tiene menos de 32 caracteres.')
  }
  return 'solo_desarrollo_cambiar_en_produccion_miamaria_2026'
}

export function sessionOptions() {
  return {
    password: secreto(),
    cookieName: 'miamaria-admin',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
    },
  }
}
