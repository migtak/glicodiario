import { isAuthApiError, isAuthSessionMissingError, type AuthError, type SupabaseClient } from "@supabase/supabase-js";

/**
 * O crachá de login (JWT) continua com assinatura válida por até 1h mesmo depois
 * que a conta é excluída ou a sessão é encerrada em outro lugar. Por isso, além de
 * checar a assinatura, perguntamos ao Supabase se usuário e sessão ainda existem.
 * Falhas de rede NÃO deslogam: só uma resposta clara de "não existe".
 */
export async function sessaoInvalida(supabase: SupabaseClient): Promise<MotivoSaida | null> {
  const { error } = await supabase.auth.getUser();
  return motivoSaida(error);
}

export type MotivoSaida = "conta-indisponivel" | "sessao-encerrada";

/** Decide, pela resposta do Supabase, se a sessão deve ser encerrada (e por quê). */
export function motivoSaida(error: AuthError | null): MotivoSaida | null {
  if (!error) return null;
  // o Supabase respondeu "session_not_found": a biblioteca converte nesse erro
  // (só chega aqui quando o navegador tinha uma sessão, então ela foi encerrada)
  if (isAuthSessionMissingError(error)) return "sessao-encerrada";
  if (!isAuthApiError(error)) return null; // rede fora do ar, servidor com erro etc.
  if (error.code === "user_not_found") return "conta-indisponivel";
  if (error.code === "session_not_found" || error.code === "session_expired" || error.code === "bad_jwt") {
    return "sessao-encerrada";
  }
  return null;
}
