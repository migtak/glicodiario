import {
  AuthApiError,
  AuthRetryableFetchError,
  AuthSessionMissingError,
  AuthUnknownError,
} from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { motivoSaida } from "./session-check";

describe("motivoSaida: quando encerrar a sessão", () => {
  it("sem erro: mantém logado", () => expect(motivoSaida(null)).toBeNull());

  it("sessão encerrada no Supabase (convertida pela biblioteca): encerra", () => {
    expect(motivoSaida(new AuthSessionMissingError())).toBe("sessao-encerrada");
  });

  it("conta excluída: encerra com aviso de conta indisponível", () => {
    expect(motivoSaida(new AuthApiError("User from sub claim in JWT does not exist", 403, "user_not_found"))).toBe(
      "conta-indisponivel",
    );
  });

  it.each(["session_not_found", "session_expired", "bad_jwt"])("código %s: encerra", (code) => {
    expect(motivoSaida(new AuthApiError("x", 403, code))).toBe("sessao-encerrada");
  });

  describe("falhas de rede ou do servidor NÃO deslogam", () => {
    it("sem conexão", () => expect(motivoSaida(new AuthRetryableFetchError("fetch failed", 0))).toBeNull());
    it("servidor fora do ar (503)", () =>
      expect(motivoSaida(new AuthRetryableFetchError("Service Unavailable", 503))).toBeNull());
    it("resposta estranha", () => expect(motivoSaida(new AuthUnknownError("?", null))).toBeNull());
    it("limite de requisições", () =>
      expect(motivoSaida(new AuthApiError("too many", 429, "over_request_rate_limit"))).toBeNull());
  });
});
