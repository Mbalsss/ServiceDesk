import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
    );
  }

  try {
    // Get environment variables (use custom names, not starting with SUPABASE_)
    const supabaseUrl = Deno.env.get("PROJECT_URL");
    const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { email, full_name, role = "technician", department = null } = await req.json();

    if (!email || !full_name) {
      return new Response(
        JSON.stringify({ error: "Email and full name are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const validRoles = ["admin", "technician", "user"];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: `Role must be one of: ${validRoles.join(", ")}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (userError) throw new Error("Failed to check existing user");

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "User with this email already exists" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    // Invite user via Auth
    const { data: authData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email.toLowerCase(),
      { data: { full_name, role, department } }
    );

    if (inviteError) {
      return new Response(
        JSON.stringify({ error: `Failed to send invitation: ${inviteError.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Insert profile into table (omit created_at/updated_at)
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      email: email.toLowerCase(),
      full_name,
      role,
      department,
      available: role === "technician" ? true : null,
    });

    if (profileError) {
      // Attempt to cleanup auth user if profile insert fails
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        console.error("Failed to cleanup auth user:", deleteError);
      }
      throw new Error("Failed to create user profile");
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "User invited successfully",
        user: {
          id: authData.user.id,
          email: email.toLowerCase(),
          full_name,
          role,
          department,
          available: role === "technician" ? true : null,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});