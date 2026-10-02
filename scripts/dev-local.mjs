// Levanta `next dev` contra la base LOCAL de demostración (PGlite en .pglite/).
//   npm run dev:local            (puerto 3110)
//   npm run dev:local -- --reset (borra .pglite/ y vuelve a sembrar los datos demo)
import { spawn } from 'node:child_process'
import fs from 'node:fs'

if (process.argv.includes('--reset')) {
  fs.rmSync('.pglite', { recursive: true, force: true })
  console.log('Base local borrada: se vuelve a crear al primer uso.')
}
const port = process.env.PORT || '3110'
const child = spawn('npx', ['next', 'dev', '-p', port], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DB_MODE: 'local', NEXT_DIST_DIR: '.next-local' },
})
child.on('exit', (code) => process.exit(code ?? 0))
