// supabase/functions/resend-invite/index.ts
//
// Re-sends an invite email to a user who lost / expired / already-used
// their original invite link. Called from SetPasswordScreen when the
// user taps "Request New Link" in the invalid-link state.
//
// Behavior:
//   - Looks up the user by email in Supabase Auth.
//   - If the user does NOT exist → returns 404 (caller should ask the
//     admin to invite them first).
//   - If the user exists AND has never signed in (invited but not
//     accepted) → calls inviteUserByEmail again with the same
//     redirectTo, which generates a fresh link and emails it.
//   - If the user exists AND has already signed in (accepted the
//     invite, set a password, etc.) → refuses with 409. We don't want
//     to silently re-invite an active user — that would let an
//     attacker trigger unsolicited password-reset emails just by
//     knowing an email address. The caller should use the regular
//     "Change Password" / "Forgot Password" flow instead.
//
// Deploy with:
//   supabase functions deploy resend-invite
//
// Requires:
//   supabase secrets set SERVICE_ROLE_KEY=...   (same as invite-user)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const INVITE_REDIRECT_URL = "onyxcrm://reset-password";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'email'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!,
    );

    // ── Look up the user by email ───────────────────────────────────
    const { data: listData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error("resend-invite listUsers error:", listError);
      return new Response(
        JSON.stringify({ error: "Failed to look up user." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // listUsers returns paginated results; for a small team this is fine.
    // If the project grows large, switch to generating a recovery link
    // directly via auth.admin.generateLink({ type: 'invite', email }).
    const existingUser = (listData.users ?? []).find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (!existingUser) {
      return new Response(
        JSON.stringify({
          error: "No account found for this email. Ask an admin to invite you first.",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // If the user already accepted (has a last sign-in), refuse to
    // silently re-invite — that would be a security hole.
    if (existingUser.last_sign_in_at) {
      return new Response(
        JSON.stringify({
          error:
            "This account has already been activated. Use the 'Change Password' " +
            "option on the login screen instead.",
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Re-send the invite ──────────────────────────────────────────
    // inviteUserByEmail is idempotent for already-invited-but-not-yet-
    // accepted users: it just generates a fresh token and emails it.
    // The old token is invalidated automatically.
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      { redirectTo: INVITE_REDIRECT_URL },
    );

    if (inviteError) {
      console.error("resend-invite inviteUserByEmail error:", inviteError);
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("resend-invite unexpected error:", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
