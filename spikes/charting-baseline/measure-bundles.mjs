// Measures the real minified + gzip + brotli size of a MINIMAL build of each candidate library.
// React / react-dom are treated as external (the app ships them anyway). Run: npm run sizes
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { brotliCompressSync, gzipSync } from 'node:zlib'
import { join, resolve } from 'node:path'
import { build } from 'vite'

const entries = {
  'uplot (JS only)': 'uplot.js',
  'echarts minimal (line + grid + canvas)': 'echarts-min.js',
  'echarts as prototyped (+tooltip, dataZoom, axisPointer, dataset, title, legend, SVG renderer)': 'echarts-needed.js',
  'echarts full (import * from echarts)': 'echarts-full.js',
  'plotly.js basic bundle (SVG scatter only)': 'plotly-basic.js',
  'plotly.js cartesian bundle (SVG scatter/bar/heatmap...)': 'plotly-cartesian.js',
  'plotly.js gl2d bundle (adds scattergl, needed for 51k x 13)': 'plotly-gl2d.js',
  'recharts (LineChart, Line, axes, tooltip, legend, grid, ResponsiveContainer)': 'recharts.js',
}

const rows = []
for (const [label, file] of Object.entries(entries)) {
  const outDir = resolve('dist-bundles', file.replace('.js', ''))
  rmSync(outDir, { recursive: true, force: true })
  await build({
    configFile: false,
    logLevel: 'silent',
    build: {
      outDir,
      emptyOutDir: true,
      minify: true,
      cssCodeSplit: false,
      lib: { entry: resolve('src/bundles', file), formats: ['es'], fileName: 'bundle' },
      rollupOptions: { external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'] },
    },
  })
  let raw = 0
  let gz = 0
  let br = 0
  for (const f of readdirSync(outDir).filter((n) => n.endsWith('.js'))) {
    const buf = readFileSync(join(outDir, f))
    raw += buf.length
    gz += gzipSync(buf, { level: 9 }).length
    br += brotliCompressSync(buf).length
  }
  rows.push({ label, min_kB: +(raw / 1024).toFixed(1), gzip_kB: +(gz / 1024).toFixed(1), brotli_kB: +(br / 1024).toFixed(1) })
  console.log(rows.at(-1))
}
mkdirSync('results', { recursive: true })
writeFileSync('results/bundle-sizes.json', JSON.stringify(rows, null, 2))
