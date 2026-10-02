import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/env";

const PUBLIC_PATHS = ["/login"];

/** Ruta pública exacta (con o sin barra final); "/login-x" o "/loginfoo" no cuentan. */
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname === `${p}/`);
}

/** Redirige conservando las cookies de sesión refrescadas en `from`. */
export function redirectWithCookies(url: URL, from: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

/** Refresca la sesión y redirige a /login si no hay usuario. */
export async function updateSession(request: NextRequest) {
  const { url, anonKey } = supabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser valida el token contra Supabase (getSession no es confiable en el servidor).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isPublic = isPublicPath(request.nextUrl.pathname);

  if (!user && !isPublic) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    return redirectWithCookies(redirect, response);
  }
  if (user && isPublic) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/";
    return redirectWithCookies(redirect, response);
  }
  return response;
}
