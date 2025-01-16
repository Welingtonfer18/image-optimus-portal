import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file uploaded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const originalFileName = file.name.replace(/[^\x00-\x7F]/g, '')
    const fileExt = originalFileName.split('.').pop()
    const optimizedPath = `optimized/${crypto.randomUUID()}.jpg`
    const originalPath = `original/${crypto.randomUUID()}.${fileExt}`

    // Upload original image
    const { error: originalUploadError } = await supabase.storage
      .from('images')
      .upload(originalPath, file, {
        contentType: file.type,
        upsert: false
      })

    if (originalUploadError) {
      throw new Error('Failed to upload original image')
    }

    // For now, we'll just store the original image since we can't use Sharp
    // In a production environment, you'd want to implement proper image optimization
    const { error: dbError } = await supabase
      .from('images')
      .insert({
        original_filename: originalFileName,
        original_path: originalPath,
        optimized_path: originalPath, // Using original path for now
        content_type: file.type,
        optimized_at: new Date().toISOString(),
      })

    if (dbError) {
      throw new Error('Failed to save image metadata')
    }

    // Get public URLs for the images
    const { data: { publicUrl: originalUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(originalPath)

    return new Response(
      JSON.stringify({ 
        message: 'Image uploaded successfully',
        originalUrl,
        optimizedUrl: originalUrl // Using original URL for now
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})