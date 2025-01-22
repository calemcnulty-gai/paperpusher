import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

// Define types inline for the edge function
type WebhookEventType = 
  | 'ticket.created'
  | 'ticket.updated'
  | 'ticket.deleted'
  | 'ticket_message.created'
  | 'team.created'
  | 'team.updated'
  | 'team_member.added'
  | 'team_member.removed'

interface Webhook {
  id: string
  name: string
  url: string
  events: WebhookEventType[]
  is_active: boolean
  secret: string
}

interface WebhookPayload {
  event: WebhookEventType
  data: any
  timestamp: string
  webhook_id: string
}

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { webhook_id, event, data } = await req.json() as WebhookPayload

    console.log('Processing webhook delivery:', { webhook_id, event })

    // Fetch webhook configuration
    const { data: webhook, error: webhookError } = await supabaseClient
      .from('webhooks')
      .select('*')
      .eq('id', webhook_id)
      .single()

    if (webhookError || !webhook) {
      console.error('Error fetching webhook:', webhookError)
      return new Response(
        JSON.stringify({ error: 'Webhook not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!webhook.is_active) {
      console.log(`Webhook ${webhook_id} is inactive, skipping delivery`)
      return new Response(
        JSON.stringify({ message: 'Webhook is inactive' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare webhook payload
    const timestamp = new Date().toISOString()
    const payload = {
      event,
      data,
      timestamp,
    }

    // Generate signature
    const encoder = new TextEncoder()
    const message = encoder.encode(JSON.stringify(payload))
    const key = encoder.encode(webhook.secret)
    const signature = await crypto.subtle.sign(
      { name: 'HMAC', hash: 'SHA-256' },
      await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      ),
      message
    )

    // Convert signature to hex
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    console.log('Attempting webhook delivery to:', webhook.url)

    // Attempt delivery
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signatureHex,
          'X-Webhook-Event': event,
          'X-Webhook-ID': webhook_id,
          'X-Webhook-Timestamp': timestamp,
        },
        body: JSON.stringify(payload),
      })

      const responseBody = await response.text()
      console.log('Webhook delivery response:', { status: response.status, body: responseBody })

      // Record delivery attempt
      await supabaseClient
        .from('webhook_deliveries')
        .insert({
          webhook_id,
          event_type: event,
          payload,
          response_status: response.status,
          response_body: responseBody,
          attempt_count: 1,
          last_attempted_at: new Date().toISOString(),
        })

      return new Response(
        JSON.stringify({ success: true, status: response.status }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      console.error('Webhook delivery error:', error)

      // Record failed delivery attempt
      await supabaseClient
        .from('webhook_deliveries')
        .insert({
          webhook_id,
          event_type: event,
          payload,
          error_message: error.message,
          attempt_count: 1,
          last_attempted_at: new Date().toISOString(),
        })

      return new Response(
        JSON.stringify({ error: 'Webhook delivery failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})