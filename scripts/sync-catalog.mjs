// Copies the root catalog JSON into src/data/. Run it with `npm run catalog:sync`.
import { copyFileSync } from 'node:fs'

copyFileSync(
  new URL('../bimmerlink_n55_parameter_catalog.json', import.meta.url),
  new URL('../src/data/catalog.json', import.meta.url),
)
