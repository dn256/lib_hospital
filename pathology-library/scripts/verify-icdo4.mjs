import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const data = JSON.parse(await readFile(new URL('../public/icdo-data/icdo4-catalog.json', import.meta.url), 'utf8'))

const normalize = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .toLowerCase()
  .replace(/[^a-z0-9/]+/g, ' ')
  .trim()

const aliases = {
  bcc: 'basal cell carcinoma',
  scc: 'squamous cell carcinoma',
  hcc: 'hepatocellular carcinoma',
  ptc: 'papillary thyroid carcinoma',
  gist: 'gastrointestinal stromal tumour',
  dlbcl: 'diffuse large b cell lymphoma',
}

const morphologySearch = (query) => {
  const normalized = normalize(aliases[normalize(query)] || query)
  const compact = normalize(query).replace(/[^a-z0-9/]/g, '')
  return data.morphology.filter((entry) => {
    const fields = [entry.code, entry.legacyCode, ...entry.terms.map(term => term.term)].map(normalize).join(' ')
    return fields.includes(normalized)
      || entry.code.replace(/[^A-Z0-9/]/g, '').toLowerCase().includes(compact)
      || entry.legacyCode.replace(/[^A-Z0-9/]/g, '').toLowerCase().includes(compact)
  })
}

const topographySearch = (query) => {
  const normalized = normalize(query)
  return data.topography.filter(entry => normalize([entry.code, ...entry.terms.map(term => term.term)].join(' ')).includes(normalized))
}

assert.equal(data.meta.edition, 'ICD-O-4')
assert.equal(data.meta.releaseDate, '2026-07-20')
assert.equal(data.morphology.length, data.meta.morphologyCodeCount)
assert.ok(data.morphology.length > 2300)
assert.equal(data.topography.length, 337)
assert.equal(data.optionalTopography.length, 381)
assert.equal(new Set(data.morphology.map(entry => entry.code)).size, data.morphology.length)
assert.equal(new Set(data.topography.map(entry => entry.code)).size, data.topography.length)
assert.ok(data.morphology.every(entry => /^\d{4}[0-9A-Z]\/[0-9A-Z]$/.test(entry.code)))
assert.ok(data.topography.every(entry => /^C[0-9]{2}(?:\.[0-9])?$/.test(entry.code)))

const expectedMorphology = {
  bcc: '80900/3',
  scc: '80700/3',
  hcc: '81700/3',
  ptc: '82603/3',
  gist: '89360/3',
  dlbcl: '96800/3',
  '8140/3': '81400/3',
}
for (const [query, code] of Object.entries(expectedMorphology)) {
  assert.ok(morphologySearch(query).some(entry => entry.code === code), `${query} must resolve to ${code}`)
}
assert.equal(morphologySearch('bcc')[0]?.code, '80900/3', 'BCC must rank basal cell carcinoma first')

for (const [query, code] of Object.entries({ lung: 'C34.9', breast: 'C50.9', stomach: 'C16.9', liver: 'C22.0', thyroid: 'C73.9' })) {
  assert.ok(topographySearch(query).some(entry => entry.code === code), `${query} must resolve to ${code}`)
}

console.log(`ICD-O-4 verified: ${data.morphology.length} morphology codes, ${data.topography.length} standard topography codes, ${data.optionalTopography.length} optional topography codes.`)
