/**
 * Fila de registros criados sem internet (PROJETO.md §7, offline-first).
 * Fica no IndexedDB do navegador (Dexie) e é enviada direto ao Supabase quando a
 * conexão volta. Só roda no navegador.
 */
import Dexie, { liveQuery, type Table } from "dexie";
import { createClient } from "@/lib/supabase/client";
import {
  campoDe,
  parseActivity,
  parseMeal,
  parseReading,
  parseWeight,
} from "@/lib/parse-records";
import type { TipoRegistro } from "@/lib/records";

export type Pendente = {
  /** mesmo id que o registro terá no banco (evita duplicar ao reenviar) */
  id: string;
  /** dono do registro: nunca enviar com a sessão de outra pessoa */
  userId: string;
  tipo: TipoRegistro;
  row: Record<string, unknown>;
  criadoEm: number;
  /** último erro de envio que não foi de rede (dados recusados pelo banco etc.) */
  erro?: string;
};

class FilaDb extends Dexie {
  pendentes!: Table<Pendente, string>;
  constructor() {
    super("glicodiario");
    this.version(1).stores({ pendentes: "id, userId, criadoEm" });
  }
}

let db: FilaDb | null = null;
const getDb = () => (db ??= new FilaDb());

/** UUID v4. `crypto.randomUUID` só existe em HTTPS/localhost; no Wi-Fi local (http) usa o fallback. */
export function novoId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const PARSERS = {
  glicemia: parseReading,
  refeicao: parseMeal,
  atividade: parseActivity,
  peso: parseWeight,
} as const;

const TABELAS = {
  glicemia: "glucose_readings",
  refeicao: "meals",
  atividade: "activities",
  peso: "weights",
} as const satisfies Record<TipoRegistro, string>;

/**
 * Valida o formulário com as mesmas regras do servidor e guarda no aparelho.
 * Devolve o erro de validação, se houver.
 */
export async function enfileirar(
  userId: string,
  tipo: TipoRegistro,
  id: string,
  formData: FormData,
): Promise<{ error: string } | { row: Record<string, unknown> }> {
  const parsed = PARSERS[tipo](campoDe(formData));
  if (!parsed.ok) return { error: parsed.error };
  const row = parsed.row as Record<string, unknown>;
  await getDb().pendentes.put({ id, userId, tipo, row, criadoEm: Date.now() });
  return { row };
}

/** Observa os pendentes de um usuário (atualiza sozinho quando a fila muda). */
export function observarPendentes(userId: string, onChange: (lista: Pendente[]) => void) {
  const sub = liveQuery(() => getDb().pendentes.where("userId").equals(userId).sortBy("criadoEm")).subscribe({
    next: onChange,
    error: () => onChange([]),
  });
  return () => sub.unsubscribe();
}

export async function descartar(id: string) {
  await getDb().pendentes.delete(id);
}

let emAndamento: Promise<ResultadoSync> | null = null;
export type ResultadoSync = { enviados: number; comErro: number; semRede: boolean };

/** Envia os pendentes do usuário, em ordem de criação. Nunca roda duas vezes ao mesmo tempo. */
export function sincronizar(userId: string): Promise<ResultadoSync> {
  emAndamento ??= enviar(userId).finally(() => (emAndamento = null));
  return emAndamento;
}

async function enviar(userId: string): Promise<ResultadoSync> {
  const resultado: ResultadoSync = { enviados: 0, comErro: 0, semRede: false };
  const fila = await getDb().pendentes.where("userId").equals(userId).sortBy("criadoEm");
  if (!fila.length) return resultado;

  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  // sessão de outra pessoa (ou nenhuma): não envia nada
  if (data.session?.user.id !== userId) return resultado;

  for (const p of fila) {
    const { error } = await supabase.from(TABELAS[p.tipo]).insert({ ...p.row, id: p.id } as never);
    // 23505 = já existe com esse id: foi enviado antes (ex.: a resposta se perdeu)
    if (!error || error.code === "23505") {
      await getDb().pendentes.delete(p.id);
      resultado.enviados++;
    } else if (!error.code || error.code === "PGRST301") {
      // sem código = falha de rede; PGRST301 = login expirado: tenta de novo mais tarde
      resultado.semRede = true;
      break;
    } else {
      await getDb().pendentes.update(p.id, { erro: error.message });
      resultado.comErro++;
    }
  }
  return resultado;
}
