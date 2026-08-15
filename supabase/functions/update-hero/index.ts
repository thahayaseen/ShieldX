import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "@supabase/supabase-js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get the Authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    // 2. Initialize Supabase client
    // Use the ANON key, but authenticate with the user's JWT to respect RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // 3. Verify the JWT and get the user's email
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Invalid or expired token')
    }

    // 4. Verify Admin Status
    // Use the Service Role Key just to check the admin_users table securely
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: adminRecord, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('email')
      .eq('email', user.email)
      .single()

    if (adminError || !adminRecord) {
      return new Response(
        JSON.stringify({ error: 'Access denied: User is not an admin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Parse the Request Body
    const { hero_id, powers, type, status } = await req.json()
    if (!hero_id) {
      throw new Error('Missing hero_id parameter')
    }

    // 6. Perform the Update using the Admin Client
    // (Since this is an admin action, we use the service role key to bypass standard RLS restrictions if any)
    const updatePayload: any = {}
    if (powers) updatePayload.powers = powers
    if (type) updatePayload.codename = type // Example mapping
    if (status) updatePayload.status = status

    const { data: updatedHero, error: updateError } = await supabaseAdmin
      .from('heroes')
      .update(updatePayload)
      .eq('id', hero_id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // 7. Return Success
    return new Response(
      JSON.stringify({ success: true, hero: updatedHero }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
