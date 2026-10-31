// Writes backend/data/icons/lucide.json: every Lucide icon (ISC licence) as plain SVG nodes, for the label builder.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = 'node_modules/lucide-react/dist/esm/icons'
const pkg = JSON.parse(readFileSync('node_modules/lucide-react/package.json', 'utf8'))
const icons = {}
for (const file of readdirSync(dir)) {
  if (!file.endsWith('.mjs')) continue
  const found = readFileSync(join(dir, file), 'utf8').match(/const __iconData = (\{[\s\S]*?\n\});/)
  if (!found) continue
  const data = new Function(`return ${found[1]}`)()
  icons[data.name] = data.node.map(([tag, attrs]) => {
    const { key, ...rest } = attrs
    return [tag, rest]
  })
}
writeFileSync(
  '../backend/data/icons/lucide.json',
  JSON.stringify({ set: 'lucide', version: pkg.version, license: 'ISC', size: 24, icons }),
)
console.log(Object.keys(icons).length, 'icons')
