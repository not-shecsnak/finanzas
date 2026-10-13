/** Traduce códigos de error de Supabase Auth a mensajes claros para el registro. */
const SIGNUP_MESSAGES: Record<string, string> = {
  signup_disabled: "El registro está desactivado en Supabase (Authentication → Sign In / Providers → permitir nuevos usuarios).",
  email_provider_disabled: "El acceso con correo está desactivado en Supabase (Authentication → Sign In / Providers → Email).",
  user_already_exists: "Ese correo ya tiene cuenta. Ve a la pestaña Entrar.",
  email_exists: "Ese correo ya tiene cuenta. Ve a la pestaña Entrar.",
  weak_password: "La contraseña es demasiado débil. Usa una más larga o menos común.",
  email_address_invalid: "Supabase no aceptó ese correo. Prueba con otro.",
  email_address_not_authorized: "Supabase no permite enviar correos a esa dirección con su servicio gratuito.",
  over_email_send_rate_limit: "Demasiados correos enviados. Espera unos minutos e inténtalo de nuevo.",
  over_request_rate_limit: "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
};

export const SIGNUP_FALLBACK = "No se pudo crear la cuenta. Inténtalo de nuevo en un momento.";

export const CONNECTION_MESSAGE =
  "No se pudo conectar con Supabase. Revisa que NEXT_PUBLIC_SUPABASE_URL sea la URL del proyecto (https://<id>.supabase.co) y reinicia npm run dev.";

export function signupErrorMessage(code: string | undefined, name?: string, status?: number): string {
  if (code && SIGNUP_MESSAGES[code]) return SIGNUP_MESSAGES[code];
  if (name === "AuthRetryableFetchError" || status === 0) return CONNECTION_MESSAGE;
  return SIGNUP_FALLBACK;
}
