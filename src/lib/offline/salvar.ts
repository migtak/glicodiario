/**
 * Ponte entre os formulários e a fila offline. Só roda no navegador.
 */
import { unstable_rethrow } from "next/navigation";
import type { TipoRegistro } from "@/lib/records";
import { enfileirar, novoId } from "./queue";

type Acao<S> = (prev: S, formData: FormData) => Promise<S>;

export const SEM_INTERNET_EDICAO =
  "Sem internet: alterações e exclusões só podem ser salvas com conexão. Tente de novo quando a internet voltar.";

/**
 * Criação: tenta salvar no servidor; sem rede (ou se o envio falhar no caminho),
 * guarda no aparelho com o mesmo id, e a fila envia depois.
 */
export async function criarOuEnfileirar<S>(
  acao: Acao<S>,
  prev: S,
  formData: FormData,
  opts: { userId: string; tipo: TipoRegistro; aoEnfileirar: (row: Record<string, unknown>) => S; erro: (msg: string) => S },
): Promise<S> {
  const id = novoId();
  formData.set("novo_id", id);
  if (navigator.onLine) {
    try {
      return await acao(prev, formData);
    } catch (e) {
      unstable_rethrow(e); // redirecionamentos do Next não são falha de rede
    }
  }
  const r = await enfileirar(opts.userId, opts.tipo, id, formData);
  return "error" in r ? opts.erro(r.error) : opts.aoEnfileirar(r.row);
}

/** Edição: exige internet; sem rede, devolve uma mensagem clara em vez de quebrar a tela. */
export async function editarComRede<S>(acao: Acao<S>, prev: S, formData: FormData, erro: (msg: string) => S): Promise<S> {
  if (!navigator.onLine) return erro(SEM_INTERNET_EDICAO);
  try {
    return await acao(prev, formData);
  } catch (e) {
    unstable_rethrow(e);
    return erro(SEM_INTERNET_EDICAO);
  }
}
