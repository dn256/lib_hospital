import { computed } from 'vue'

export const useLibraryLanguage = () => {
  const locale = useState<'vi' | 'en'>('pathologylib-language', () => 'vi')
  const english = computed(() => locale.value === 'en')
  const label = (vi: string, en: string) => english.value ? en : vi
  return { locale, english, label }
}
