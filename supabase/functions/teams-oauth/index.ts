// supabase/functions/teams-oauth/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

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
    const { code, userId, redirectUri } = await req.json()
    
    console.log('Processing OAuth callback for user:', userId);

    if (!code) {
      throw new Error('Authorization code is required')
    }

    // Get environment variables
    const clientId = Deno.env.get('TEAMS_CLIENT_ID')
    const clientSecret = Deno.env.get('TEAMS_CLIENT_SECRET')
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'

    console.log('Env check:', { 
      hasClientId: !!clientId, 
      hasClientSecret: !!clientSecret,
      siteUrl 
    });

    if (!clientId || !clientSecret) {
      throw new Error('Teams OAuth configuration is missing')
    }

    // Use provided redirectUri or default
    const finalRedirectUri = redirectUri || `${siteUrl}/teams-callback`
    
    console.log('Exchanging code for token...', {
      clientId: clientId.substring(0, 8) + '...',
      redirectUri: finalRedirectUri,
      codeLength: code.length
    });

    // Exchange code for tokens
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: finalRedirectUri,
        grant_type: 'authorization_code',
        scope: 'User.Read Channel.Read.All ChannelMessage.Send TeamsAppInstallation.ReadWriteForUser TeamsActivity.Send',
      }),
    })

    const responseText = await tokenResponse.text()
    console.log('Token response status:', tokenResponse.status);
    console.log('Token response body:', responseText);

    if (!tokenResponse.ok) {
      throw new Error(`Microsoft OAuth error: ${tokenResponse.status} - ${responseText}`)
    }

    const tokens = JSON.parse(responseText)

    return new Response(
      JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Teams OAuth function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})