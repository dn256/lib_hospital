export const libraryModules = [
  { id: 'library', vi: 'Thư viện ca bệnh', en: 'Case Library', icon: 'mdi-bookshelf', path: '/library' },
  { id: 'atlas', vi: 'Atlas giải phẫu bệnh', en: 'Pathology Atlas', icon: 'mdi-microscope', path: '/atlas' },
  { id: 'hmmd', vi: 'Hóa mô miễn dịch', en: 'Immunohistochemistry', icon: 'mdi-test-tube', path: '/hmmd' },
  { id: 'icdo', vi: 'ICD-O-4', en: 'ICD-O-4', icon: 'mdi-code-tags', path: '/icdo' },
  { id: 'who', vi: 'Phân loại WHO', en: 'WHO Classification', icon: 'mdi-book-open-page-variant', path: '/atlas?view=who' },
  { id: 'images', vi: 'Kho ảnh', en: 'Image Collections', icon: 'mdi-image-multiple-outline', path: '/atlas?view=images' },
] as const

export type LibraryModuleId = typeof libraryModules[number]['id']

export const libraryModule = (id: LibraryModuleId) => libraryModules.find(item => item.id === id)!
