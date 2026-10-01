"use server";

import { redirect } from "next/navigation";
import { signupErrorMessage } from "@/lib/auth-errors";
import { credentialsSchema } from "@/lib/auth-schema";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; info?: string };

function parse(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Mensaje genérico: no revela si el correo existe.
  if (error) return { error: "Correo o contraseña incorrectos" };
  redirect("/");
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);
  if (error) {
    console.error("[signup] código:", error.code, "estado:", error.status);
    return { error: signupErrorMessage(error.code) };
  }
  if (!data.session) return { info: "Revisa tu correo para confirmar la cuenta y luego inicia sesión." };
  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
