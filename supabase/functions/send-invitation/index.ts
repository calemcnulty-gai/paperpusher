import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvitationRequest {
  email: string
  role: 'admin' | 'agent' | 'customer'
  teamId?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting invitation process...')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get request body
    const { email, role, teamId }: InvitationRequest = await req.json()
    console.log('Received request:', { email, role, teamId })

    // Get current user from auth header
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1]
    if (!authHeader) {
      console.error('No authorization header found')
      throw new Error('No authorization header')
    }

    const { data: { user: inviter }, error: userError } = await supabaseClient.auth.getUser(authHeader)
    if (userError || !inviter) {
      console.error('Error getting user:', userError)
      throw new Error('Error getting user')
    }
    console.log('Inviter found:', inviter.id)

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabaseClient
      .from('invitations')
      .insert({
        email,
        role,
        team_id: teamId,
        invited_by: inviter.id,
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Error creating invitation:', inviteError)
      throw new Error('Error creating invitation')
    }
    console.log('Invitation created:', invitation)

    // Send invitation email using Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      console.error('Missing RESEND_API_KEY')
      throw new Error('Missing RESEND_API_KEY')
    }

    const PUBLIC_SITE_URL = Deno.env.get('PUBLIC_SITE_URL')
    if (!PUBLIC_SITE_URL) {
      console.error('Missing PUBLIC_SITE_URL')
      throw new Error('Missing PUBLIC_SITE_URL')
    }

    const signUpUrl = `${PUBLIC_SITE_URL}/auth?invitation=${invitation.id}`
    console.log('Generated signup URL:', signUpUrl)
    
    console.log('Sending email via Resend...')
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'support@gauntlet.calemcnulty.com',
        to: [email],
        subject: 'You have been invited to AutoCRM',
        html: `
          <h1>Welcome to AutoCRM!</h1>
          <p>You have been invited to join AutoCRM as a ${role}.</p>
          <p>Click the link below to accept your invitation and create your account:</p>
          <p><a href="${signUpUrl}">Accept Invitation</a></p>
          <p>This invitation will expire in 7 days.</p>
        `,
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Resend API error:', errorText)
      throw new Error(`Error sending invitation email: ${errorText}`)
    }

    const emailResult = await emailResponse.json()
    console.log('Email sent successfully:', emailResult)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in send-invitation function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})