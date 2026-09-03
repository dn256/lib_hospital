type SearchField = unknown | SearchField[]

const ACRONYM_STOP_WORDS = new Set([
  'a', 'an', 'and', 'associated', 'by', 'for', 'from', 'in', 'of', 'on', 'the', 'to', 'with',
])

const PATHOLOGY_ALIASES: Record<string, string[]> = {
  adh: ['atypical ductal hyperplasia', 'tang san ong tuyen vu khong dien hinh'],
  ais: ['adenocarcinoma in situ', 'ung thu bieu mo tuyen tai cho'],
  aml: ['acute myeloid leukaemia', 'acute myeloid leukemia', 'bach cau cap dong tuy'],
  atc: ['anaplastic thyroid carcinoma', 'ung thu bieu mo tuyen giap khong biet hoa'],
  bcc: ['basal cell carcinoma', 'ung thu bieu mo te bao day'],
  cin: ['cervical intraepithelial neoplasia', 'tan san noi bieu mo co tu cung'],
  cll: ['chronic lymphocytic leukaemia', 'chronic lymphocytic leukemia', 'bach cau lympho man'],
  cml: ['chronic myeloid leukaemia', 'chronic myeloid leukemia', 'bach cau dong tuy man'],
  crc: ['colorectal carcinoma', 'colorectal cancer', 'ung thu dai truc trang'],
  dcis: ['ductal carcinoma in situ', 'ung thu bieu mo ong tai cho'],
  ddlps: ['dedifferentiated liposarcoma', 'sarcoma mo mo mat biet hoa'],
  dlbcl: ['diffuse large b cell lymphoma', 'u lympho te bao b lon lan toa'],
  ein: ['endometrial intraepithelial neoplasia', 'tan san noi bieu mo noi mac tu cung'],
  ftc: ['follicular thyroid carcinoma', 'ung thu bieu mo tuyen giap the nang'],
  gbm: ['glioblastoma', 'u nguyen bao than kinh dem'],
  gist: ['gastrointestinal stromal tumour', 'gastrointestinal stromal tumor', 'u mo dem duong tieu hoa'],
  hcc: ['hepatocellular carcinoma', 'ung thu bieu mo te bao gan'],
  hgsoc: ['high grade serous ovarian carcinoma', 'high grade serous carcinoma', 'ung thu bieu mo thanh dich do cao'],
  hsil: ['high grade squamous intraepithelial lesion', 'ton thuong noi bieu mo vay do cao'],
  idc: ['invasive ductal carcinoma', 'invasive breast carcinoma of no special type', 'ung thu bieu mo ong xam nhap'],
  idh: ['isocitrate dehydrogenase', 'idh mutant', 'idh mutated', 'idh wildtype'],
  ilc: ['invasive lobular carcinoma', 'ung thu bieu mo tieu thuy xam nhap'],
  ipmn: ['intraductal papillary mucinous neoplasm', 'u tan sinh nhay nhu trong ong'],
  lcis: ['lobular carcinoma in situ', 'ung thu bieu mo tieu thuy tai cho'],
  lgsoc: ['low grade serous ovarian carcinoma', 'low grade serous carcinoma', 'ung thu bieu mo thanh dich do thap'],
  lsil: ['low grade squamous intraepithelial lesion', 'ton thuong noi bieu mo vay do thap'],
  mia: ['minimally invasive adenocarcinoma', 'ung thu bieu mo tuyen xam nhap toi thieu'],
  mpnst: ['malignant peripheral nerve sheath tumour', 'malignant peripheral nerve sheath tumor', 'u ac tinh bao than kinh ngoai bien'],
  mtc: ['medullary thyroid carcinoma', 'ung thu bieu mo tuy tuyen giap'],
  niftp: [
    'non-invasive follicular thyroid neoplasm with papillary-like nuclear features',
    'noninvasive follicular thyroid neoplasm with papillary like nuclear features',
    'tan sinh tuyen giap dang nang khong xam nhap voi dac diem nhan dang nhu',
    'u tan sinh dang nang khong xam nhap co dac diem nhan giong ung thu bieu mo the nhu',
  ],
  nsclc: ['non small cell lung carcinoma', 'non small cell carcinoma', 'ung thu bieu mo phoi khong te bao nho'],
  panin: ['pancreatic intraepithelial neoplasia', 'tan san noi bieu mo tuy'],
  pdac: ['pancreatic ductal adenocarcinoma', 'ung thu bieu mo tuyen ong tuy'],
  prcc: ['papillary renal cell carcinoma', 'ung thu bieu mo te bao than the nhu'],
  ptc: ['papillary thyroid carcinoma', 'ung thu bieu mo tuyen giap the nhu'],
  rcc: ['renal cell carcinoma', 'ung thu bieu mo te bao than'],
  scc: ['squamous cell carcinoma', 'ung thu bieu mo te bao vay', 'carcinom te bao vay'],
  sclc: ['small cell lung carcinoma', 'small cell carcinoma of the lung', 'ung thu bieu mo te bao nho cua phoi'],
  sll: ['small lymphocytic lymphoma', 'u lympho lympho bao nho'],
  udh: ['usual ductal hyperplasia', 'tang san ong tuyen vu thong thuong', 'qua san ong thong thuong'],
  vain: ['vaginal intraepithelial neoplasia', 'tan san noi bieu mo am dao'],
  vin: ['vulvar intraepithelial neoplasia', 'tan san noi bieu mo am ho'],
  wdlps: ['well differentiated liposarcoma', 'atypical lipomatous tumour', 'sarcoma mo mo biet hoa ro'],
}

const PATHOLOGY_RELATED_QUERIES: Record<string, string[]> = {
  adh: ['breast ductal hyperplasia'],
  hcc: ['liver tumors and tumor like lesions'],
  idc: ['invasive breast carcinoma', 'infiltrating ductal carcinoma'],
  niftp: ['thyroid follicular', 'thyroid papillary carcinoma'],
  nsclc: ['epithelial lung tumors'],
  ptc: ['thyroid papillary carcinoma'],
  sclc: ['pulmonary neuroendocrine tumors'],
  udh: ['breast ductal hyperplasia'],
}

export const normalizePathologySearch = (value: unknown) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .replace(/[^a-z0-9+/-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const flattenFields = (value: SearchField): string[] => {
  if (Array.isArray(value)) return value.flatMap(flattenFields)
  if (value === null || value === undefined) return []
  return [String(value)]
}

const wordsFor = (value: unknown) => normalizePathologySearch(value)
  .split(/[^a-z0-9]+/)
  .filter(Boolean)

const compactFor = (value: unknown) => normalizePathologySearch(value).replace(/[^a-z0-9]+/g, '')

const acronymFor = (value: unknown) => wordsFor(value)
  .filter((word) => !ACRONYM_STOP_WORDS.has(word))
  .map((word) => word.charAt(0))
  .join('')

const acronymCandidates = (fields: string[]) => new Set(fields.flatMap((field) => {
  const phrases = [field, ...field.split(/[|›,:;()[\]{}]+/)]
  return phrases
    .map(acronymFor)
    .filter((acronym) => acronym.length >= 2 && acronym.length <= 12)
}))

const createSearchContext = (fields: SearchField) => {
  const fieldList = flattenFields(fields)
  const normalizedFields = fieldList.map(normalizePathologySearch).filter(Boolean)
  const combined = normalizedFields.join(' ')
  const words = combined.split(/[^a-z0-9+/-]+/).filter(Boolean)
  return {
    normalizedFields,
    combined,
    compactFields: fieldList.map(compactFor).filter(Boolean),
    compactCombined: compactFor(combined),
    words,
    wordSet: new Set(words.flatMap((word) => word.split(/[^a-z0-9]+/).filter(Boolean))),
    acronyms: acronymCandidates(fieldList),
  }
}

const phraseMatchesContext = (phrase: string, context: ReturnType<typeof createSearchContext>) => {
  const normalizedPhrase = normalizePathologySearch(phrase)
  if (!normalizedPhrase) return false
  if (context.combined.includes(normalizedPhrase)) return true

  const compactPhrase = compactFor(phrase)
  if (compactPhrase.length >= 5 && context.compactFields.some((field) => field.includes(compactPhrase))) return true

  const phraseWords = wordsFor(phrase)
  return phraseWords.length > 1 && context.normalizedFields.some((field) => {
    const fieldWords = new Set(field.split(/[^a-z0-9+/-]+/).filter(Boolean))
    return phraseWords.every((word) => fieldWords.has(word))
  })
}

const tokenMatches = (token: string, context: ReturnType<typeof createSearchContext>) => {
  const aliases = PATHOLOGY_ALIASES[token]
  if (aliases) {
    return aliases.some((alias) => phraseMatchesContext(alias, context))
  }

  if (token.length >= 2 && context.acronyms.has(token)) return true
  return context.words.some((word) => word === token || (token.length >= 2 && word.startsWith(token)))
}

export const matchesPathologySearch = (fields: SearchField, query: unknown) => {
  const normalizedQuery = normalizePathologySearch(query)
  if (!normalizedQuery) return true

  const context = createSearchContext(fields)
  // Short abbreviations must resolve as complete concepts. A raw substring
  // would make PTC match unrelated tokens such as PTCH1.
  if (normalizedQuery.length >= 5 && context.combined.includes(normalizedQuery)) return true

  return normalizedQuery.split(/\s+/).filter(Boolean).every((token) => tokenMatches(token, context))
}

export const pathologySearchScore = (fields: SearchField, query: unknown) => {
  const normalizedQuery = normalizePathologySearch(query)
  if (!normalizedQuery) return 0

  const context = createSearchContext(fields)
  if (!normalizedQuery.split(/\s+/).every((token) => tokenMatches(token, context))) return -1

  let score = context.combined.includes(normalizedQuery) ? 120 : 0
  for (const token of normalizedQuery.split(/\s+/).filter(Boolean)) {
    const aliases = PATHOLOGY_ALIASES[token]
    if (aliases?.some((alias) => context.compactFields.some((field) => field === compactFor(alias)))) score += 100
    else if (aliases?.some((alias) => phraseMatchesContext(alias, context))) score += 70
    else if (context.acronyms.has(token)) score += 60
    else if (context.words.includes(token)) score += 40
    else score += 20
  }
  return score
}

export const pathologyAliasExpansions = (query: unknown) => {
  const tokens = normalizePathologySearch(query).split(/\s+/).filter(Boolean)
  return [...new Set(tokens.flatMap((token) => PATHOLOGY_ALIASES[token] || []))]
}

export const pathologyRelatedQueries = (query: unknown) => {
  const tokens = normalizePathologySearch(query).split(/\s+/).filter(Boolean)
  return [...new Set(tokens.flatMap((token) => PATHOLOGY_RELATED_QUERIES[token] || []))]
}
