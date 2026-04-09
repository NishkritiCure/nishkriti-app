// Supabase Edge Function — send-push-notification
// Runs on a cron schedule (every 2 min) or via HTTP trigger
// Sends queued notifications to Expo Push Notification Service

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  priority?: "default" | "normal" | "high";
}

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Get unsent notifications
  const { data: queue, error } = await supabase
    .from("notification_queue")
    .select("*, push_tokens!inner(expo_token)")
    .eq("sent", false)
    .lte("send_after", new Date().toISOString())
    .limit(100);

  if (error || !queue?.length) {
    return new Response(JSON.stringify({ sent: 0 }), { headers: { "Content-Type": "application/json" } });
  }

  // Build Expo push messages
  const messages: PushMessage[] = queue
    .filter(n => n.push_tokens?.expo_token)
    .map(n => ({
      to: n.push_tokens.expo_token,
      title: n.title,
      body: n.body,
      data: n.data ?? {},
      sound: "default",
      priority: n.data?.type === "doctor_flag" ? "high" : "default",
    }));

  if (!messages.length) {
    return new Response(JSON.stringify({ sent: 0 }), { headers: { "Content-Type": "application/json" } });
  }

  // Send to Expo
  const resp = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(messages),
  });
  const result = await resp.json();

  // Mark as sent
  const sentIds = queue.filter(n => n.push_tokens?.expo_token).map(n => n.id);
  await supabase
    .from("notification_queue")
    .update({ sent: true, sent_at: new Date().toISOString() })
    .in("id", sentIds);

  console.log(`Sent ${sentIds.length} push notifications`, result);

  return new Response(
    JSON.stringify({ sent: sentIds.length, results: result }),
    { headers: { "Content-Type": "application/json" } },
  );
});
