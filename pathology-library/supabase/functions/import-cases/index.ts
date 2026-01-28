import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { parse } from "https://deno.land/std@0.168.0/encoding/csv.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                db: { schema: 'lib_hospital' }
            }
        )

        // Validate content-type
        const contentType = req.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Content-Type must be application/json");
        }

        const { storagePath } = await req.json()
        if (!storagePath) throw new Error('storagePath is required')

        // 1. Download CSV
        const { data: fileData, error: dlError } = await supabase.storage
            .from('imports')
            .download(storagePath)

        if (dlError) throw new Error(`Storage error: ${dlError.message}`)
        if (!fileData) throw new Error('File not found in storage')

        const text = await fileData.text()

        // 2. Parse CSV
        // Mapping columns from CSV to object properties
        const rows = parse(text, {
            skipFirstRow: true,
            columns: ['organ_name', 'diagnosis_name', 'microscopic_description', 'tags', 'note']
        }) as any[]

        if (!rows || rows.length === 0) {
            return new Response(
                JSON.stringify({ success: true, message: 'CSV is empty', successCount: 0 }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 3. Load Catalogs safely
        const { data: organs } = await supabase.from('organs').select('id, name')
        const { data: diagnoses } = await supabase.from('diagnoses').select('id, name')

        const organMap = new Map((organs || [])
            .filter(o => o.name)
            .map((o: any) => [o.name.toLowerCase().trim(), o.id]))

        const diagnosisMap = new Map((diagnoses || [])
            .filter(d => d.name)
            .map((d: any) => [d.name.toLowerCase().trim(), d.id]))

        const errors = []
        let successCount = 0

        // 4. Process Rows
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            try {
                const organName = row.organ_name?.toString().toLowerCase().trim()
                const diagnosisName = row.diagnosis_name?.toString().toLowerCase().trim()

                const organId = organMap.get(organName)
                const diagnosisId = diagnosisMap.get(diagnosisName)

                if (!organId) throw new Error(`Organ not found in database: "${row.organ_name}"`)
                if (!diagnosisId) throw new Error(`Diagnosis not found in database: "${row.diagnosis_name}"`)

                // Create Case via RPC
                const { error: cErr } = await supabase.rpc('create_case_v1', {
                    p_organ_id: organId,
                    p_diagnosis_id: diagnosisId,
                    p_description: row.microscopic_description || '',
                    p_note: row.note || null
                })

                if (cErr) throw new Error(`Database error: ${cErr.message}`)

                successCount++
            } catch (err: any) {
                errors.push({
                    rowIndex: i + 2, // +2 because 1-indexed and skipped header
                    message: err.message,
                    rowData: row
                })
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                total: rows.length,
                successCount,
                errorCount: errors.length,
                errors
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Import function error:', error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
