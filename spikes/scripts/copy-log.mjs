// Copies the real example log into a spike's public/ folder (git-ignored there).
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const src = resolve(here, '../../Example/2026-10-25_09-33-22.csv')
const dest = resolve(process.cwd(), process.argv[2] ?? 'public/log.csv')
mkdirSync(dirname(dest), { recursive: true })
copyFileSync(src, dest)
console.log(`copied ${src} -> ${dest}`)
