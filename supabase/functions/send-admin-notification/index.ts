// supabase/functions/send-admin-notification/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, admin_email, admin_name, technician_name, technician_email, accepted_at } = await req.json();

    if (type === 'invite_accepted') {
      const { data, error } = await resend.emails.send({
        from: 'Your App <notifications@yourdomain.com>',
        to: [admin_email],
        subject: `Technician Invite Accepted - ${technician_name}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
              .info-box { background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10B981; margin: 15px 0; }
              .button { background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Technician Invite Accepted</h1>
              </div>
              <div class="content">
                <p>Hello ${admin_name},</p>
                <p>A technician has accepted your invitation and joined the platform.</p>
                
                <div class="info-box">
                  <h3>Technician Details:</h3>
                  <p><strong>Name:</strong> ${technician_name}</p>
                  <p><strong>Email:</strong> ${technician_email}</p>
                  <p><strong>Accepted At:</strong> ${new Date(accepted_at).toLocaleString()}</p>
                </div>
                
                <p>
                  <a href="${Deno.env.get('APP_URL')}/agents" class="button">
                    View Technicians
                  </a>
                </p>
                
                <p>Best regards,<br>Your App Team</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('Error sending email:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown notification type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});