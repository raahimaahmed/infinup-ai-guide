import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  let event: Stripe.Event;

  if (signature && webhookSecret) {
    const body = await req.text();
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
    }
  } else {
    // Fallback: parse body directly (for testing without webhook secret)
    const body = await req.json();
    event = body as Stripe.Event;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const credits = parseInt(session.metadata?.credits || "0");
    const packId = session.metadata?.pack_id;

    if (!userId || credits <= 0) {
      console.error("Missing metadata:", session.metadata);
      return new Response(JSON.stringify({ error: "Missing metadata" }), { status: 400 });
    }

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Add credits to user balance
    const { data: existing } = await supabaseAdmin
      .from("user_credits")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (existing) {
      await supabaseAdmin
        .from("user_credits")
        .update({ balance: existing.balance + credits })
        .eq("user_id", userId);
    } else {
      await supabaseAdmin
        .from("user_credits")
        .insert({ user_id: userId, balance: credits });
    }

    // Log the transaction
    await supabaseAdmin.from("credit_transactions").insert({
      user_id: userId,
      amount: credits,
      type: "purchase",
      description: `Purchased ${packId} pack (${credits} credits)`,
      stripe_session_id: session.id,
    });

    console.log(`✅ Added ${credits} credits to user ${userId}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
