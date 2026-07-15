import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_ATTEMPTS = 5;
const STALE_AFTER_MINUTES = 30;

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date();
  const nowIso = now.toISOString();
  const staleBeforeIso = new Date(now.getTime() - STALE_AFTER_MINUTES * 60_000).toISOString();
  const stuckBeforeIso = new Date(now.getTime() - 2 * 60_000).toISOString();

  const { data: requeued, error: requeueError } = await supabase
    .from("scheduled_notifications")
    .update({ status: "pending" })
    .eq("status", "sending")
    .lt("claimed_at", stuckBeforeIso)
    .select("id");

  if (requeueError) {
    console.error("Failed to requeue stuck 'sending' rows:", requeueError);
  } else if (requeued?.length) {
    console.log(`Requeued ${requeued.length} stuck 'sending' row(s).`);
  }

  const { data: staleRows, error: staleError } = await supabase
    .from("scheduled_notifications")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("send_at", staleBeforeIso)
    .select("id");

  if (staleError) {
    console.error("Failed to mark stale rows expired:", staleError);
  } else if (staleRows?.length) {
    console.log(`Marked ${staleRows.length} stale row(s) as expired.`);
  }

  const { data: candidates, error: fetchError } = await supabase
    .from("scheduled_notifications")
    .select("*")
    .eq("status", "pending")
    .gte("send_at", staleBeforeIso)
    .lte("send_at", nowIso);

  if (fetchError) {
    console.error("Fetch pending failed:", fetchError);
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
  }

  if (!candidates?.length) {
    return new Response(JSON.stringify({ sent: 0, failed: 0, retried: 0, claimed: 0 }), { status: 200 });
  }

  let sentCount = 0;
  let failedCount = 0;
  let retriedCount = 0;

  for (const notif of candidates) {
    const nextAttempt = (notif.attempts ?? 0) + 1;

    const { data: claimed, error: claimError } = await supabase
      .from("scheduled_notifications")
      .update({ status: "sending", attempts: nextAttempt, claimed_at: nowIso })
      .eq("id", notif.id)
      .eq("status", "pending")
      .select("id");

    if (claimError) {
      console.error(`Claim failed for ${notif.id}:`, claimError);
      continue;
    }
    if (!claimed?.length) {
      continue;
    }

    try {
      const res = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            user_id: notif.user_id,
            title: notif.title,
            body: notif.body,
          }),
        },
      );

      if (res.ok) {
        await supabase
          .from("scheduled_notifications")
          .update({ status: "sent", last_error: null })
          .eq("id", notif.id);

        await supabase.from("notifications").insert({
          user_id: notif.user_id,
          text: notif.body,
          color: "#CC1515",
          is_read: false,
          type: notif.tag ?? "reminder",
        });

        sentCount++;
        continue;
      }

      const errText = await res.text().catch(() => `HTTP ${res.status}`);
      await handleAttemptFailure(supabase, notif.id, nextAttempt, errText);
      nextAttempt >= MAX_ATTEMPTS ? failedCount++ : retriedCount++;
    } catch (e) {
      await handleAttemptFailure(supabase, notif.id, nextAttempt, String(e));
      nextAttempt >= MAX_ATTEMPTS ? failedCount++ : retriedCount++;
    }
  }

  return new Response(
    JSON.stringify({ sent: sentCount, failed: failedCount, retried: retriedCount, claimed: candidates.length }),
    { status: 200 },
  );
});

async function handleAttemptFailure(
  supabase: ReturnType<typeof createClient>,
  notifId: string,
  attempts: number,
  errorMessage: string,
) {
  const giveUp = attempts >= MAX_ATTEMPTS;
  const { error } = await supabase
    .from("scheduled_notifications")
    .update({
      status: giveUp ? "failed" : "pending",
      last_error: errorMessage.slice(0, 500),
    })
    .eq("id", notifId);

  if (error) console.error("Failed to record attempt failure:", error);
  if (giveUp) {
    console.error(`Giving up on notification ${notifId} after ${attempts} attempts: ${errorMessage}`);
  }
}
