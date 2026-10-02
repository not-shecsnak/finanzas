import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Cliente de Supabase + usuario validado contra Auth; redirige a /login si no hay sesión. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}
