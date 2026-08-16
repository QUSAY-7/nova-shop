import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getShippingAdapter } from "../adapters/shipping/registry.js";
import { verifyApiKey } from "../_shared/verify-key.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
);

Deno.serve(async (req) => {
  try {
    const apiKey = req.headers.get("x-api-key");
    const auth = await verifyApiKey(apiKey);

    if (!auth.valid) {
      return new Response(JSON.stringify({ error: "مفتاح API غير صالح" }), { status: 401 });
    }

    const { order } = await req.json();
    const storeId = auth.storeId;

    const { data: settings, error } = await supabase
      .from("store_settings")
      .select("shipping_provider, shipping_config")
      .eq("store_id", storeId)
      .single();

    if (error || !settings) {
      return new Response(JSON.stringify({ error: "إعدادات المتجر غير موجودة" }), { status: 404 });
    }

    const adapter = getShippingAdapter(settings.shipping_provider);
    const result = await adapter.createShipment(order, settings.shipping_config);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});