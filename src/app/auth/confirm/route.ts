import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Destino dos links enviados por e-mail (confirmação de cadastro e recuperação de senha).
 * Aceita tanto o fluxo PKCE (?code=) quanto o de token (?token_hash=&type=).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "/inicio";
  // só permite redirecionar para páginas do próprio app
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/inicio";

  const supabase = await createClient();
  let ok = false;

  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ type, token_hash: tokenHash })).error;
  }

  if (ok) return NextResponse.redirect(`${origin}${next}`);
  return NextResponse.redirect(`${origin}/login?aviso=link`);
}
