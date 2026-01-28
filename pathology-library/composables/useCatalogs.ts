import { useState } from "nuxt/app"
import { useSupabaseClient } from "./useSupabaseClient"

export const useCatalogs = () => {
    const supabase = useSupabaseClient()

    const organs = useState<any[]>('organs', () => [])
    const diagnoses = useState<any[]>('diagnoses', () => [])
    const tags = useState<any[]>('tags', () => [])

    const loadAll = async () => {
        const [o, d, t] = await Promise.all([
            supabase.from('organs').select('id,name,parent_id').order('name'),
            supabase.from('diagnoses').select('id,name,parent_id,icdo_code').order('name'),
            supabase.from('tags').select('id,name').order('name')
        ])
        if (o.error) throw o.error
        if (d.error) throw d.error
        if (t.error) throw t.error
        organs.value = o.data ?? []
        diagnoses.value = d.data ?? []
        tags.value = t.data ?? []
    }

    return { organs, diagnoses, tags, loadAll }
}
