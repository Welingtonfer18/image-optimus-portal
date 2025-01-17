import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const originalFileName = file.name.replace(/[^\x00-\x7F]/g, '')
    const fileExt = originalFileName.split('.').pop() || 'jpg'
    const optimizedPath = `optimized/${crypto.randomUUID()}.${fileExt}`
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

    // For now, we'll use the same image for both original and optimized
    // since we can't use Sharp in Edge Functions
    const { error: optimizedUploadError } = await supabase.storage
      .from('images')
      .upload(optimizedPath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (optimizedUploadError) {
      throw new Error('Failed to upload optimized image')
    }

    // Get public URLs
    const { data: { publicUrl: optimizedUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(optimizedPath)

    const { data: { publicUrl: originalUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(originalPath)

    // Calculate sizes
    const originalSize = buffer.length
    const optimizedSize = buffer.length // In this case, they're the same
    const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100

    // Save metadata
    const { error: dbError } = await supabase
      .from('images')
      .insert({
        original_filename: originalFileName,
        original_path: originalPath,
        optimized_path: optimizedPath,
        content_type: file.type,
        optimized_at: new Date().toISOString(),
        original_size: originalSize,
        optimized_size: optimizedSize,
      })

    if (dbError) {
      throw new Error('Failed to save image metadata')
    }

    return new Response(
      JSON.stringify({ 
        message: 'Image processed successfully',
        originalUrl,
        optimizedUrl,
        originalSize,
        optimizedSize,
        compressionRatio: compressionRatio.toFixed(2)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in optimize-image function:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})