import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

export const supabaseAnon = createClient(
  env.supabaseUrl,
  env.supabaseAnonKey,
  clientOptions,
);

export const supabaseAdmin = createClient(
  env.supabaseUrl,
  env.supabaseServiceRoleKey,
  clientOptions,
);

export async function getProfileByAuthUserId(authUserId) {
  if (!authUserId) return null;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, auth_user_id, email, full_name, role, is_active")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to fetch profile: ${error.message}`);
  }

  return data;
}
