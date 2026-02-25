import { useSupabaseClient } from "./useSupabaseClient"

type SearchParams = {
    keyword?: string
    organIds?: number[]
    diagnosisIds?: number[]
    tagIds?: number[]
    status?: ('published' | 'draft' | 'in_review' | 'archived')[]
    limit?: number
    offset?: number
}

export const useCases = () => {
    const supabase = useSupabaseClient()

    const search = async (p: SearchParams) => {
        const { data, error } = await supabase.rpc('search_case_versions', {
            p_keyword: p.keyword ?? '',
            p_organ_ids: p.organIds ?? null,
            p_diagnosis_ids: p.diagnosisIds ?? null,
            p_tag_ids: p.tagIds ?? null,
            p_status: p.status ?? ['published'],
            p_limit: p.limit ?? 50,
            p_offset: p.offset ?? 0
        })
        if (error) throw error
        return data
    }

    const createCase = async (payload: { organId: number; diagnosisId: number; description: string; note?: string; publishImmediately?: boolean }) => {
        const { data, error } = await supabase.rpc('create_case_v1', {
            p_organ_id: payload.organId,
            p_diagnosis_id: payload.diagnosisId,
            p_description: payload.description,
            p_note: payload.note ?? null,
            p_publish_immediately: payload.publishImmediately ?? false
        })
        if (error) throw error
        return data as { case_id: string; version_id: string }[] | string
    }

    const clonePublished = async (caseId: string) => {
        const { data, error } = await supabase.rpc('clone_published_to_draft', { p_case_id: caseId })
        if (error) throw error
        return data as string // new version_id
    }

    const submitForReview = async (versionId: string) => {
        const { error } = await supabase.rpc('submit_for_review', { p_version_id: versionId })
        if (error) throw error
    }

    const approvePublish = async (versionId: string) => {
        const { error } = await supabase.rpc('approve_and_publish', { p_version_id: versionId })
        if (error) throw error
    }

    const archive = async (versionId: string, reason: string) => {
        const { error } = await supabase.rpc('archive_version', { p_version_id: versionId, p_reason: reason })
        if (error) throw error
    }

    return { search, createCase, clonePublished, submitForReview, approvePublish, archive }
}
