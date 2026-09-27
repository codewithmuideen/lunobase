import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { MFA_COOKIE, verifyMfaToken } from "@/lib/security/mfa-token";

const PROTECTED = ["/dashboard", "/admin"];
const AUTH_PAGES = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Refreshes the session if needed and verifies the JWT.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = claims?.sub as string | undefined;
  const sessionId = claims?.session_id as string | undefined;

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`));
  const isAuthPage = AUTH_PAGES.includes(path);
  const isVerify = path === "/verify";

  if (!isProtected && !isAuthPage && !isVerify) return response;

  const redirectTo = (to: string, keepNext = false) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = "";
    if (keepNext) url.searchParams.set("next", path);
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!userId) {
    if (isProtected) return redirectTo("/login", true);
    if (isVerify) return redirectTo("/login");
    return response;
  }

  const mfaOk = await verifyMfaToken(request.cookies.get(MFA_COOKIE)?.value, userId, sessionId);

  if (isProtected && !mfaOk) return redirectTo("/verify");
  if ((isAuthPage || isVerify) && mfaOk) return redirectTo("/dashboard");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|icon|apple-icon|opengraph-image|robots.txt|sitemap.xml|manifest.webmanifest|api/markets|api/chart).*)"],
};
