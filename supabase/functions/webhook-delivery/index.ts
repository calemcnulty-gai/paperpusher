import { createClient } from '@supabase/supabase-js';
import { Database } from '../../../src/integrations/supabase/types';
import { serve } from "https://deno.fresh.run/std@v9.6.1/http/server.ts";
import { crypto } from "https://deno.fresh.run/std@v9.6.1/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  webhook_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { webhook_id, event, data } = await req.json() as WebhookPayload;

    // Fetch webhook configuration
    const { data: webhook, error: webhookError } = await supabaseClient
      .from('webhooks')
      .select('*')
      .eq('id', webhook_id)
      .single();

    if (webhookError || !webhook) {
      console.error('Error fetching webhook:', webhookError);
      return new Response(
        JSON.stringify({ error: 'Webhook not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!webhook.is_active) {
      console.log(`Webhook ${webhook_id} is inactive, skipping delivery`);
      return new Response(
        JSON.stringify({ message: 'Webhook is inactive' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare webhook payload
    const timestamp = new Date().toISOString();
    const payload = {
      event,
      data,
      timestamp,
    };

    // Generate signature
    const encoder = new TextEncoder();
    const message = encoder.encode(JSON.stringify(payload));
    const key = encoder.encode(webhook.secret);
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
    );

    // Convert signature to hex
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

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
      });

      // Record delivery attempt
      await supabaseClient
        .from('webhook_deliveries')
        .insert({
          webhook_id,
          event_type: event,
          payload,
          response_status: response.status,
          response_body: await response.text(),
          attempt_count: 1,
          last_attempted_at: new Date().toISOString(),
        });

      return new Response(
        JSON.stringify({ success: true, status: response.status }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Webhook delivery error:', error);

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
        });

      return new Response(
        JSON.stringify({ error: 'Webhook delivery failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});