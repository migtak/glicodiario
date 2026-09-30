import { createServerClient } from "@supabase/ssr";
import { sessaoInvalida } from "@/lib/supabase/session-check";
import { NextResponse, type NextRequest } from "next/server";

/** Páginas acessíveis sem login. */
const PUBLIC_PATHS = ["/login", "/cadastro", "/recuperar-senha", "/auth"];
/** Páginas de login/cadastro: quem já está logado vai direto para o início. */
const GUEST_ONLY_PATHS = ["/login", "/cadastro", "/recuperar-senha"];

function matches(pathname: string, paths: string[]) {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Renova a sessão do Supabase a cada requisição e protege as páginas logadas. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // Não coloque código entre createServerClient e getClaims: pode deslogar o usuário aleatoriamente.
  const { data } = await supabase.auth.getClaims();
  const loggedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  const redirectTo = (path: string, search = "") => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = search;
    const redirect = NextResponse.redirect(url);
    // preserva os cookies de sessão renovados
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  if (loggedIn) {
    const motivo = await sessaoInvalida(supabase);
    if (motivo) {
      // apaga os cookies de sessão deste navegador (o redirect abaixo leva junto)
      await supabase.auth.signOut({ scope: "local" });
      return redirectTo("/login", `?aviso=${motivo}`);
    }
  }

  if (!loggedIn && !matches(pathname, PUBLIC_PATHS)) return redirectTo("/login");
  if (loggedIn && matches(pathname, GUEST_ONLY_PATHS)) return redirectTo("/inicio");

  return response;
}
