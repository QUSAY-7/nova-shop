import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function verifyApiKey(apiKey: string | null): Promise<{ valid: boolean; storeId?: string }> {
  if (!apiKey) return { valid: false };

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase
    .from("api_keys")
    .select("store_id, active")
    .eq("api_key", apiKey)
    .single();

  if (error || !data || !data.active) return { valid: false };

  return { valid: true, storeId: data.store_id };
}
