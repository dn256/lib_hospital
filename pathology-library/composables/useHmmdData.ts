export const useHmmdData = () => {
  const dataset = useState<any>('hmmd-dataset', () => null)
  const loading = useState('hmmd-loading', () => false)
  const error = useState<string | null>('hmmd-error', () => null)

  const load = async () => {
    if (dataset.value || loading.value) return
    loading.value = true
    error.value = null

    try {
      const supabase = useSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Phiên đăng nhập không còn hiệu lực.')

      dataset.value = await $fetch('/api/hmmd', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
    } catch (loadError: any) {
      error.value = loadError?.data?.statusMessage || loadError?.message || 'Không thể tải kho HMMD.'
      throw loadError
    } finally {
      loading.value = false
    }
  }

  return { dataset, loading, error, load }
}
