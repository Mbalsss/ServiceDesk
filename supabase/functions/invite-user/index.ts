import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET, PUT, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        "Access-Control-Max-Age": "86400",
      }, 
      status: 200 
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    const { record, table_name, operation } = await req.json();

    if (!record) {
      return new Response(
        JSON.stringify({ error: "Record data is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`🎫 Processing ticket notification: ${operation} on ${table_name}`);

    // Your notification logic here
    // Example: Send email, Slack message, etc.
    
    // Example - Get related user information
    const { data: technician, error: techError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", record.technician_id)
      .single();

    if (techError) {
      console.warn("Could not fetch technician details:", techError.message);
    }

    // Example notification payload
    const notificationData = {
      ticket_id: record.id,
      ticket_title: record.title,
      ticket_priority: record.priority,
      technician: technician?.full_name || "Unassigned",
      operation: operation,
      timestamp: new Date().toISOString()
    };

    console.log("📤 Sending ticket notification:", notificationData);

    // Here you can integrate with:
    // - Email service (Resend, SendGrid, etc.)
    // - Slack webhook
    // - SMS service
    // - Internal notification system

    // Example: Send to Slack webhook
    /*
    const slackWebhookUrl = Deno.env.get("SLACK_WEBHOOK_URL");
    if (slackWebhookUrl) {
      await fetch(slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🎫 New Ticket: ${record.title}\nPriority: ${record.priority}\nTechnician: ${technician?.full_name || "Unassigned"}`
        })
      });
    }
    */

    return new Response(
      JSON.stringify({
        success: true,
        message: "Ticket notification sent successfully",
        data: notificationData
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Unexpected error in ticket notification:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});