import type { AuthError } from "@supabase/supabase-js";

/** Traduz os erros do Supabase Auth para mensagens em português. */
export function authErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "E-mail ou senha incorretos.";
    case "email_not_confirmed":
      return "Confirme seu e-mail antes de entrar. Procure o link na sua caixa de entrada (e no spam).";
    case "user_already_exists":
    case "email_exists":
      return "Já existe uma conta com este e-mail.";
    case "weak_password":
      return "Senha muito fraca. Use pelo menos 8 caracteres, misturando letras e números.";
    case "same_password":
      return "A nova senha precisa ser diferente da atual.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.";
    case "email_address_invalid":
      return "E-mail inválido.";
    default:
      return "Algo deu errado. Tente novamente em instantes.";
  }
}
