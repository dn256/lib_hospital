import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const SOURCE_URL = 'https://www.nordiqc.org/epitope.php'
const OUTPUT_URL = new URL('../utils/ihcMarkerCatalog.ts', import.meta.url)

const decodeHtml = value => value
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&alpha;/g, 'alpha')
  .replace(/<[^>]+>/g, '')
  .trim()

const quote = value => JSON.stringify(decodeHtml(value))

const response = await fetch(SOURCE_URL, {
  headers: { 'user-agent': 'PathologyLib educational index sync/1.0' },
})

if (!response.ok) throw new Error(`NordiQC returned HTTP ${response.status}`)

const html = await response.text()
const rowPattern = /<td><a href='epitope\.php\?id=(\d+)'>(.*?)<\/a><\/td><td><a href='epitope\.php\?id=\1'>(.*?)<\/a><\/td><td><a target='_blank' href='([^']+)'>(.*?)<\/a><\/td><td>(\d{4})<\/td><td>(?:<a href='([^']+)'>Link<\/a>)?<\/td>/g
const rows = [...html.matchAll(rowPattern)]

if (rows.length < 80) {
  throw new Error(`Only parsed ${rows.length} NordiQC rows; source structure may have changed`)
}

const entries = rows.map((match) => {
  const [, id, name, fullNameEn, reportPath, run, year, protocolPath] = match
  return `  {\n    id: ${quote(id)},\n    name: ${quote(name)},\n    fullNameEn: ${quote(fullNameEn)},\n    latestAssessment: ${quote(run)},\n    assessmentYear: ${quote(year)},\n    sourceUrl: ${quote(`https://www.nordiqc.org/epitope.php?id=${id}`)},\n    reportUrl: ${quote(`https://www.nordiqc.org/${reportPath}`)},${protocolPath ? `\n    protocolUrl: ${quote(`https://www.nordiqc.org/${protocolPath}`)},` : ''}\n  }`
})

const generated = `// Generated from NordiQC's public assessment index by scripts/sync-nordiqc-markers.mjs.\n// Do not add local case metadata here. Clinical interpretation belongs in ihcMarkerAtlas.ts.\n\nexport interface IhcMarkerCatalogEntry {\n  id: string\n  name: string\n  fullNameEn: string\n  latestAssessment: string\n  assessmentYear: string\n  sourceUrl: string\n  reportUrl: string\n  protocolUrl?: string\n}\n\nexport const NORDIQC_SOURCE = {\n  organization: 'NordiQC',\n  title: 'Immunohistochemical Quality Control - Assessments',\n  url: '${SOURCE_URL}',\n  syncedAt: '${new Date().toISOString().slice(0, 10)}',\n} as const\n\nexport const IHC_MARKER_CATALOG: IhcMarkerCatalogEntry[] = [\n${entries.join(',\n')}\n]\n`

await writeFile(fileURLToPath(OUTPUT_URL), generated, 'utf8')
console.log(`Wrote ${rows.length} independent NordiQC marker entries to ${fileURLToPath(OUTPUT_URL)}`)
