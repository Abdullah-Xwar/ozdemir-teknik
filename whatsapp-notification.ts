// Supabase Edge Function: WhatsApp Cloud API bildirimi
// Dosya: supabase/functions/whatsapp-notification/index.ts
// Supabase Dashboard'daki Database Webhook bu fonksiyonu service_requests INSERT olayında çağırır.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") ?? "";
const ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") ?? "";
const PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") ?? "";
const TO_NUMBER = Deno.env.get("WHATSAPP_TO") ?? "";
const GRAPH_VERSION = Deno.env.get("META_GRAPH_VERSION") ?? "v23.0";
const TEMPLATE_NAME = Deno.env.get("WHATSAPP_TEMPLATE_NAME") ?? "new_service_request";
const TEMPLATE_LANGUAGE = Deno.env.get("WHATSAPP_TEMPLATE_LANGUAGE") ?? "tr";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

serve(async (req) => {
  try {
    if (req.method !== "POST") return json({ error: "POST required" }, 405);

    if (WEBHOOK_SECRET) {
      const incoming = req.headers.get("x-webhook-secret") ?? "";
      if (incoming !== WEBHOOK_SECRET) return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const record = body.record ?? body;

    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID || !TO_NUMBER) {
      return json({ error: "WhatsApp secrets are not configured" }, 500);
    }

    const customerName = String(record.customer_name ?? "Müşteri");
    const device = `${record.device_type ?? "Cihaz"} ${record.device_model ?? ""}`.trim();
    const problem = String(record.problem ?? "Belirtilmemiş");
    const trackingCode = String(record.tracking_code ?? "");

    // WhatsApp Manager'da new_service_request isimli UTILITY template oluştur:
    // {{1}} müşteri adı, {{2}} cihaz, {{3}} sorun, {{4}} takip kodu.
    const payload = {
      messaging_product: "whatsapp",
      to: TO_NUMBER,
      type: "template",
      template: {
        name: TEMPLATE_NAME,
        language: { code: TEMPLATE_LANGUAGE },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: customerName.slice(0, 100) },
              { type: "text", text: device.slice(0, 150) },
              { type: "text", text: problem.slice(0, 500) },
              { type: "text", text: trackingCode },
            ],
          },
        ],
      },
    };

    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const result = await response.json();
    if (!response.ok) return json({ error: "WhatsApp API error", details: result }, 502);

    return json({ ok: true, whatsapp: result });
  } catch (error) {
    return json({ error: String(error) }, 500);
  }
});
