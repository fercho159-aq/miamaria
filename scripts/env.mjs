// Carga .env.local para los scripts de línea de comandos.
import fs from 'node:fs'

for (const line of fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8').split(/\r?\n/) : []) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, '')
}
if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL en .env.local')
  process.exit(1)
}
